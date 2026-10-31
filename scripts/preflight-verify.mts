/**
 * Walks the Track A session preflight on a production build in Chromium.
 *
 * Runs on demand with `pnpm preflight:verify`. It is not part of CI. The
 * conditions come from the Track A Session Preflight in
 * `docs/plans/resume-builder-validation.md` and consent item 7 in
 * `docs/notes/2026-09-02-moderated-completion-test-protocol.md`.
 *
 * `--skip-build` reuses the existing `.next` build.
 *
 * The network guard proves it can fail on every run: an intentional request
 * must be captured before any workflow check counts.
 */

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";

import { RESUME_DRAFT_STORAGE_KEY } from "../app/resume-model.mts";
import {
  LOCAL_PHOTO_DATABASE_NAME,
  LOCAL_PHOTO_STORE_NAME,
} from "../app/local-photo-store.mts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROBE_PATH = "/photo-network-guard-probe";
const IMPORT_FILE_NAME = "synthetic-import.pdf";
const PDF_INPUT = 'input[type=file][accept=".pdf,application/pdf"]';
const PHOTO_DESCRIPTIONS = ["첫 접시 설명", "둘째 접시 설명", "셋째 접시 설명"];
const EDITED_DESCRIPTION = "첫 접시 설명 · 수정함";
const PARTICIPANT_NAME = "검증 참가자";
const PARTICIPANT_EMAIL = "participant@example.com";

type CapturedRequest = {
  method: string;
  url: string;
  postData: string;
};

type Guard = {
  armed: boolean;
  hits: CapturedRequest[];
};

type SheetPhotos = {
  profile: number;
  careerPhotos: number;
};

const results: { name: string; pass: boolean; detail: string }[] = [];

function record(name: string, pass: boolean, detail = "") {
  results.push({ name, pass, detail });
  console.log(
    `${pass ? "pass" : "FAIL"}  ${name}${detail ? ` | ${detail}` : ""}`,
  );
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (address === null || typeof address === "string") {
        reject(new Error("Could not read the listening port."));
        return;
      }

      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(baseUrl: string, child: ChildProcess) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next start exited with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(baseUrl);

      if (response.ok) {
        return;
      }
    } catch {
      // The server is not listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("next start did not answer within 60 seconds.");
}

// Listens on the context so requests from workers are captured as well.
// Page loads happen with the guard disarmed; everything after them counts.
function attachGuard(context: BrowserContext): Guard {
  const guard: Guard = { armed: false, hits: [] };

  context.on("request", (request) => {
    const url = request.url();

    if (!guard.armed || !/^https?:/.test(url)) {
      return;
    }

    guard.hits.push({
      method: request.method(),
      url,
      postData: request.postData() ?? "",
    });
  });

  return guard;
}

function describe(hits: CapturedRequest[]) {
  return hits
    .map((hit) => `${hit.method} ${new URL(hit.url).pathname}`)
    .join(", ");
}

function carriesAny(hits: CapturedRequest[], secrets: string[]) {
  return hits.some(
    (hit) =>
      /blob:/.test(hit.url) ||
      /blob:/.test(hit.postData) ||
      secrets.some(
        (secret) => hit.url.includes(secret) || hit.postData.includes(secret),
      ),
  );
}

function checkNoRequest(label: string, guard: Guard, secrets: string[]) {
  record(
    `${label}: no HTTP or HTTPS request`,
    guard.hits.length === 0,
    describe(guard.hits),
  );
  record(
    `${label}: no request carries a photo, blob URL, description, or document`,
    !carriesAny(guard.hits, secrets),
  );
  guard.hits = [];
}

async function proveGuardFails(page: Page, guard: Guard) {
  guard.armed = true;
  guard.hits = [];
  await page.evaluate(
    (probe) => fetch(probe).catch(() => undefined),
    PROBE_PATH,
  );
  await page.waitForTimeout(500);
  record(
    "network guard reports a failure on an intentional request",
    guard.hits.some((hit) => new URL(hit.url).pathname === PROBE_PATH),
  );
  guard.hits = [];
}

async function openFresh(
  browser: Browser,
  baseUrl: string,
): Promise<{ context: BrowserContext; page: Page; guard: Guard }> {
  const context = await browser.newContext();
  const guard = attachGuard(context);
  await context.addInitScript(() => {
    const target = window as Window & { __printRequested?: boolean };
    target.__printRequested = false;
    window.print = () => {
      target.__printRequested = true;
    };
  });
  const page = await context.newPage();
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(baseUrl);
  await page.waitForLoadState("networkidle");
  await proveGuardFails(page, guard);
  return { context, page, guard };
}

