# Resume Output Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the one resume layout show the structured culinary record through a derived summary band, one public-record badge with a legend, a restructured career entry, and a print verification that runs on demand.

**Architecture:** Pure calculation and the sheet copy live in `app/resume-model.mts`, where the Node test runner already covers them. The sheet becomes a stateless `ResumeSheet` component in `app/resume-sheet.tsx` that renders from props, and `app/page.tsx` keeps the wizard state, the print-mode logic, and the new display toggle. A Playwright script in `scripts/print-verify.mts` drives a production build, prints six PDFs, and checks their pixels and text inside the same Chromium page with the `pdfjs-dist` build the application already ships.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript, Tailwind CSS 4, Node 24 test runner with `--experimental-strip-types`, Playwright (Chromium only, `devDependency`), pdfjs-dist 6.3.289, pnpm 11.22.0

**Spec:** `docs/specs/resume-output-sheet.md`

## Global Constraints

- Steps 1 to 3 of the wizard do not change. The only step 4 additions are the toggle and the new sheet.
- The band reorganizes facts the person confirmed or authored. It never adds a word the person did not choose.
- No badge text, tooltip, or legend sentence uses the word `인증`.
- `SUMMARY_LIMITS` is 8 stations, 6 skills, 6 equipment items.
- Duration counts each month once: overlapping careers merge into one interval before the count.
- `showCareerSummary` defaults to `true`, a missing field restores as `true`, a non-boolean field discards the draft.
- The draft version stays at `3`. The new field has a default, so a draft written by either build stays readable by the other. Bumping the version would make a rollback reject every draft the new build wrote.
- The printed sheet uses `printBackground: false` in the verification, because that is the Chrome print dialog default. The badge must read through its border, glyph, and text alone.
- Playwright is a `devDependency`. No CI workflow runs `pnpm print:verify`. `tsconfig.json` includes `**/*.mts`, so `pnpm typecheck` type-checks the script.
- No PDF, screenshot, image file, or personal data is committed. `.print-verify/` is ignored. The repository is public.
- Every commit uses `git add <paths>` followed by a separate `git commit -m` command. No pipe or redirect is attached to a git command. No `--no-verify`. No session trailer in the message.
- Korean user-facing strings stay Korean. Identifiers and commit messages are English.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before every commit that touches `app/` or `scripts/`.

---

## File Map

| File | Responsibility | Change |
| --- | --- | --- |
| `app/resume-model.mts` | Pure data rules, draft schema, sheet copy | Add `CareerSummary`, `SUMMARY_LIMITS`, `summarizeIncludedCareers`, `formatDuration`, `hasPublicRecordBadge`, `RESUME_SHEET_COPY`, `showCareerSummary` in the draft |
| `app/resume-model.test.mts` | Tests for the above | Add tests, update the key-set test and `completeDraft()` |
| `app/provenance-tag.tsx` | The `ProvenanceTag` component that steps 2 and 3 use | Create by moving it out of `page.tsx` |
| `app/resume-sheet.tsx` | The stateless printed sheet | Create |
| `app/page.tsx` | Wizard state, toggle, print-mode logic | Add `showCareerSummary` state and toggle, render `ResumeSheet`, remove the inline sheet and the moved helpers |
| `app/globals.css` | Styles | Add band, badge, entry, legend, toggle styles; remove `.resume-bullets`, `.resume-skills`, `.resume-provenance` |
| `scripts/print-verify.mts` | On-demand print verification | Create |
| `package.json`, `pnpm-lock.yaml` | Dependency and script | Add `playwright` and `print:verify` |
| `.gitignore` | Ignore rules | Add `/.print-verify/` |
| `docs/notes/<date>-resume-print-verification.md` | Verification record | Create |
| `docs/plans/resume-builder-validation.md` | Track A preflight | Add the `print:verify` bullet |
| `docs/specs/resume-output-sheet.md` | Spec status | Mark implemented |

---

### Task 1: Career summary calculation

**Files:**
- Modify: `app/resume-model.mts` (append after `formatMonthRange`, the last function in the file)
- Test: `app/resume-model.test.mts`

**Interfaces:**
- Consumes: `CareerEntry`, `CULINARY_SPECIALTY_OPTIONS`, and the module-private `MONTH_PATTERN` from `app/resume-model.mts`.
- Produces:
  - `type CareerSummary = { totalMonths: number; specialties: string[]; stations: string[]; skills: string[]; equipment: string[] }`
  - `const SUMMARY_LIMITS = { stations: 8, skills: 6, equipment: 6 } as const`
  - `function summarizeIncludedCareers(entries: readonly CareerEntry[], options: { today: string }): CareerSummary`
  - `function formatDuration(totalMonths: number): string`

- [ ] **Step 0: Create the branch and commit the two documents first**

Run from the repository root:

```bash
git -C /Users/dongminyu/Development/01_personal/mise-en-place switch -c feat/resume-output-sheet
git -C /Users/dongminyu/Development/01_personal/mise-en-place add docs/specs/resume-output-sheet.md docs/plans/resume-output-sheet.md
git -C /Users/dongminyu/Development/01_personal/mise-en-place commit -m "docs(resume): specify and plan the output sheet slice"
```

The repository's own order is a docs commit before the feature commits (`a719cd9` then `1e73c38` for the media slice), and committing first keeps both documents out of reach of any later `reset` or `checkout`.

If the session uses `superpowers:using-git-worktrees`, create the worktree on this branch name instead and run every later command inside it.

- [ ] **Step 1: Write the failing tests**

Add `summarizeIncludedCareers`, `formatDuration`, and `SUMMARY_LIMITS` to the import list at the top of `app/resume-model.test.mts`, then append at the end of the file:

