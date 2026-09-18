/**
 * Prints the resume sheet from a production build and checks the PDFs.
 *
 * Runs on demand with `pnpm print:verify`. It is not part of CI. The checks
 * run inside the Chromium page with the pdf.js build the application already
 * ships, so the script adds no dependency beyond Playwright.
 *
 * `--skip-build` reuses the existing `.next` build.
 * `--falsify` makes the sheet transparent under print media and expects the
 * ink check to fail on every case, which proves the check reads pixels.
 */

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

import {
  RESUME_DRAFT_STORAGE_KEY,
  RESUME_SHEET_COPY,
  createBlankCareerEntry,
  createDemoCareerEntries,
  serializeResumeDraft,
  type CareerEntry,
  type ResumeDraft,
  type ResumeIdentity,
} from "../app/resume-model.mts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join(ROOT, ".print-verify");
// The falsified run makes every sheet transparent, so its PDFs are
// near-blank. Writing them under a separate directory keeps the normal
// run's real PDFs on disk after the brief's two-run sequence.
const FALSIFIED_OUTPUT_DIR = path.join(OUTPUT_DIR, "falsified");
const PDFJS_BUILD = path.join(ROOT, "node_modules/pdfjs-dist/build");
// Set from the first measured run (Task 5, Step 4): well below the lowest
// ratio a real sheet printed, and well above what a transparent sheet
// printed. Both numbers are recorded in the verification note.
const INK_THRESHOLD = 0.002;

const FIXTURE_IDENTITY: ResumeIdentity = {
  name: "검증 테스터",
  headline: "Chef de Partie",
  email: "verify@example.com",
  phone: "010-1234-5678",
  summary: "인쇄 검증용 경력 요약입니다.",
  profilePhotoId: null,
};

type Case = {
  name: string;
  draft: ResumeDraft;
  review: boolean;
  photos: boolean;
  expectSummary: boolean;
  expectBadge: boolean;
  /** How many profile photos the sheet DOM holds when the print snapshot is taken. */
  expectProfilePhotos: number;
};

type Inspection = {
  pageCount: number;
  inkRatio: number;
  pageOneText: string;
  text: string;
};

function manualCareer(index: number): CareerEntry {
  const startYear = 2016 + index;

  return {
    ...createBlankCareerEntry("manual"),
    restaurantName: `검증 레스토랑 ${index + 1}`,
    restaurantLocation: "서울",
    legalEmployer: index % 2 === 0 ? `검증 법인 ${index + 1}` : "",
    employmentStart: `${startYear}-03`,
    employmentEnd: `${startYear + 1}-02`,
    role: "Chef de Partie",
    stations: ["핫 / Hot", "그릴 / Grill", "파스타·면"],
    responsibilities: ["서비스 준비", "스테이션 운영", "위생 관리"],
    skills: ["칼 기술", "스톡·육수", "소스", "수비드"],
    equipment: ["콤비오븐", "살라만더"],
    representativeExperience: `디너 서비스에서 ${index + 1}번 스테이션을 독립 운영했습니다.`,
  };
}

function buildDraft(
  careers: CareerEntry[],
  overrides: Partial<ResumeDraft> = {},
): ResumeDraft {
  return {
    careers,
    identity: FIXTURE_IDENTITY,
    isDemoDraft: false,
    talentPoolChoice: "resume-only",
    showCareerSummary: true,
    ...overrides,
  };
}

const CASES: Case[] = [
  {
    name: "demo",
    draft: buildDraft(createDemoCareerEntries(), { isDemoDraft: true }),
    review: false,
    photos: false,
    expectSummary: true,
    expectBadge: true,
    expectProfilePhotos: 0,
  },
  {
    name: "long",
    draft: buildDraft(Array.from({ length: 6 }, (_, index) => manualCareer(index))),
    review: false,
    photos: false,
    expectSummary: true,
    expectBadge: false,
    expectProfilePhotos: 0,
  },
  {
    name: "photos",
    draft: buildDraft([manualCareer(0), manualCareer(1)]),
    review: false,
    photos: true,
    expectSummary: true,
    expectBadge: false,
    expectProfilePhotos: 1,
  },
  {
    name: "review",
    draft: buildDraft(createDemoCareerEntries(), { isDemoDraft: true }),
    review: true,
    photos: false,
    expectSummary: true,
    expectBadge: true,
    expectProfilePhotos: 0,
  },
  // The review boundary is the product's job: with a profile photo stored,
  // the review copy must still print without it.
  {
    name: "photos-review",
    draft: buildDraft([manualCareer(0), manualCareer(1)]),
    review: true,
    photos: true,
    expectSummary: true,
    expectBadge: false,
    expectProfilePhotos: 0,
  },
  {
    name: "no-summary",
    draft: buildDraft(createDemoCareerEntries(), {
      isDemoDraft: true,
      showCareerSummary: false,
    }),
    review: false,
    photos: false,
    expectSummary: false,
    expectBadge: true,
    expectProfilePhotos: 0,
  },
];

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

