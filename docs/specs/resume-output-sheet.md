# Resume Output Sheet Specification

## Status

The operator approved the design in chat on 2026-09-18 and this specification on 2026-09-19.
Not implemented yet.

This document defines the next resume-tool slice: the printed resume sheet.
It adds a derived career summary band, replaces the repeated provenance tags on the sheet with one public-record badge and one legend, restructures each career entry, and adds a repeatable print verification.
The product boundary, the provenance labels, and the privacy boundary stay as `docs/specs/initial-product-scope.md` defines them.
This slice changes no field in steps 1 to 3 and no rule in the Track A gate.

## Goal

Make the one required resume layout show the value of the structured culinary record.

`docs/notes/2026-08-market-research.md` records that employer-and-period import is not a sufficient differentiator, because Saramin already offers it.
The differentiator is the reconstruction of what the person owned, practiced, and achieved in each kitchen.
Steps 1 to 3 already collect that record.
The current sheet prints it as a flat list: six generic responsibility chips as bullets, one representative sentence, and `Station`, `Skills`, and `Equipment` joined by dots.
This slice makes the sheet present that record the way a hiring chef reads a resume.

The sheet is also the only tester-visible output, and the two latest fixes (`#9`, `#11`) were print defects that no test covered.
This slice adds a print verification that runs on demand.

## Product Decisions

Each decision names the alternative the operator rejected, so a later decision can reverse it with the reason in view.

- **Summary band contents: duration, specialties, stations, skills, and equipment.** Rejected: duration and stations only (too small to change the first impression), and no duration (removes the number a reader looks for first).
- **The band carries a caption and a display toggle, not a new provenance label.** The band reorganizes facts the person confirmed or authored, which `docs/specs/initial-product-scope.md` allows under "The product may organize supplied facts".
  Rejected: a fourth provenance label (a spec change with three documents to update), and a default-off band behind an explicit confirmation checkbox (one more step in the completion flow, and a band a participant may never see).
- **The person controls the band as a whole.** The toggle shows or hides the band.
  There is no per-item removal and no free-text editing of the band.
  To change the band, the person edits the careers in step 3.
- **One public-record badge replaces the per-career provenance tags on the sheet.** A record imported from a document gets one compact badge next to the original employer name.
  The tags `본인이 확인함` and `본인이 작성함` leave the sheet and move into one legend at the foot of the sheet.
  The three sources stay distinguishable on the sheet through structure and the legend rather than through repeated tags.
- **The badge and the legend name a source, never a certification.** `docs/specs/initial-product-scope.md` forbids labels such as "career verified".
  No badge text, tooltip, or legend sentence uses the word `인증`.
- **Layout: a full-width summary band under the header.** Rejected: a two-column sidebar (narrower career column, no sidebar from page 2, half-empty column on the review copy, restacking on mobile), and a minimal change that keeps the current bullets and lists.
- **Print verification lives in the repository and runs on demand.** Playwright is a `devDependency`.
  The script does not run in CI.
  Rejected: a Playwright run outside the repository (not repeatable), a CI end-to-end job (browser download and CI cost on every push), and manual print preview only (not reproducible).

## Scope

### Career Summary Band

The band renders directly under the resume header and before the `경력 요약` section.

The band contains:

- A title `한눈에 보기` and a caption `포함된 경력에서 정리함`.
- A first line with the total kitchen duration and the culinary specialties, for example `주방 경력 3년 4개월 · 레스토랑 조리`.
- A definition list with up to three rows: `맡을 수 있는 스테이션`, `기술`, and `장비`.

Omission rules:

- Omit a row when its list is empty.
- Omit the duration when it is zero months.
- Omit the band when every row and the first line are empty.
- Omit the band when `showCareerSummary` is `false`.

The band prints in both the standard PDF and the review copy.

### Public Record Badge and Legend