```ts
function summaryCareer(overrides: Partial<CareerEntry>): CareerEntry {
  return {
    ...createBlankCareerEntry("manual"),
    restaurantName: "요약 테스트",
    role: "Commis",
    ...overrides,
  };
}

test("counts overlapping employment months once", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({ employmentStart: "2023-01", employmentEnd: "2023-06" }),
      summaryCareer({ employmentStart: "2023-04", employmentEnd: "2023-12" }),
    ],
    { today: "2026-09" },
  );

  assert.equal(summary.totalMonths, 12);
});

test("adds adjacent employment periods", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({ employmentStart: "2022-01", employmentEnd: "2022-12" }),
      summaryCareer({ employmentStart: "2023-01", employmentEnd: "2023-03" }),
    ],
    { today: "2026-09" },
  );

  assert.equal(summary.totalMonths, 15);
});

test("ends a current career at today", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({
        employmentStart: "2026-01",
        employmentEnd: "2020-01",
        isCurrent: true,
      }),
    ],
    { today: "2026-09" },
  );

  assert.equal(summary.totalMonths, 9);
});

test("ignores excluded careers and skips an invalid start for the duration", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({
        employmentStart: "2024-01",
        employmentEnd: "2024-12",
        included: false,
        stations: ["콜드 / Garde Manger"],
      }),
      summaryCareer({
        employmentStart: "",
        employmentEnd: "2024-12",
        stations: ["핫 / Hot"],
      }),
    ],
    { today: "2026-09" },
  );

  assert.equal(summary.totalMonths, 0);
  assert.deepEqual(summary.stations, ["핫 / Hot"]);
});

test("orders summary choices by career count, then by recency", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({
        employmentStart: "2022-01",
        employmentEnd: "2023-12",
        stations: ["그릴 / Grill", "콜드 / Garde Manger"],
      }),
      summaryCareer({
        employmentStart: "2024-01",
        employmentEnd: "2025-06",
        stations: ["핫 / Hot", "그릴 / Grill"],
      }),
    ],
    { today: "2026-09" },
  );

  assert.deepEqual(summary.stations, ["그릴 / Grill", "핫 / Hot", "콜드 / Garde Manger"]);
});

test("keeps array order for careers that share a start month", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({ employmentStart: "2024-01", employmentEnd: "2024-06", skills: ["소스"] }),
      summaryCareer({ employmentStart: "2024-01", employmentEnd: "2024-06", skills: ["칼 기술"] }),
    ],
    { today: "2026-09" },
  );

  assert.deepEqual(summary.skills, ["소스", "칼 기술"]);
});

test("cuts each summary list at its limit", () => {
  const stations = Array.from({ length: 10 }, (_, index) => `스테이션 ${index}`);
  const summary = summarizeIncludedCareers(
    [summaryCareer({ employmentStart: "2024-01", employmentEnd: "2024-06", stations })],
    { today: "2026-09" },
  );

  assert.equal(summary.stations.length, SUMMARY_LIMITS.stations);
  assert.deepEqual(summary.stations, stations.slice(0, 8));
});

test("lists specialties in the taxonomy order with their labels", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({
        employmentStart: "2024-01",
        employmentEnd: "2024-06",
        culinarySpecialties: ["pastry", "restaurant"],
      }),
    ],
    { today: "2026-09" },
  );

  assert.deepEqual(summary.specialties, ["레스토랑 조리", "제과·패스트리"]);
});

test("formats a duration in years and months", () => {
  assert.equal(formatDuration(0), "");
  assert.equal(formatDuration(8), "8개월");
  assert.equal(formatDuration(24), "2년");
  assert.equal(formatDuration(40), "3년 4개월");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm test
```

Expected: the run fails at import time with `The requested module './resume-model.mts' does not provide an export named 'summarizeIncludedCareers'`.

- [ ] **Step 3: Write the implementation**

Append at the end of `app/resume-model.mts`:

```ts
export type CareerSummary = {
  totalMonths: number;
  specialties: string[];
  stations: string[];
  skills: string[];
  equipment: string[];
};

export const SUMMARY_LIMITS = {
  stations: 8,
  skills: 6,
  equipment: 6,
} as const;

function toMonthIndex(month: string): number {
  const [year, monthOfYear] = month.split("-").map(Number);
  return year * 12 + (monthOfYear - 1);
}

/**
 * Counts the months covered by at least one interval. Two careers that
 * overlap share those months, so a plain sum would credit them twice.
 */
function countUnionMonths(
  intervals: ReadonlyArray<readonly [number, number]>,
): number {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let open: [number, number] | null = null;

  for (const [start, end] of sorted) {
    if (open === null) {
      open = [start, end];
      continue;
    }

    if (start <= open[1] + 1) {
      open[1] = Math.max(open[1], end);
      continue;
    }

    total += open[1] - open[0] + 1;
    open = [start, end];
  }

  if (open !== null) {
    total += open[1] - open[0] + 1;
  }

  return total;
}

/**
 * Orders the union of one bounded choice across careers by how many careers
 * carry it, then by where it first appears when careers are read from the
 * most recent to the oldest. Within a career the person's own order holds.
 */
function rankChoices(
  careersByRecency: readonly CareerEntry[],
  pick: (career: CareerEntry) => readonly string[],
  limit: number,
): string[] {
  const counts = new Map<string, number>();
  const firstSeen = new Map<string, number>();
  let position = 0;

  for (const career of careersByRecency) {
    const seenInCareer = new Set<string>();

    for (const item of pick(career)) {
      if (seenInCareer.has(item)) {
        continue;
      }

      seenInCareer.add(item);
      counts.set(item, (counts.get(item) ?? 0) + 1);

      if (!firstSeen.has(item)) {
        firstSeen.set(item, position);
      }

      position += 1;
    }
  }

  return [...counts.keys()]
    .sort(
      (a, b) =>
        counts.get(b)! - counts.get(a)! ||
        firstSeen.get(a)! - firstSeen.get(b)!,
    )
    .slice(0, limit);
}

export function summarizeIncludedCareers(
  entries: readonly CareerEntry[],
  options: { today: string },
): CareerSummary {
  const included = entries.filter((entry) => entry.included);
  const intervals: Array<readonly [number, number]> = [];

  for (const entry of included) {
    if (!MONTH_PATTERN.test(entry.employmentStart)) {
      continue;
    }

    const end = entry.isCurrent ? options.today : entry.employmentEnd;

    if (!MONTH_PATTERN.test(end)) {
      continue;
    }

    const startIndex = toMonthIndex(entry.employmentStart);
    const endIndex = toMonthIndex(end);

    if (endIndex < startIndex) {
      continue;
    }

    intervals.push([startIndex, endIndex]);
  }

  // `sort` is stable, so careers that share a start month keep the order of
  // the `entries` array.
  const byRecency = [...included].sort((a, b) =>
    b.employmentStart.localeCompare(a.employmentStart),
  );
  const specialtyValues = new Set(
    included.flatMap((entry) => entry.culinarySpecialties),
  );

  return {
    totalMonths: countUnionMonths(intervals),
    specialties: CULINARY_SPECIALTY_OPTIONS.filter((option) =>
      specialtyValues.has(option.value),
    ).map((option) => option.label),
    stations: rankChoices(
      byRecency,
      (career) => career.stations,
      SUMMARY_LIMITS.stations,
    ),
    skills: rankChoices(
      byRecency,
      (career) => career.skills,
      SUMMARY_LIMITS.skills,
    ),
    equipment: rankChoices(
      byRecency,
      (career) => career.equipment,
      SUMMARY_LIMITS.equipment,
    ),
  };
}

export function formatDuration(totalMonths: number): string {
  if (totalMonths <= 0) {
    return "";
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months}개월`;
  }

  if (months === 0) {
    return `${years}년`;
  }

  return `${years}년 ${months}개월`;
}
```

`MONTH_PATTERN` and `CULINARY_SPECIALTY_OPTIONS` are already defined earlier in the same file.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm test
```