// Text extraction splits lines into items and may render the check glyph
// through a fallback font, so comparisons drop whitespace and the glyph.
function normalize(text: string) {
  return text.replace(/[\s✓]/g, "");
}

async function seedAndOpen(
  context: BrowserContext,
  baseUrl: string,
  draft: ResumeDraft,
): Promise<Page> {
  await context.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
      const target = window as Window & { __printRequested?: boolean };
      target.__printRequested = false;
      window.print = () => {
        target.__printRequested = true;
      };
    },
    { key: RESUME_DRAFT_STORAGE_KEY, value: serializeResumeDraft(draft) },
  );

  const page = await context.newPage();
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "저장된 내용 이어가기" }).click();
  await page.getByRole("button", { name: "요리 경력 보완하기" }).click();
  return page;
}

async function uploadPhotos(page: Page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 900;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#b6402f";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fffdf8";
    context.fillRect(150, 150, 900, 600);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const buffer = Buffer.from(base64, "base64");

  await page
    .locator(".profile-photo-editor input[type=file]")
    .setInputFiles({ name: "profile.png", mimeType: "image/png", buffer });
  await page.locator(".profile-photo-editor img").waitFor();

  await page
    .locator(".career-photo-add input[type=file]")
    .first()
    .setInputFiles({ name: "dish.png", mimeType: "image/png", buffer });
  const description = page.locator('textarea[id^="photo-description-"]').first();
  await description.waitFor();
  await description.fill("검증용 접시 · 소스와 플레이팅");
  await page.getByLabel("이 사진을 PDF에 사용").first().check();
}

async function printCase(
  page: Page,
  testCase: Case,
  falsify: boolean,
): Promise<Buffer> {
  await page.getByRole("button", { name: "이력서 미리보기" }).click();
  await page.locator(".resume-sheet").waitFor();

  if (falsify) {
    await page.addStyleTag({
      content: "@media print { .resume-sheet { opacity: 0; } }",
    });
  }

  await page.evaluate(() => {
    (window as Window & { __printRequested?: boolean }).__printRequested = false;
  });
  await page
    .getByRole("button", {
      name: testCase.review ? "리뷰용 사본" : "인쇄 · PDF 저장",
    })
    .click();
  await page.waitForFunction(
    () => (window as Window & { __printRequested?: boolean }).__printRequested === true,
  );

  // The print snapshot is taken from this DOM, so count the profile photo
  // here: the review copy must have dropped it before the print call.
  const profilePhotos = await page
    .locator(".resume-sheet img.resume-profile-photo")
    .count();

  if (profilePhotos !== testCase.expectProfilePhotos) {
    throw new Error(
      `${testCase.name}: expected ${testCase.expectProfilePhotos} profile photo(s) in the sheet, found ${profilePhotos}`,
    );
  }

  const targetDir = falsify ? FALSIFIED_OUTPUT_DIR : OUTPUT_DIR;

  return page.pdf({
    path: path.join(targetDir, `${testCase.name}.pdf`),
    format: "A4",
    preferCSSPageSize: true,
    printBackground: false,
  });
}