async function makeImportPdf(browser: Browser): Promise<Buffer> {
  const page = await browser.newPage();

  try {
    await page.setContent(
      "<main><h1>Synthetic import</h1><p>Not a certificate.</p></main>",
    );
    return await page.pdf({ format: "A4" });
  } finally {
    await page.close();
  }
}

async function makePng(page: Page, width: number, height: number) {
  const base64 = await page.evaluate(
    ([w, h]) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#b6402f";
      context.fillRect(0, 0, w, h);
      context.fillStyle = "#fffdf8";
      context.fillRect(w / 8, h / 8, (w * 3) / 4, (h * 3) / 4);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    [width, height],
  );
  return Buffer.from(base64, "base64");
}

async function importPdf(page: Page, pdf: Buffer) {
  await page.locator(PDF_INPUT).setInputFiles({
    name: IMPORT_FILE_NAME,
    mimeType: "application/pdf",
    buffer: pdf,
  });
  // The form asks for a password before it parses; an unencrypted file opens with any.
  await page.locator(".pdf-password-field input").fill("000000");
  const button = page.getByRole("button", { name: "이 브라우저에서 불러오기" });
  await button.click();
  await page
    .locator(".file-notice[role=alert], .file-notice[role=status]")
    .first()
    .waitFor();
  await button.waitFor();
  await page.waitForTimeout(1000);
}

async function checkImport(page: Page, guard: Guard, pdf: Buffer) {
  const documentBytes = pdf.subarray(0, 64).toString("latin1");

  // Consent item 7: the moderator imports once before the participant
  // arrives. That first import may load the application's own code.
  guard.hits = [];
  await importPdf(page, pdf);
  const warmUp = guard.hits;
  record(
    "warm-up import: requests are only GETs for the application's static files, with no body",
    warmUp.every((hit) => {
      const url = new URL(hit.url);
      return (
        hit.method === "GET" &&
        url.origin === new URL(page.url()).origin &&
        url.pathname.startsWith("/_next/static/") &&
        hit.postData === ""
      );
    }) && !carriesAny(warmUp, [documentBytes, IMPORT_FILE_NAME]),
    `${warmUp.length} request(s): ${describe(warmUp)}`,
  );
  record(
    "import: a synthetic PDF is parsed in the browser and falls back to manual entry",
    (await page
      .getByRole("button", { name: /직접 입력으로 계속하기/ })
      .count()) === 1,
  );
  guard.hits = [];

  await importPdf(page, pdf);
  checkNoRequest("import after the warm-up", guard, [
    documentBytes,
    IMPORT_FILE_NAME,
  ]);
}

async function fillCareer(
  page: Page,
  index: number,
  name: string,
  start: string,
  end: string,
) {
  await page
    .getByLabel(/^실제 레스토랑명/)
    .nth(index)
    .fill(name);
  await page
    .getByLabel(/^근무 시작월/)
    .nth(index)
    .fill(start);
  await page
    .getByLabel(/^근무 종료월/)
    .nth(index)
    .fill(end);
}

async function fillEnrichment(page: Page, careers: number) {
  await page.getByLabel(/^이름/).fill(PARTICIPANT_NAME);
  await page.getByLabel(/^이력서 제목/).fill("Chef de Partie");
  await page.getByLabel(/^이메일/).fill(PARTICIPANT_EMAIL);
  const chips = page.getByText("서비스 준비", { exact: true });

  if ((await chips.count()) !== careers) {
    throw new Error(
      `Expected ${careers} 서비스 준비 choices, found ${await chips.count()}.`,
    );
  }

  for (let index = 0; index < careers; index += 1) {
    await page.getByLabel(/^직책/).nth(index).fill("Chef de Partie");
    await chips.nth(index).click();
  }
}

async function countSheetPhotos(page: Page): Promise<SheetPhotos> {
  return {
    profile: await page
      .locator(".resume-sheet img.resume-profile-photo")
      .count(),
    careerPhotos: await page
      .locator(".resume-sheet figure.resume-career-photo img")
      .count(),
  };
}

async function printAndCount(page: Page, button: RegExp): Promise<SheetPhotos> {
  await page.evaluate(() => {
    (window as Window & { __printRequested?: boolean }).__printRequested =
      false;
  });
  await page.getByRole("button", { name: button }).click();
  await page.waitForFunction(
    () =>
      (window as Window & { __printRequested?: boolean }).__printRequested ===
      true,
  );
  return countSheetPhotos(page);
}