Expected: `pass 84`, `fail 0` (75 existing tests plus 9 new).

- [ ] **Step 5: Lint and typecheck, then commit**

Run:

```bash
pnpm lint
pnpm typecheck
git add app/resume-model.mts app/resume-model.test.mts
git commit -m "feat(resume): summarize included careers for the sheet"
```

---

### Task 2: Public-record badge rule

**Files:**
- Modify: `app/resume-model.mts` (append after `formatDuration`)
- Test: `app/resume-model.test.mts`

**Interfaces:**
- Consumes: `CareerEntry`, `createDemoCareerEntries`, `createBlankCareerEntry`.
- Produces: `function hasPublicRecordBadge(entry: CareerEntry): boolean`

- [ ] **Step 1: Write the failing tests**

Add `hasPublicRecordBadge` to the import list, then append to `app/resume-model.test.mts`:

```ts
test("shows the public-record badge only on an unchanged document record", () => {
  const [demo] = createDemoCareerEntries();
  const manual = createBlankCareerEntry("manual");
  const edited: CareerEntry = { ...demo, legalEmployer: "다른 법인" };

  assert.equal(hasPublicRecordBadge(demo), true);
  assert.equal(hasPublicRecordBadge(manual), false);
  assert.equal(hasPublicRecordBadge(edited), false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm test
```

Expected: fails at import time on `hasPublicRecordBadge`.

- [ ] **Step 3: Write the implementation**

Append to `app/resume-model.mts`:

```ts
/**
 * The sheet marks an employer name that still reads exactly as the public
 * record supplied it. Step 2 does not let the person edit those fields on a
 * document record, so the comparison is defensive rather than reachable.
 */
export function hasPublicRecordBadge(entry: CareerEntry): boolean {
  if (entry.origin !== "document" || entry.importedFields === null) {
    return false;
  }

  return (
    entry.legalEmployer === entry.importedFields.legalEmployer &&
    entry.qualificationStart === entry.importedFields.qualificationStart &&
    entry.qualificationEnd === entry.importedFields.qualificationEnd
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm test
```

Expected: `pass 85`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
pnpm lint
pnpm typecheck
git add app/resume-model.mts app/resume-model.test.mts
git commit -m "feat(resume): decide when a career shows the public-record badge"
```

---

### Task 3: `showCareerSummary` in the draft, the page state, and the toggle

**Files:**
- Modify: `app/resume-model.mts` (`ResumeDraft` type, `serializeResumeDraft`, `parseResumeDraft`)
- Modify: `app/page.tsx` (state, `currentDraft`, `persistPhotoDraft`, `beginDraft`, `restoreStoredDraft`, step 4 markup)
- Modify: `app/globals.css` (toggle style)
- Test: `app/resume-model.test.mts`

**Interfaces:**
- Consumes: `ResumeDraft` from Task 0 state of the file.
- Produces: `ResumeDraft.showCareerSummary: boolean`, and in `page.tsx` the state pair `showCareerSummary` / `setShowCareerSummary`.

- [ ] **Step 1: Write the failing tests**

In `app/resume-model.test.mts`, change `completeDraft()` so its returned object ends with:

```ts
    identity: completeIdentity,
    isDemoDraft: false,
    talentPoolChoice: "resume-only",
    showCareerSummary: true,
  };
}
```

Change the expected key list in `test("serializes only the confirmed draft fields", ...)` to:

```ts
  assert.deepEqual(Object.keys(stored as object).sort(), [
    "careers",
    "identity",
    "isDemoDraft",
    "showCareerSummary",
    "talentPoolChoice",
    "version",
  ]);
```

Append:

```ts
test("restores a draft saved before the summary toggle with the band shown", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  delete stored.showCareerSummary;

  const restored = parseResumeDraft(JSON.stringify(stored));

  assert.notEqual(restored, null);
  assert.equal(restored!.showCareerSummary, true);
});

test("discards a draft whose summary toggle is not a boolean", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  stored.showCareerSummary = "yes";

  assert.equal(parseResumeDraft(JSON.stringify(stored)), null);
});