async function inspectPdf(page: Page, pdf: Buffer): Promise<Inspection> {
  return page.evaluate(
    async ({ base64, moduleUrl, workerUrl }) => {
      const pdfjs = await import(moduleUrl);
      // Same-origin path that `servePdfjs` answers. Playwright routes the
      // worker's script request through the same handler.
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const document_ = await pdfjs.getDocument({ data: bytes }).promise;
      const first = await document_.getPage(1);
      const viewport = first.getViewport({ scale: 1 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await first.render({ canvasContext: context, viewport }).promise;

      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let inked = 0;

      for (let offset = 0; offset < data.length; offset += 4) {
        if (data[offset] < 245 || data[offset + 1] < 245 || data[offset + 2] < 245) {
          inked += 1;
        }
      }

      const pages: string[] = [];

      for (let number = 1; number <= document_.numPages; number += 1) {
        const pdfPage = await document_.getPage(number);
        const content = await pdfPage.getTextContent();
        pages.push(
          content.items
            .map((item: { str?: string }) => item.str ?? "")
            .join(" "),
        );
      }

      return {
        pageCount: document_.numPages,
        inkRatio: inked / (data.length / 4),
        pageOneText: pages[0] ?? "",
        text: pages.join("\n"),
      };
    },
    {
      base64: pdf.toString("base64"),
      moduleUrl: "/__print-verify/pdf.mjs",
      workerUrl: "/__print-verify/pdf.worker.mjs",
    },
  );
}

async function servePdfjs(context: BrowserContext) {
  await context.route("**/__print-verify/*", async (route) => {
    const requested = path.basename(new URL(route.request().url()).pathname);
    const file =
      requested === "pdf.worker.mjs" ? "pdf.worker.min.mjs" : "pdf.min.mjs";
    const body = await readFile(path.join(PDFJS_BUILD, file));
    await route.fulfill({ status: 200, contentType: "text/javascript", body });
  });
}

function check(
  failures: string[],
  condition: boolean,
  message: string,
) {
  if (!condition) {
    failures.push(message);
  }
}

function assessCase(
  testCase: Case,
  inspection: Inspection,
  falsify: boolean,
  failures: string[],
) {
  const ink = inspection.inkRatio.toFixed(4);

  if (falsify) {
    check(
      failures,
      inspection.inkRatio < INK_THRESHOLD,
      `${testCase.name}: ink ratio ${ink} did not fall below ${INK_THRESHOLD} with a transparent sheet`,
    );
    return;
  }

  const text = normalize(inspection.text);

  check(
    failures,
    inspection.inkRatio >= INK_THRESHOLD,
    `${testCase.name}: page 1 ink ratio ${ink} is below ${INK_THRESHOLD}`,
  );
  check(
    failures,
    normalize(inspection.pageOneText).length > 0,
    `${testCase.name}: page 1 has no text`,
  );
  check(
    failures,
    text.includes(normalize(RESUME_SHEET_COPY.summaryTitle)) === testCase.expectSummary,
    `${testCase.name}: summary band presence should be ${testCase.expectSummary}`,
  );
  check(
    failures,
    text.includes(normalize(RESUME_SHEET_COPY.badgeLabel)) === testCase.expectBadge,
    `${testCase.name}: badge presence should be ${testCase.expectBadge}`,
  );
  check(
    failures,
    text.includes(
      normalize(
        testCase.expectBadge
          ? RESUME_SHEET_COPY.legendWithBadge
          : RESUME_SHEET_COPY.legendWithoutBadge,
      ),
    ),
    `${testCase.name}: legend sentence is missing`,
  );

  if (testCase.review) {
    for (const value of [
      FIXTURE_IDENTITY.name,
      FIXTURE_IDENTITY.email,
      FIXTURE_IDENTITY.phone,
    ]) {
      check(
        failures,
        !text.includes(normalize(value)),
        `${testCase.name}: review copy contains "${value}"`,
      );
    }
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const falsify = args.has("--falsify");

  if (!args.has("--skip-build")) {
    const build = spawnSync("pnpm", ["build"], { cwd: ROOT, stdio: "inherit" });

    if (build.status !== 0) {
      throw new Error(`pnpm build exited with code ${build.status}`);
    }
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  if (falsify) {
    await mkdir(FALSIFIED_OUTPUT_DIR, { recursive: true });
  }

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn(
    "pnpm",
    ["exec", "next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] },
  );
  let browser: Browser | null = null;
  const failures: string[] = [];

  try {
    await waitForServer(baseUrl, server);
    browser = await chromium.launch();

    for (const testCase of CASES) {
      const context = await browser.newContext();

      try {
        await servePdfjs(context);
        const page = await seedAndOpen(context, baseUrl, testCase.draft);

        if (testCase.photos) {
          await uploadPhotos(page);
        }

        const pdf = await printCase(page, testCase, falsify);
        const inspection = await inspectPdf(page, pdf);

        console.log(
          `${testCase.name}: ${inspection.pageCount} page(s), ink ${inspection.inkRatio.toFixed(4)}`,
        );
        assessCase(testCase, inspection, falsify, failures);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    server.kill();
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} check(s) failed:`);

    for (const failure of failures) {
      console.error(`- ${failure}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    falsify
      ? `\nFalsified run: the ink check failed on all ${CASES.length} cases, as it must. PDFs are in ${FALSIFIED_OUTPUT_DIR}.`
      : `\nAll checks passed for ${CASES.length} cases. PDFs are in ${OUTPUT_DIR}.`,
  );
}

await main();