async function readStorage(page: Page) {
  return page.evaluate(
    async ({ key, database, store }) => {
      const hasDraft = window.localStorage.getItem(key) !== null;
      const photoCount = await new Promise<number>((resolve) => {
        const open = indexedDB.open(database);
        open.onerror = () => resolve(-1);
        open.onsuccess = () => {
          const db = open.result;

          if (!db.objectStoreNames.contains(store)) {
            db.close();
            resolve(0);
            return;
          }

          const request = db
            .transaction(store, "readonly")
            .objectStore(store)
            .count();
          request.onsuccess = () => {
            db.close();
            resolve(request.result);
          };
          request.onerror = () => resolve(-1);
        };
      });
      return { hasDraft, photoCount };
    },
    {
      key: RESUME_DRAFT_STORAGE_KEY,
      database: LOCAL_PHOTO_DATABASE_NAME,
      store: LOCAL_PHOTO_STORE_NAME,
    },
  );
}

async function photoFreeWalkthrough(
  browser: Browser,
  baseUrl: string,
  pdf: Buffer,
) {
  const { context, page, guard } = await openFresh(browser, baseUrl);

  try {
    await checkImport(page, guard, pdf);

    await page.getByRole("button", { name: /^직접 입력하기/ }).click();
    await fillCareer(page, 0, "검증 비스트로", "2019-03", "2022-02");
    await page.getByRole("button", { name: /요리 경력 보완하기/ }).click();
    await fillEnrichment(page, 1);
    await page.getByRole("button", { name: /이력서 미리보기/ }).click();
    await page.locator(".resume-sheet").waitFor();
    const standard = await printAndCount(page, /인쇄 · PDF 저장/);
    const review = await printAndCount(page, /리뷰용 사본/);
    record(
      "photo-free: completes steps 1 to 4 and prints both copies with no photo",
      standard.profile +
        standard.careerPhotos +
        review.profile +
        review.careerPhotos ===
        0,
    );
    const talentPool = await page
      .locator('input[name="talent-pool"]:checked')
      .evaluate((input) => (input as HTMLInputElement).value);
    record(
      "photo-free: the talent-pool choice defaults to resume-only",
      talentPool === "resume-only",
      talentPool,
    );
    checkNoRequest("photo-free workflow", guard, [
      PARTICIPANT_NAME,
      PARTICIPANT_EMAIL,
    ]);
  } finally {
    await context.close();
  }
}