The badge renders at the end of the original employer line of a career entry when `hasPublicRecordBadge(entry)` is `true`.
The badge shows a check glyph and the text `공공기록`.
The badge carries `title="사업장명을 공공기록에서 불러옴"`.
The badge uses blue text, a blue border, and a light blue background.
The Chrome print dialog does not print background graphics by default, so a tester's PDF shows the badge without its background.
The border, the glyph, and the text must carry the badge on their own, in color and in grayscale.

The legend renders as the last element of the sheet and prints with it.

- When at least one included career shows the badge, the legend reads: `✓ 표시가 있는 사업장명은 공공기록에서 불러왔습니다. 레스토랑명·근무 기간·직책은 본인이 확인했고, 그 외 내용은 본인이 작성했습니다.`
- When no included career shows the badge, the legend reads: `모든 내용은 본인이 작성했습니다.`

The legend mentions only the employer name, because the employer name is the only imported value the sheet prints.
The sheet does not print the qualification dates.

The six `ProvenanceTag` placements on the current sheet are removed.
`ProvenanceTag` stays in steps 2 and 3, which this slice does not change.

### Career Entry Layout

Each included career renders in this order:

1. Restaurant display name and role on one line.
2. Employment period and, when present, the restaurant location on the next line.
3. The original employer line (`원문 사업장명:` for a document record, `법인명:` for a manual record with a value), with the badge when applicable.
   Omit the line when a manual record has no employer value.
4. `restaurantHighlights` as the existing list, when present.
5. `주요 업무` as one inline line that joins the selected responsibilities with ` · `.
   Omit the line when the list is empty.
6. The representative experience as one emphasized paragraph with a left rule.
   Omit it when empty.
7. The selected resume photo with its description as the caption, when present.
8. One compact line with `스테이션` and `기술·장비`, each followed by its values joined with ` · `.
   Omit a label whose list is empty, and omit the line when both are empty.

The demo tag `예시 데이터` stays where it is today.

### Display Toggle

Step 4 shows a checkbox `한눈에 보기를 이력서에 표시` below the preview action buttons.
The checkbox is checked by default and is excluded from print.
The checkbox binds to `showCareerSummary` in the draft.
A hint below the checkbox reads: `내용을 바꾸려면 3단계에서 경력을 수정하세요.`

## Data Model

All additions are pure functions in `app/resume-model.mts`.
No existing exported function changes its signature or behavior.

### `summarizeIncludedCareers(entries, options)`

Input: the career entries and `options.today` as a `YYYY-MM` string.
The caller passes `today`, so tests are deterministic.

Output:

```typescript
type CareerSummary = {
  totalMonths: number;
  specialties: string[];
  stations: string[];
  skills: string[];
  equipment: string[];
};
```

Rules:

- Use only entries with `included === true`.
- For the duration only, skip an entry whose `employmentStart` does not match `YYYY-MM`.
  The entry still contributes to the specialties, stations, skills, and equipment lists.
- Convert each remaining entry to an inclusive month interval.
  When `isCurrent` is `true`, the end month is `options.today`, whatever `employmentEnd` holds.
  Otherwise the end month is `employmentEnd` when it matches `YYYY-MM`.
  Skip an entry that has neither.
  Skip an entry whose end month is earlier than its start month.
- `totalMonths` is the total length of the union of those intervals.
  Overlapping months count once.
  A single career from `2023-03` to `2023-05` counts 3 months.
- `specialties` is the union of `culinarySpecialties`, ordered as `CULINARY_SPECIALTY_OPTIONS` orders them, mapped to their labels.
- `stations`, `skills`, and `equipment` are each the union of the corresponding field, ordered by:
  1. The number of included careers that contain the item, descending.
  2. The first appearance when careers are walked from the most recent `employmentStart` to the oldest, ascending.
  3. When two careers share `employmentStart`, their order in the `entries` array.
  Within one career, items keep the order the person selected them in.
- Cut each list at `SUMMARY_LIMITS`: 8 stations, 6 skills, 6 equipment items.
  Export the limits as one constant.