test("keeps a hidden summary band through a serialize and parse round trip", () => {
  const draft: ResumeDraft = { ...completeDraft(), showCareerSummary: false };

  assert.equal(
    parseResumeDraft(serializeResumeDraft(draft))!.showCareerSummary,
    false,
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm test
```

Expected: `pnpm typecheck` is not involved here, so the run executes and fails on `serializes only the confirmed draft fields` (missing key), `restores a draft saved before the summary toggle` (`undefined !== true`), and `discards a draft whose summary toggle is not a boolean` (a draft is returned).

- [ ] **Step 3: Update the model**

In `app/resume-model.mts`:

```ts
export type ResumeDraft = {
  careers: CareerEntry[];
  identity: ResumeIdentity;
  isDemoDraft: boolean;
  talentPoolChoice: TalentPoolChoice;
  showCareerSummary: boolean;
};
```

In `serializeResumeDraft`, after `talentPoolChoice: draft.talentPoolChoice,` add:

```ts
    showCareerSummary: draft.showCareerSummary,
```

In `parseResumeDraft`, replace the block that starts with `const identity = readIdentity(value.identity, draftVersion);` and ends with the `return` with:

```ts
  const identity = readIdentity(value.identity, draftVersion);
  const talentPoolChoice = readString(value.talentPoolChoice);
  // A draft written before the summary toggle existed carries no field, and
  // it restores with the band shown, which is what the toggle defaults to.
  const showCareerSummary =
    value.showCareerSummary === undefined ? true : value.showCareerSummary;

  if (
    identity === null ||
    typeof value.isDemoDraft !== "boolean" ||
    typeof showCareerSummary !== "boolean" ||
    talentPoolChoice === null ||
    !TALENT_POOL_CHOICES.includes(talentPoolChoice as TalentPoolChoice)
  ) {
    return null;
  }

  return {
    careers,
    identity,
    isDemoDraft: value.isDemoDraft,
    talentPoolChoice: talentPoolChoice as TalentPoolChoice,
    showCareerSummary,
  };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm test
```

Expected: `pass 88`, `fail 0`.

- [ ] **Step 5: Wire the state in `app/page.tsx`**

After the `talentPoolChoice` state declaration add:

```ts
  const [showCareerSummary, setShowCareerSummary] = useState(true);
```

Change `currentDraft`:

```ts
  const currentDraft = useMemo<ResumeDraft>(
    () => ({
      careers,
      identity,
      isDemoDraft,
      talentPoolChoice,
      showCareerSummary,
    }),
    [careers, identity, isDemoDraft, talentPoolChoice, showCareerSummary],
  );
```

In `persistPhotoDraft`, add `showCareerSummary,` after `talentPoolChoice,`.

In `beginDraft`, after `setTalentPoolChoice("resume-only");` add:

```ts
    setShowCareerSummary(true);
```

In `restoreStoredDraft`, after `setTalentPoolChoice(restoredDraft.talentPoolChoice);` add:

```ts
      setShowCareerSummary(restoredDraft.showCareerSummary);
```

Confirm with `grep -n "talentPoolChoice" app/page.tsx` that no other object literal builds a `ResumeDraft`.

- [ ] **Step 6: Add the toggle to step 4**

In the `currentStep === 4` block, directly after the `<p className="review-export-note field-hint no-print">…</p>` element and before `<article className="resume-sheet" …>`, add:

```tsx
              <label className="summary-toggle no-print">
                <input
                  type="checkbox"
                  checked={showCareerSummary}
                  onChange={(event) =>
                    setShowCareerSummary(event.currentTarget.checked)
                  }
                />
                <span>
                  <strong>한눈에 보기를 이력서에 표시</strong>
                  <small>내용을 바꾸려면 3단계에서 경력을 수정하세요.</small>
                </span>
              </label>
```

The sheet does not read the value yet. Task 4 connects it.

- [ ] **Step 7: Style the toggle**

In `app/globals.css`, directly after the `.talent-pool-panel legend { … }` block, add:

```css
.summary-toggle {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: min(100%, 820px);
  margin: 0 auto 18px;
  font-size: 0.82rem;
}

.summary-toggle input {
  margin-top: 3px;
  accent-color: var(--red);
}

.summary-toggle span {
  display: grid;
  gap: 2px;
}

.summary-toggle small {
  color: var(--muted);
  font-size: 0.72rem;
}
```

- [ ] **Step 8: Verify and commit**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Expected: all three succeed.

```bash
git add app/resume-model.mts app/resume-model.test.mts app/page.tsx app/globals.css
git commit -m "feat(resume): let the person show or hide the career summary band"
```

---

### Task 4: `ResumeSheet` component, sheet copy, and styles

**Files:**
- Modify: `app/resume-model.mts` (add `RESUME_SHEET_COPY`)
- Create: `app/provenance-tag.tsx`
- Create: `app/resume-sheet.tsx`
- Modify: `app/page.tsx` (imports, memos, step 4 render, removals)
- Modify: `app/globals.css`
- Test: `app/resume-model.test.mts` (one copy test)

**Interfaces:**
- Consumes: `CareerSummary`, `summarizeIncludedCareers`, `formatDuration`, `hasPublicRecordBadge` (Tasks 1 and 2), `showCareerSummary` state (Task 3).
- Produces:
  - `RESUME_SHEET_COPY` in `app/resume-model.mts` (the script in Task 5 imports it).
  - `ResumeSheet(props: { identity: ResumeIdentity; careers: readonly CareerEntry[]; summary: CareerSummary; showSummary: boolean; photoUrls: ReadonlyMap<string, string>; isDemo: boolean; ref: Ref<HTMLElement> })` in `app/resume-sheet.tsx`.
  - `ProvenanceTag({ kind })` in `app/provenance-tag.tsx`.

- [ ] **Step 1: Write the failing copy test**

Add `RESUME_SHEET_COPY` to the import list of `app/resume-model.test.mts` and append:

```ts
// The badge and the legend name a source. `docs/specs/initial-product-scope.md`
// forbids wording that reads as a certification of the career.
test("keeps certification wording out of the sheet copy", () => {
  for (const text of Object.values(RESUME_SHEET_COPY)) {
    assert.equal(text.includes("인증"), false, text);
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm test
```

Expected: fails at import time on `RESUME_SHEET_COPY`.

- [ ] **Step 3: Add the sheet copy to the model**

Append to `app/resume-model.mts`:

```ts
/**
 * Every string the printed sheet adds on its own. The verification script
 * checks the PDFs against these, so they live here rather than in the
 * component, which Node cannot import.
 */
export const RESUME_SHEET_COPY = {
  summaryTitle: "한눈에 보기",
  summaryCaption: "포함된 경력에서 정리함",
  durationPrefix: "주방 경력",
  stationsLabel: "맡을 수 있는 스테이션",
  skillsLabel: "기술",
  equipmentLabel: "장비",
  dutiesLabel: "주요 업무",
  entryStationsLabel: "스테이션",
  entryKitchenLabel: "기술·장비",
  badgeLabel: "공공기록",
  badgeTitle: "사업장명을 공공기록에서 불러옴",
  legendWithBadge:
    "✓ 표시가 있는 사업장명은 공공기록에서 불러왔습니다. 레스토랑명·근무 기간·직책은 본인이 확인했고, 그 외 내용은 본인이 작성했습니다.",
  legendWithoutBadge: "모든 내용은 본인이 작성했습니다.",
} as const;
```

Run `pnpm test`. Expected: `pass 89`, `fail 0`.

- [ ] **Step 4: Move `ProvenanceTag` into its own file**

Create `app/provenance-tag.tsx`:

```tsx
import { PROVENANCE_LABELS } from "./resume-model.mts";

export function ProvenanceTag({
  kind,
}: {
  kind: keyof typeof PROVENANCE_LABELS;
}) {
  return (
    <span className={"provenance-tag provenance-" + kind}>
      {PROVENANCE_LABELS[kind]}
    </span>
  );
}
```

In `app/page.tsx`, delete the local `function ProvenanceTag(...)` (currently lines 373 to 383) and add the import:

```ts
import { ProvenanceTag } from "./provenance-tag";
```

Steps 2 and 3 keep using `<ProvenanceTag kind="…" />` unchanged.

- [ ] **Step 5: Create `app/resume-sheet.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element -- Local Blob URLs cannot use server image optimization. */

import type { Ref } from "react";

import {
  RESUME_SHEET_COPY,
  formatDuration,
  formatMonthRange,
  getEmployerLabel,
  hasPublicRecordBadge,
  type CareerEntry,
  type CareerPhotoReference,
  type CareerSummary,
  type ResumeIdentity,
} from "./resume-model.mts";

type ResumeSheetProps = {
  /** Already stripped by `toReviewIdentity` when the review copy is active. */
  identity: ResumeIdentity;
  /** The included careers, in order. */
  careers: readonly CareerEntry[];
  summary: CareerSummary;
  showSummary: boolean;
  /** Photo asset id to object URL. */
  photoUrls: ReadonlyMap<string, string>;
  isDemo: boolean;
  /** `page.tsx` waits for the sheet's images before `window.print`. */
  ref: Ref<HTMLElement>;
};

function getResumePhotoReference(
  career: CareerEntry,
): CareerPhotoReference | null {
  if (!career.resumePhotoId) {
    return null;
  }

  return (
    career.portfolioPhotos.find(
      (photo) => photo.assetId === career.resumePhotoId,
    ) ?? null
  );
}

function joinChoices(items: readonly string[]) {
  return items.join(" · ");
}

function PublicRecordBadge() {
  return (
    <span className="public-record-badge" title={RESUME_SHEET_COPY.badgeTitle}>
      <span aria-hidden="true">✓</span>
      {RESUME_SHEET_COPY.badgeLabel}
    </span>
  );
}

/**
 * The printed resume. It renders from props alone: the parent decides which
 * identity it gets (full or review copy), which careers are included, and
 * whether the summary band shows.
 */
export function ResumeSheet({
  identity,
  careers,
  summary,
  showSummary,
  photoUrls,
  isDemo,
  ref,
}: ResumeSheetProps) {
  const profilePhotoUrl = identity.profilePhotoId
    ? photoUrls.get(identity.profilePhotoId)
    : undefined;
  const duration = formatDuration(summary.totalMonths);
  const summaryHeadline = [
    duration ? `${RESUME_SHEET_COPY.durationPrefix} ${duration}` : "",
    ...summary.specialties,
  ]
    .filter(Boolean)
    .join(" · ");
  const summaryRows = [
    { label: RESUME_SHEET_COPY.stationsLabel, items: summary.stations },
    { label: RESUME_SHEET_COPY.skillsLabel, items: summary.skills },
    { label: RESUME_SHEET_COPY.equipmentLabel, items: summary.equipment },
  ].filter((row) => row.items.length > 0);
  const hasSummaryBand =
    showSummary && (summaryHeadline.length > 0 || summaryRows.length > 0);
  const hasBadge = careers.some(hasPublicRecordBadge);

  return (
    <article className="resume-sheet" data-print-root ref={ref}>
      <header className="resume-header">
        <div className="resume-identity-lockup">
          {profilePhotoUrl ? (
            <img
              className="resume-profile-photo"
              src={profilePhotoUrl}
              alt={`${identity.name || "사용자"} 프로필 사진`}
            />
          ) : null}
          <div>
            <p className="resume-label">
              CULINARY RESUME{" "}
              {isDemo ? <span className="demo-tag">예시 이력서</span> : null}
            </p>
            {/* Without a name the headline becomes the sheet's own heading,
                so the review copy keeps the same heading levels rather than
                skipping from the page to h3. */}
            <h2>{identity.name || identity.headline}</h2>
            {identity.name ? (
              <p className="resume-headline">{identity.headline}</p>
            ) : null}
          </div>
        </div>
        {identity.email || identity.phone ? (
          <address>
            {identity.email ? <span>{identity.email}</span> : null}
            {identity.phone ? <span>{identity.phone}</span> : null}
          </address>
        ) : null}
      </header>

      {hasSummaryBand ? (
        <section className="resume-section resume-summary-band">
          <div className="resume-summary-heading-row">
            <h3>{RESUME_SHEET_COPY.summaryTitle}</h3>
            <p className="resume-summary-caption">
              {RESUME_SHEET_COPY.summaryCaption}
            </p>
          </div>
          {summaryHeadline ? (
            <p className="resume-summary-headline">{summaryHeadline}</p>
          ) : null}
          {summaryRows.length > 0 ? (
            <dl className="resume-summary-grid">
              {summaryRows.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{joinChoices(row.items)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      {identity.summary ? (
        <section className="resume-section resume-summary">
          <h3>경력 요약</h3>
          <p>{identity.summary}</p>
        </section>
      ) : null}

      <section className="resume-section">
        <h3>경력</h3>
        <div className="resume-careers">
          {careers.map((career) => {
            const resumePhoto = getResumePhotoReference(career);
            const resumePhotoUrl = resumePhoto
              ? photoUrls.get(resumePhoto.assetId)
              : undefined;
            const kitchenItems = [...career.skills, ...career.equipment];
            const showBadge = hasPublicRecordBadge(career);

            return (
              <article className="resume-career" key={career.id}>
                <header>
                  <div className="resume-career-heading">
                    <div className="resume-career-title">
                      <h4>{career.restaurantName}</h4>
                      {career.role ? (
                        <p className="resume-career-role">{career.role}</p>
                      ) : null}
                    </div>
                    <p className="resume-career-period">
                      {formatMonthRange(
                        career.employmentStart,
                        career.employmentEnd,
                      )}
                      {career.restaurantLocation
                        ? ` · ${career.restaurantLocation}`
                        : ""}
                    </p>
                    {career.legalEmployer ? (
                      <small className="resume-employer">
                        <span>
                          {getEmployerLabel(career.origin)}:{" "}
                          {career.legalEmployer}
                        </span>
                        {showBadge ? <PublicRecordBadge /> : null}
                      </small>
                    ) : null}
                  </div>
                  {career.isDemo ? (
                    <span className="demo-tag">예시 데이터</span>
                  ) : null}
                </header>

                {career.restaurantHighlights.length > 0 ? (
                  <ul className="resume-highlights">
                    {career.restaurantHighlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                ) : null}

                {career.responsibilities.length > 0 ? (
                  <dl className="resume-duties">
                    <dt>{RESUME_SHEET_COPY.dutiesLabel}</dt>
                    <dd>{joinChoices(career.responsibilities)}</dd>
                  </dl>
                ) : null}

                {career.representativeExperience ? (
                  <p className="resume-representative">
                    {career.representativeExperience}
                  </p>
                ) : null}

                {resumePhoto && resumePhotoUrl ? (
                  <figure className="resume-career-photo">
                    <img src={resumePhotoUrl} alt={resumePhoto.description} />
                    <figcaption>{resumePhoto.description}</figcaption>
                  </figure>
                ) : null}

                {career.stations.length > 0 || kitchenItems.length > 0 ? (
                  <dl className="resume-kitchen-line">
                    {career.stations.length > 0 ? (
                      <div>
                        <dt>{RESUME_SHEET_COPY.entryStationsLabel}</dt>
                        <dd>{joinChoices(career.stations)}</dd>
                      </div>
                    ) : null}
                    {kitchenItems.length > 0 ? (
                      <div>
                        <dt>{RESUME_SHEET_COPY.entryKitchenLabel}</dt>
                        <dd>{joinChoices(kitchenItems)}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="resume-legend">
        <p>
          {hasBadge
            ? RESUME_SHEET_COPY.legendWithBadge
            : RESUME_SHEET_COPY.legendWithoutBadge}
        </p>
      </footer>
    </article>
  );
}
```

- [ ] **Step 6: Render `ResumeSheet` from `app/page.tsx`**

Add the imports:

```ts
import { ResumeSheet } from "./resume-sheet";
```

and add `summarizeIncludedCareers` to the `./resume-model.mts` import list.

Delete from `page.tsx`:

- The local `function getResumePhotoReference(...)` (currently lines 464 to 476).
- The `const sheetProfilePhotoUrl = …` declaration (currently lines 622 to 624).
- The type import `CareerPhotoReference` if nothing else in the file uses it (check with `grep -n CareerPhotoReference app/page.tsx`).

Add, directly after the `includedCareers` declaration:

```ts
  const photoUrls = useMemo(
    () =>
      new Map(
        [...photoAssets].map(([id, asset]) => [id, asset.objectUrl] as const),
      ),
    [photoAssets],
  );
  const careerSummary = useMemo(
    () => summarizeIncludedCareers(includedCareers, { today: currentMonth }),
    [includedCareers, currentMonth],
  );
```

`includedCareers` is currently a plain `careers.filter(...)` on every render. Wrap it so the memo above has a stable input:

```ts
  const includedCareers = useMemo(
    () => careers.filter((career) => career.included),
    [careers],
  );
```

Add the month once per session, next to the other `useState` calls:

```ts
  // The summary band ends a current career at this month. A lazy initializer
  // reads the clock once, which keeps the render itself pure.
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
```

If `pnpm lint` reports a React purity rule on this initializer, move the read into a `useEffect` that calls a `setCurrentMonth` setter once and start the state at `""`; `summarizeIncludedCareers` skips a current career while `today` is `""`, so the first paint shows the band without that career's months and the effect corrects it immediately.

Replace the whole `<article className="resume-sheet" data-print-root ref={resumeSheetRef}>…</article>` element in the `currentStep === 4` block with:

```tsx
              <ResumeSheet
                identity={sheetIdentity}
                careers={includedCareers}
                summary={careerSummary}
                showSummary={showCareerSummary}
                photoUrls={photoUrls}
                isDemo={isDemoDraft}
                ref={resumeSheetRef}
              />
```

`sheetIdentity` stays as it is: `isReviewExport ? toReviewIdentity(identity) : identity`.

- [ ] **Step 7: Update the styles**

In `app/globals.css`:

1. Delete the `.resume-provenance { … }` block near line 804, the second `.resume-provenance { … }` block near line 1776, and the `.resume-provenance { … }` block inside the `@media (max-width: 640px)` rule near line 2163.
2. Delete the `.resume-bullets`, `.resume-bullets li::marker`, `.resume-skills`, `.resume-skills > div`, `.resume-skills dt`, and `.resume-skills dd` blocks (currently lines 1822 to 1861), and the `.resume-skills > div { … }` block inside the 640 px media query.
3. Replace the `.resume-career header p { … }`, `.resume-career header .resume-location { … }`, and `.resume-career header small { … }` blocks with:

```css
.resume-career-heading {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.resume-career-title {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  align-items: baseline;
}

.resume-career-role {
  margin: 0;
  color: #474b46;
  font-size: 0.8rem;
  font-weight: 650;
}

.resume-career-period {
  margin: 0;
  color: #6b7069;
  font-size: 0.74rem;
  font-weight: 550;
}

.resume-career header small {
  color: #777c74;
  font-size: 0.66rem;
}
```

4. After the `.resume-summary > p { … }` block, add:

```css
.resume-summary-band {
  padding-top: 26px;
}

.resume-summary-heading-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  margin-bottom: 16px;
  border-bottom: 1px solid #b8bbb5;
}

/* The band's heading sits inside the row, so `.resume-section > h3` does not
   reach it. Repeat the label treatment without that rule's border. */
.resume-summary-heading-row h3 {
  margin: 0;
  font-family: var(--font-label);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.resume-summary-caption {
  margin: 0;
  color: #777c74;
  font-family: var(--font-label);
  font-size: 0.6rem;
  letter-spacing: 0.06em;
}

.resume-summary-headline {
  margin: 0 0 14px;
  font-family: var(--font-editorial);
  font-size: 1.15rem;
  font-weight: 600;
}

.resume-summary-grid {
  display: grid;
  gap: 8px;
  margin: 0;
}

.resume-summary-grid > div {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 14px;
}

.resume-summary-grid dt,
.resume-duties dt,
.resume-kitchen-line dt {
  color: #747971;
  font-family: var(--font-label);
  font-size: 0.61rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.resume-summary-grid dd {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.6;
}
```

5. After the `.resume-highlights li { … }` block, add:

```css
.resume-duties {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: baseline;
  margin: 0 0 12px;
  font-size: 0.78rem;
}

.resume-duties dd {
  margin: 0;
}

.resume-representative {
  padding-left: 14px;
  margin: 0 0 16px;
  border-left: 3px solid var(--red);
  font-family: var(--font-editorial);
  font-size: 0.98rem;
  line-height: 1.7;
}

.resume-kitchen-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 22px;
  padding-top: 12px;
  margin: 0;
  border-top: 1px solid #dedfdc;
  font-size: 0.72rem;
}

.resume-kitchen-line > div {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.resume-kitchen-line dd {
  margin: 0;
}

.public-record-badge {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 7px;
  border: 1px solid #2f5fb3;
  border-radius: 999px;
  background: #e8effb;
  color: #1f4a94;
  font-size: 0.6rem;
  font-weight: 720;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.resume-legend {
  padding-top: 20px;
  margin-top: 34px;
  border-top: 1px solid #b8bbb5;
  color: #6b7069;
  font-size: 0.64rem;
  line-height: 1.6;
}

.resume-legend p {
  margin: 0;
}
```

6. Inside the `@media (max-width: 640px)` rule, where the deleted `.resume-skills > div` block was, add:

```css
  .resume-summary-grid > div {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .resume-summary-heading-row {
    flex-direction: column;
    gap: 4px;
  }
```

7. Inside the `@media print` rule, change the `break-inside` selector list to:

```css
  .resume-career,
  .resume-section,
  .resume-career-photo,
  .resume-legend {
    break-inside: avoid;
  }
```

- [ ] **Step 8: Verify the build and look at the sheet**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: all succeed. `pnpm test` reports `pass 89`, `fail 0`.

Then start `pnpm dev`, open `http://localhost:3000`, click `예시 데이터로 흐름 보기`, walk to step 4, and confirm:

- The band shows `주방 경력 1년 4개월 · 레스토랑 조리`, a `맡을 수 있는 스테이션` row with `핫 / Hot · 파스타·면`, a `기술` row, and a `장비` row.
- The career shows `원문 사업장명: 주식회사 엠에프지코리아` followed by the `✓ 공공기록` badge.
- No `본인이 확인함` or `본인이 작성함` text appears on the sheet.
- The legend at the foot reads the `legendWithBadge` sentence.
- Unchecking `한눈에 보기를 이력서에 표시` removes the band and reloading the page then `저장된 내용 이어가기` restores it unchecked.
- `인쇄 · PDF 저장` opens the print preview with the sheet visible.

Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add app/resume-model.mts app/resume-model.test.mts app/provenance-tag.tsx app/resume-sheet.tsx app/page.tsx app/globals.css
git commit -m "feat(resume): print a summary band, a public-record badge and a legend on the sheet"
```

---

### Task 5: Print verification script

**Files:**
- Modify: `package.json` (`devDependencies`, `scripts`)
- Modify: `pnpm-lock.yaml` (regenerated)
- Modify: `.gitignore`
- Create: `scripts/print-verify.mts`

**Interfaces:**
- Consumes: `RESUME_DRAFT_STORAGE_KEY`, `RESUME_SHEET_COPY`, `createBlankCareerEntry`, `createDemoCareerEntries`, `serializeResumeDraft`, `CareerEntry`, `ResumeDraft`, `ResumeIdentity` from `app/resume-model.mts`. The button labels `저장된 내용 이어가기`, `요리 경력 보완하기`, `이력서 미리보기`, `인쇄 · PDF 저장`, `리뷰용 사본`, the checkbox label `한눈에 보기를 이력서에 표시`, and the selectors `.profile-photo-editor input[type=file]`, `.profile-photo-editor img`, `.career-photo-add input[type=file]`, `textarea[id^="photo-description-"]`, and the radio label `이 사진을 PDF에 사용` from `app/page.tsx`.
- Produces: `pnpm print:verify [--skip-build] [--falsify]`, PDFs under `.print-verify/`.

- [ ] **Step 1: Add the dependency, the script, and the ignore rule**

Run:

```bash
pnpm add -D playwright
pnpm exec playwright install chromium
```

Check the disk before the browser download: `df -h /` must show the Data volume below 90 %.

In `package.json`, add to `scripts`:

```json
    "print:verify": "node --experimental-strip-types scripts/print-verify.mts"
```

Append to `.gitignore`:

```gitignore

# print verification output - the PDF rule above already covers the files,
# this covers anything else the script writes there
/.print-verify/
```

- [ ] **Step 2: Write the script**

Create `scripts/print-verify.mts`:

```ts
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

  return page.pdf({
    path: path.join(OUTPUT_DIR, `${testCase.name}.pdf`),
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
      ? `\nFalsified run: the ink check failed on all ${CASES.length} cases, as it must.`
      : `\nAll checks passed for ${CASES.length} cases. PDFs are in ${OUTPUT_DIR}.`,
  );
}

await main();
```

- [ ] **Step 3: Type-check and lint the script**

Run:

```bash
pnpm typecheck
pnpm lint
```

Expected: both succeed. If `tsc` reports that `import(moduleUrl)` has an implicit `any`, keep it: the module is loaded at run time from a URL, and the `Inspection` return type is what the caller relies on.

- [ ] **Step 4: Run the script once and measure the ink ratios**

Run:

```bash
pnpm print:verify
```

Expected: six console lines of the form `<case>: <n> page(s), ink <ratio>`, then `All checks passed for 6 cases.`, and `.print-verify/` holds `demo.pdf`, `long.pdf`, `photos.pdf`, `review.pdf`, `photos-review.pdf`, and `no-summary.pdf`.

Write down the six ink ratios. They are inputs to Step 5 and to the verification note.

If a selector in `uploadPhotos` does not match, read the step 3 markup in `app/page.tsx` around the `profile-photo-editor` and `career-photo-add` class names and correct the selector in the script. Do not change `page.tsx` for the script.

If the worker fails to load through the same-origin route, replace the `workerSrc` assignment in `inspectPdf` with a Blob URL built from `await (await fetch(workerUrl)).text()` and note the change in the commit message.

- [ ] **Step 5: Run the falsified script and settle the threshold**

Run:

```bash
pnpm print:verify --skip-build --falsify
```

Expected: six ink ratios close to `0.0000`, then `Falsified run: the ink check failed on all 6 cases, as it must.`, exit code 0.

Now compare the two runs. `INK_THRESHOLD` must sit below one third of the lowest ratio from Step 4 and above three times the highest ratio from this step. If `0.002` does not satisfy both, change the constant to a value that does, re-run both commands, and keep the final value.

If a case keeps ink above the threshold with a transparent sheet, something outside `.resume-sheet` prints. Open that PDF, find the element, and report it as a finding before changing any style.

- [ ] **Step 6: Confirm CI does not run the script and commit**

Run:

```bash
grep -n "print:verify" .github/workflows/ci.yml
git status --short
```

Expected: the grep prints nothing. `git status` lists `package.json`, `pnpm-lock.yaml`, `.gitignore`, and `scripts/print-verify.mts`, and nothing under `.print-verify/`.

```bash
git add package.json pnpm-lock.yaml .gitignore scripts/print-verify.mts
git commit -m "test(resume): verify the printed sheet from a production build on demand"
```

---

### Task 6: Verification record

**Files:**
- Create: `docs/notes/<today>-resume-print-verification.md` (use the run date in `YYYY-MM-DD`)

**Interfaces:**
- Consumes: the six PDFs and the console output of Task 5, and the commit hash `git rev-parse --short HEAD`.

- [ ] **Step 1: Read the PDFs**

Open each file under `.print-verify/` with the Read tool, which renders PDF pages. Note for each:

- `long.pdf`: the page count and which career the first page break falls inside or between.
- `photos.pdf`: whether the profile photo sits in the header and the career photo sits below the representative sentence with its caption readable.
- `demo.pdf`: whether the band's longest row wraps and stays aligned with its label.
- `demo.pdf`: whether the badge reads clearly without its background.
- `review.pdf`: that the header shows the headline as the title and no contact line.
- `photos-review.pdf`: that the header has no profile photo while the career photo below the representative sentence is still there.

- [ ] **Step 2: Send the PDFs to the operator**

The operator works remotely and cannot open `.print-verify/`.
Load `SendUserFile` with `ToolSearch` (`select:SendUserFile`) and send the six PDFs.
They hold fixture data only, so nothing personal leaves the machine.

- [ ] **Step 3: Write the note**

Create the file with these sections and fill each from the run, not from memory:

```markdown
# Resume Print Verification

## Run

- Date: <YYYY-MM-DD>
- Commit: <short hash from git rev-parse --short HEAD>
- Command: `pnpm print:verify`, then `pnpm print:verify --skip-build --falsify`
- Browser: Chromium installed by `pnpm exec playwright install chromium`, version from `pnpm exec playwright --version`

## Automated Checks

| Case | Pages | Page 1 ink ratio | Falsified ink ratio | Result |
| --- | --- | --- | --- | --- |
| demo | <n> | <ratio> | <ratio> | pass |
| long | <n> | <ratio> | <ratio> | pass |
| photos | <n> | <ratio> | <ratio> | pass |
| review | <n> | <ratio> | <ratio> | pass |
| photos-review | <n> | <ratio> | <ratio> | pass |
| no-summary | <n> | <ratio> | <ratio> | pass |

`INK_THRESHOLD` is `<value>`: below one third of the lowest real ratio (`<ratio>`) and above three times the highest falsified ratio (`<ratio>`).
Falsified run: the ink check failed on all 6 cases, exit code 0.

## Visual Review

- `long.pdf`: <where the first page break falls>
- `photos.pdf`: <profile photo and career photo placement, caption legibility>
- `demo.pdf`: <band legibility with the longest row>
- `demo.pdf`: <badge legibility without background>
- `review.pdf`: <title and contact line observation>
- `photos-review.pdf`: <profile photo absent, career photo present>

## Findings

<One line per defect found, or "None.">

No PDF or screenshot is committed. The PDFs stay under `.print-verify/`, which `.gitignore` excludes.
```

Replace every `<…>` with the measured value. Ink ratios come from the script's console lines.

- [ ] **Step 4: Commit**

```bash
git add docs/notes/<today>-resume-print-verification.md
git commit -m "docs(resume): record the first print verification run"
```

---

### Task 7: Documentation companions, second opinion, and pull request

**Files:**
- Modify: `docs/plans/resume-builder-validation.md` (Track A Session Preflight)
- Modify: `docs/specs/resume-output-sheet.md` (Status)

- [ ] **Step 1: Add the preflight bullet**

In `docs/plans/resume-builder-validation.md`, in the list under `### Track A Session Preflight`, after the bullet that begins `- The standard PDF and the review PDF follow the photo visibility rules`, add:

```markdown
- `pnpm print:verify` passes on the build the session will use, and `pnpm print:verify --skip-build --falsify` fails its ink check on every case.
```

- [ ] **Step 2: Update the spec status**

In `docs/specs/resume-output-sheet.md`, replace the `## Status` paragraph's line `Not implemented yet.` with:

```markdown
Implemented on the `feat/resume-output-sheet` branch; the pull request number is added below when it opens.
```

After the pull request exists, change that line to `Implemented by PR #<number>.` and include it in the same PR with a follow-up commit.

- [ ] **Step 3: Full verification**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm print:verify --skip-build
```

Expected: all succeed. `pnpm test` reports `pass 89`, `fail 0`.

- [ ] **Step 4: Commit the documentation**

```bash
git add docs/plans/resume-builder-validation.md docs/specs/resume-output-sheet.md docs/plans/resume-output-sheet.md
git commit -m "docs(resume): approve the output sheet spec and add print verification to the preflight"
```

- [ ] **Step 5: Second opinion before pushing**

Invoke the `codex-review` skill on the branch diff against `main`. Fix confirmed findings in the task's own files with one commit per concern, and re-run Step 3 after any fix.

- [ ] **Step 6: Open the pull request**

Load the `responding-to-ai-pr-review` skill first. Then:

```bash
git push -u origin feat/resume-output-sheet
```

Write the body to a scratch file with one sentence per line and no hard wraps, then `gh pr create --title "feat(resume): strengthen the printed sheet" --body-file <path>`.
The body lists the spec, the six verification cases, the falsified run result, and the note path.
No session URL in the body.
Arm the review watch the skill describes before reporting the PR as open.

---

## Self-Review

**Spec coverage**

| Spec section | Task |
| --- | --- |
| Career Summary Band contents and omission rules | Task 1 (calculation), Task 4 (render) |
| Public Record Badge and Legend | Task 2 (rule), Task 4 (render, copy) |
| Career Entry Layout, eight items | Task 4 Step 5 |
| Display Toggle | Task 3 Steps 6 and 7 |
| `summarizeIncludedCareers`, `formatDuration`, `SUMMARY_LIMITS` | Task 1 |
| `hasPublicRecordBadge` | Task 2 |
| Draft Schema | Task 3 |
| Component Boundary | Task 4 Steps 4 to 6 |
| Styles and Print | Task 4 Step 7 |
| Print Verification setup, behavior, cases, checks, `--falsify` | Task 5 |
| Visual Review note | Task 6 |
| Tests | Tasks 1 to 4 |
| Acceptance: preflight bullet, spec status, lockfile in the same commit, no CI reference | Tasks 5 and 7 |

**Placeholder scan:** the `<…>` markers in Task 6 are fields for measured values from the run, each named. No other placeholders remain.

**Type consistency:** `CareerSummary`, `SUMMARY_LIMITS`, `summarizeIncludedCareers(entries, { today })`, `formatDuration`, `hasPublicRecordBadge`, `RESUME_SHEET_COPY`, `ResumeDraft.showCareerSummary`, and the `ResumeSheet` props carry the same names in every task that uses them.