async function photoWalkthrough(browser: Browser, baseUrl: string) {
  const { context, page, guard } = await openFresh(browser, baseUrl);
  const secrets = [...PHOTO_DESCRIPTIONS, EDITED_DESCRIPTION, PARTICIPANT_NAME];

  try {
    const landscape = await makePng(page, 1200, 900);
    const portrait = await makePng(page, 900, 1200);

    await page.getByRole("button", { name: /^직접 입력하기/ }).click();
    await fillCareer(page, 0, "검증 비스트로", "2019-03", "2022-02");
    await page.getByRole("button", { name: /근무 이력 추가하기/ }).click();
    await fillCareer(page, 1, "검증 다이닝", "2022-03", "2024-02");
    await page.getByRole("button", { name: /요리 경력 보완하기/ }).click();
    await fillEnrichment(page, 2);

    await page.locator(".profile-photo-editor input[type=file]").setInputFiles({
      name: "profile.png",
      mimeType: "image/png",
      buffer: portrait,
    });
    await page.locator(".profile-photo-editor img").waitFor();

    const descriptions = page.locator('textarea[id^="photo-description-"]');
    const adds = page.locator(".career-photo-add input[type=file]");
    const uploads: [number, Buffer][] = [
      [0, landscape],
      [0, portrait],
      [1, landscape],
    ];

    for (const [index, [career, buffer]] of uploads.entries()) {
      await adds.nth(career).setInputFiles({
        name: `dish-${index + 1}.png`,
        mimeType: "image/png",
        buffer,
      });
      await descriptions.nth(index).waitFor();
    }

    for (const [index, text] of PHOTO_DESCRIPTIONS.entries()) {
      await descriptions.nth(index).fill(text);
    }

    const useRadios = page.getByLabel("이 사진을 PDF에 사용");
    await useRadios.nth(0).check();
    await useRadios.nth(2).check();
    await descriptions.nth(0).fill(EDITED_DESCRIPTION);
    await useRadios.nth(1).check();
    record(
      "photos: a required description and the representative selection can be changed",
      (await descriptions.nth(0).inputValue()) === EDITED_DESCRIPTION &&
        !(await useRadios.nth(0).isChecked()) &&
        (await useRadios.nth(1).isChecked()) &&
        (await useRadios.nth(2).isChecked()),
    );

    await page.getByRole("button", { name: /이력서 미리보기/ }).click();
    await page.locator(".resume-sheet").waitFor();
    const preview = await countSheetPhotos(page);
    const standard = await printAndCount(page, /인쇄 · PDF 저장/);
    const review = await printAndCount(page, /리뷰용 사본/);
    record(
      "photos: preview and standard print show the profile photo and one photo per career",
      preview.profile === 1 &&
        preview.careerPhotos === 2 &&
        standard.profile === 1 &&
        standard.careerPhotos === 2,
      `preview ${preview.profile}/${preview.careerPhotos}, standard ${standard.profile}/${standard.careerPhotos}`,
    );
    record(
      "photos: the review copy drops the profile photo and keeps the selected career photos",
      review.profile === 0 && review.careerPhotos === 2,
      `review ${review.profile}/${review.careerPhotos}`,
    );
    const captions = await page
      .locator(".resume-sheet figure.resume-career-photo img")
      .evaluateAll((images) =>
        images.map((image) => (image as HTMLImageElement).alt),
      );
    record(
      "photos: the sheet uses the changed selection",
      captions.includes(PHOTO_DESCRIPTIONS[1]) &&
        !captions.includes(EDITED_DESCRIPTION),
      captions.join(" / "),
    );
    checkNoRequest("photo workflow", guard, secrets);

    guard.armed = false;
    await page.reload();
    await page.waitForLoadState("networkidle");
    guard.armed = true;
    await page.getByRole("button", { name: /저장된 내용 이어가기/ }).click();
    await page.getByRole("button", { name: /요리 경력 보완하기/ }).click();
    await page.getByRole("button", { name: /이력서 미리보기/ }).click();
    await page.locator(".resume-sheet img.resume-profile-photo").waitFor();
    const restored = await countSheetPhotos(page);
    record(
      "photos: reload and restore bring back the photos and the selection",
      restored.profile === 1 && restored.careerPhotos === 2,
      `restored ${restored.profile}/${restored.careerPhotos}`,
    );
    checkNoRequest("photo restore", guard, secrets);

    // Read a non-empty baseline first, so an empty result after deletion means something.
    guard.armed = false;
    await page.reload();
    await page.waitForLoadState("networkidle");
    const before = await readStorage(page);
    record(
      "deletion baseline: the draft and the photos are stored",
      before.hasDraft && before.photoCount > 0,
      `draft ${before.hasDraft}, photos ${before.photoCount}`,
    );
    const discard = page.getByRole("button", { name: "이 기기에서 지우기" });
    await discard.click();
    await discard.waitFor({ state: "detached" });
    const after = await readStorage(page);
    record(
      "deletion: the draft and all local photos are gone",
      !after.hasDraft && after.photoCount === 0,
      `draft ${after.hasDraft}, photos ${after.photoCount}`,
    );
  } finally {
    await context.close();
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));

  if (!args.has("--skip-build")) {
    const build = spawnSync("pnpm", ["build"], { cwd: ROOT, stdio: "inherit" });

    if (build.status !== 0) {
      throw new Error(`pnpm build exited with code ${build.status}`);
    }
  }

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn(
    "pnpm",
    [
      "exec",
      "next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] },
  );
  server.on("error", (error) => {
    console.error(`next start could not be spawned: ${error.message}`);
  });
  let browser: Browser | null = null;

  try {
    await waitForServer(baseUrl, server);
    browser = await chromium.launch();
    const pdf = await makeImportPdf(browser);
    await photoFreeWalkthrough(browser, baseUrl, pdf);
    await photoWalkthrough(browser, baseUrl);
  } catch (error) {
    record(
      "the walkthrough ran to the end",
      false,
      String(error).split("\n")[0],
    );
  } finally {
    await browser?.close();
    server.kill();
  }

  const failed = results.filter((result) => !result.pass);

  if (failed.length > 0) {
    console.error(`\n${failed.length} of ${results.length} check(s) failed.`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nAll ${results.length} checks passed.`);
}

await main();