### `formatDuration(totalMonths)`

- `0` → `""`.
- Fewer than 12 months → `8개월`.
- A whole number of years → `2년`.
- Otherwise → `3년 4개월`.

### `hasPublicRecordBadge(entry)`

Returns `true` only when all of these hold:

- `entry.origin === "document"`.
- `entry.importedFields !== null`.
- `entry.legalEmployer`, `entry.qualificationStart`, and `entry.qualificationEnd` equal the values in `entry.importedFields`.

The third condition is defensive.
Step 2 does not let the person edit those fields on a document record today.

### Draft Schema

`ResumeDraft` gains `showCareerSummary: boolean`.

- `serializeResumeDraft` writes the field.
- `parseResumeDraft` fills a missing field with `true`, so a draft stored before this slice restores unchanged.
- `parseResumeDraft` discards the draft when the field is present and is not a boolean, which matches the existing strictness for other fields.
- `RESUME_DRAFT_STORAGE_KEY` does not change.

## Component Boundary

A new file `app/resume-sheet.tsx` exports a stateless `ResumeSheet` component.
It renders the `<article className="resume-sheet">` that `app/page.tsx` renders inline today.

Props:

- `identity: ResumeIdentity` — already stripped by `toReviewIdentity` when the review copy is active.
- `careers: CareerEntry[]` — the included careers in order.
- `summary: CareerSummary`.
- `showSummary: boolean`.
- `photoUrls: ReadonlyMap<string, string>` — asset id to object URL.
- `isDemo: boolean`.
- `ref` — forwarded to the `<article>`, because `page.tsx` waits for the sheet's images before `window.print`.

The component reads no store and holds no state.
`ResumeSheet` renders the `data-print-root` attribute on the article.
`page.tsx` keeps the action buttons, the toggle, the talent-pool panel, and the print-mode logic, and it passes `resumeSheetRef` through `ref`.
`page.tsx` computes the summary with `useMemo` and passes the current `YYYY-MM` as `today`.

## Styles and Print

New classes in `app/globals.css`: `.resume-summary-band`, `.resume-summary-caption`, `.resume-summary-grid`, `.public-record-badge`, `.resume-duties`, `.resume-representative`, `.resume-kitchen-line`, and `.resume-legend`.

- Apply `break-inside: avoid` to the band, to each career entry, and to the legend.
- Below 640 px, the band's definition list collapses to one column.
- Remove `.resume-bullets`, `.resume-skills`, and `.resume-provenance` when the sheet no longer uses them.
- Keep the existing `@media print` rules, including `animation: none` on `.preview-stack`.

## Print Verification

### Setup

- Add `playwright` to `devDependencies` and regenerate `pnpm-lock.yaml` in the same commit.
- Install only Chromium: `pnpm exec playwright install chromium`.
- Add the script `print:verify` to `package.json`, which runs `scripts/print-verify.mts` with `node --experimental-strip-types`.
- Add `/.print-verify/` to `.gitignore`.
  The existing `*.[pP][dD][fF]` rule already excludes the PDFs, and the directory rule excludes anything else the script writes there.
- Do not add the script to any CI workflow.
  `tsconfig.json` includes `**/*.mts`, so `pnpm typecheck` in CI type-checks the script without running it.

### Behavior

The script:

1. Builds the application with `pnpm build` and starts `next start` on a free port.
2. Opens a Chromium page.
3. Uses `addInitScript` to write a fixture draft to `localStorage` under `RESUME_DRAFT_STORAGE_KEY` and to replace `window.print` with a function that sets `window.__printRequested = true`.
   The print handlers wait for the sheet's images before they call `window.print`, so the flag is the only signal that a handler finished.
4. Walks the wizard to step 4 through the same buttons a person uses.
   The `photos` case stops at step 3 to upload the images first.
5. Clicks the print button the case needs, waits for `window.__printRequested` with `waitForFunction`, and only then writes the PDF with `page.pdf({ printBackground: false })`.
   `printBackground: false` matches the Chrome print dialog default, so the PDFs show what a tester's PDF shows.
   The `review` case clicks the review-copy button, every other case clicks the standard print button.
6. Rasterizes page 1 of each PDF and extracts its text, then runs the automated checks.
7. Stops the server and exits with a non-zero code when any check fails.

Fixtures are built with `serializeResumeDraft`, so the script never hand-writes the stored shape.

The rasterization runs inside the Chromium page with the `pdfjs-dist` build that the application already depends on.
The script serves that file to the page with `page.route`, renders page 1 to a canvas, and counts the pixels that are not white.
No new dependency is needed for it.

The script accepts a `--falsify` flag.
With the flag, the script injects `@media print { .resume-sheet { opacity: 0; } }` with `addStyleTag` before it prints.
That run must fail the ink check on every case.
It proves that the check reads the rendered page and not only the text layer.

### Cases

| Case | Fixture | Output |
| --- | --- | --- |
| `demo` | `createDemoCareerEntries()` with a demo identity | `.print-verify/demo.pdf` |
| `long` | 6 manual careers without photos, each with responsibilities, stations, skills, and equipment | `.print-verify/long.pdf` |
| `photos` | 2 careers, with one PNG uploaded through the step 3 file input as a profile photo and one as a career photo selected for the PDF | `.print-verify/photos.pdf` |
| `review` | The `demo` fixture after the review-copy button is clicked | `.print-verify/review.pdf` |
| `photos-review` | The `photos` fixture after the review-copy button is clicked | `.print-verify/photos-review.pdf` |
| `no-summary` | The `demo` fixture with `showCareerSummary: false` | `.print-verify/no-summary.pdf` |

The `photos-review` case reads the boundary that `docs/specs/resume-review-workflow.md` assigns to the product: with a profile photo stored, the review copy must print without it.

The PNG for the `photos` case is generated in the script as a buffer.
No image file is committed.

### Automated Checks

- Page 1 of every PDF has ink: the share of rasterized pixels that are not white is above `INK_THRESHOLD`.
  This is the defect class of `#11`, a sheet that printed while transparent.
  A text-layer check cannot catch it, because text drawn at zero opacity still extracts as text.
  The threshold is measured, not assumed: the first run records the lowest ratio a real sheet printed and the highest ratio the `--falsify` run printed, and the constant sits between them with a margin of at least three times on each side.
- Every PDF has text on page 1.
- The sheet DOM holds the expected number of `img.resume-profile-photo` elements when the print snapshot is taken: one for `photos`, none for every other case, including `photos-review`.
- `review.pdf` and `photos-review.pdf` contain none of the fixture name, email, or phone.
- `demo.pdf`, `long.pdf`, `photos.pdf`, and `review.pdf` contain `한눈에 보기`.
- `no-summary.pdf` does not contain `한눈에 보기`.
- `demo.pdf` contains `공공기록`, because `createDemoCareerEntries()` returns one document record, and `long.pdf` does not contain it.
- Every PDF contains the legend sentence that its fixture requires.

### Visual Review

The operator opens the PDFs and records these observations in `docs/notes/<date>-resume-print-verification.md`:

- The commit the run used, the automated check results, and the result of the `--falsify` run.
- Where page breaks fall in `long.pdf`.
- Photo placement and caption legibility in `photos.pdf`.
- Band legibility with the longest lists.
- Badge legibility without its background.

The note holds text only.
No PDF or screenshot is committed, because the repository is public.

## Tests

Add to `app/resume-model.test.mts`:

- `summarizeIncludedCareers`: two overlapping careers count shared months once, two adjacent careers add, a current career ends at `today`, an excluded career is ignored, an entry without a valid start is skipped.
- `formatDuration`: `0`, months only, whole years, years and months.
- Ordering by career count and then by recency, and the `SUMMARY_LIMITS` cut.
- `hasPublicRecordBadge`: `true` for a document record, `false` for a manual record, `false` when an imported field differs.
- `parseResumeDraft`: a missing `showCareerSummary` restores as `true`, a non-boolean value discards the draft, and a serialize-parse round trip preserves `false`.

`app/print-styles.test.mts` stays as it is.

## User Flow

### STEP 04: Preview and PDF

1. The person reaches step 4 and sees the sheet with the summary band, the restructured career entries, the badge on imported records, and the legend.
2. The person can uncheck `한눈에 보기를 이력서에 표시` to hide the band.
   The choice persists with the draft.
3. `인쇄 · PDF 저장` prints the sheet with the person's identity.
4. `리뷰용 사본 · 이름과 연락처 제외` prints the same sheet without name, email, phone, and profile photo.
   The band, the badge, and the legend stay in the review copy.

## Acceptance Criteria

- The band shows the duration as the union of employment months, so two overlapping careers do not double count.
- The band shows specialties, stations, skills, and equipment from included careers only, in the documented order and within `SUMMARY_LIMITS`.
- The toggle hides the band, persists in the draft, and a draft stored before this slice restores with the band shown.
- A document record shows exactly one badge, a manual record shows none, and no sheet text contains `인증`.
- The sheet shows no `ProvenanceTag`, and the legend matches the badge state.
- Each career entry renders the eight items in the documented order, with the documented omissions.
- `ResumeSheet` renders the sheet from props alone, and the print-image wait still works through the forwarded ref.
- `pnpm test` passes with the new model tests.
- `pnpm lint` and `pnpm typecheck` pass.
- `pnpm print:verify` produces the six PDFs and passes every automated check, `pnpm print:verify --falsify` fails the ink check on every case, and no CI workflow runs the script.
- `pnpm-lock.yaml` changes in the same commit as `package.json`.
- The verification note exists and contains no PDF, screenshot, or personal data.
- `docs/plans/resume-builder-validation.md` lists `pnpm print:verify` in the Track A session preflight.

## Deferred Scope

This slice excludes:

- Per-career kitchen context fields such as service format, covers per service, or brigade size.
  Observe whether participants write these into `restaurantHighlights` before adding structured fields.
- Per-item removal or free-text editing of the summary band.
- Printing the qualification dates on the sheet.
- Multiple templates, AI-authored text, resume scores, cover letters, public URLs, and job recommendations, as `docs/specs/initial-product-scope.md` lists.
- The review workflow in `docs/specs/resume-review-workflow.md`, which runs after the Track A gate.
- Parser coverage, which waits for the samples in `docs/notes/2026-09-02-nhis-direct-pdf-sample-review.md`.
- Any change to steps 1 to 3.

## Source Alignment

- `docs/specs/initial-product-scope.md`: "Resume Output" allows organizing supplied facts and forbids invention, "Provenance Labels" forbids "verified" wording, and "Deferred Scope" lists what this slice must not add.
- `docs/specs/resume-review-workflow.md`, "Provenance After Acceptance": the labels stay field-level and no fourth label is added.
  This slice keeps the field-level labels in the model and in steps 2 and 3, and changes only how the sheet shows them.
- `docs/specs/resume-review-workflow.md`, "Review Data Boundary" and "Prerequisite: An Identity-Free Export": the review copy must omit name, email, phone, and profile photo and keeps everything that describes the work.
  The band, the badge, and the legend describe the work and contain no identity field, so they stay in the review copy.
  The sheet moves from `app/page.tsx` to `app/resume-sheet.tsx`, and `toReviewIdentity` still feeds it.
- `docs/notes/2026-08-market-research.md`, "Saramin": import is not the differentiator, the reconstruction of kitchen work is.
- `docs/notes/2026-09-02-moderated-completion-test-protocol.md`, "Changing the Prototype Mid-Run": the build freezes across the 10 sessions, so this slice lands before session 1.
- `docs/plans/resume-builder-validation.md`, "Track A Session Preflight": the print verification joins the per-session checks.
