# Resume Print Verification

## Run

- Date: 2026-10-31
- Commit: `122dde0`
- Command: `pnpm print:verify`, then `pnpm print:verify --skip-build --falsify`
- Browser: Chromium installed by `pnpm exec playwright install chromium` (headless Chromium `156.0.8078.4`, Playwright Chromium revision 1248), Playwright `1.64.1` (`pnpm exec playwright --version`)

Both runs, the normal and the falsified, were made at this commit.
The first record was made at `5b4767e` on 2026-09-19 with Playwright `1.63.0` and Chromium revision 1243.
It was re-run at `0aef5eb` for the Track A dry run in `docs/notes/2026-10-31-track-a-dry-run.md`, after dependency updates and a formatter pass changed `app/`, `scripts/print-verify.mts`, `package.json`, and `pnpm-lock.yaml`.
Page counts did not change, and only the `long` ratio moved, from `0.0402` to `0.0401`.
It was re-run again at `122dde0`, after the runtime moved to Node 26 and `break-after: avoid` on `.resume-section > h3` moved the "경력" heading off the foot of page 1 in the two photo cases.
Page counts did not change; the `photos` ratio moved from `0.0223` to `0.0211` and the `photos-review` ratio from `0.0214` to `0.0192`, because the heading and its rule left page 1.
The visual review below was checked against the `122dde0` PDFs for `photos.pdf` and `photos-review.pdf`, and against the `0aef5eb` PDFs for the others, whose ratios did not change.

## Automated Checks

| Case          | Pages | Page 1 ink ratio | Falsified ink ratio | Result |
| ------------- | ----- | ---------------- | ------------------- | ------ |
| demo          | 1     | 0.0410           | 0.0000              | pass   |
| long          | 2     | 0.0401           | 0.0000              | pass   |
| photos        | 2     | 0.0211           | 0.0000              | pass   |
| review        | 1     | 0.0399           | 0.0000              | pass   |
| photos-review | 2     | 0.0192           | 0.0000              | pass   |
| no-summary    | 1     | 0.0336           | 0.0000              | pass   |

`INK_THRESHOLD` is `0.002`: below one third of the lowest real ratio (`0.0192 / 3 = 0.0064`) and above three times the highest falsified ratio (`3 × 0.0000 = 0.0000`, displayed at four decimals).
Falsified run: the ink check failed on all 6 cases, as it must, and the run exited 0.
Its PDFs are written under `.print-verify/falsified/`, apart from the real ones.

## Visual Review

- `long.pdf`: 2 pages (was 3 before the fix in `74cbb56`); 검증 레스토랑 1 and 2 now render on page 1, directly below the career-summary band and the "경력" heading; the page break falls between 검증 레스토랑 2 and 검증 레스토랑 3, between two careers rather than inside one, and page 1 is no longer left mostly blank.
- `photos.pdf`: still 2 pages; 검증 레스토랑 1 does not fit the remaining page-1 space because its career photo makes the entry taller, so it moves as a whole to page 2 along with 검증 레스토랑 2; this is the per-entry `break-inside: avoid` on `.resume-career` working as intended (an entry too tall for the remaining space moves whole rather than splitting), not the section-wide grouping defect that affected `long.pdf`.
  Since `0d56748` the "경력" heading moves to page 2 with the first career instead of staying alone at the foot of page 1, so page 1 ends after `경력 요약`.
  The profile photo still sits in the header next to the name, and the career photo for 검증 레스토랑 1 on page 2 still sits below its representative sentence with the caption "검증용 접시 · 소스와 플레이팅" clearly legible.
- `demo.pdf`: the band's longest row (기술: 파스타·생면 · 생선 필레·손질 · 수비드) renders on a single line at this content length and stays aligned with its label column, alongside the shorter 맡을 수 있는 스테이션 and 장비 rows.
- `demo.pdf`: the "✓ 공공기록" public-record badge and the "예시 데이터" badge render as outlined, unfilled pills, and their text stays legible against the white page background.
- `review.pdf`: the header shows the headline "Chef de Partie" as the title in place of the name, and there is no email or phone line.
- `photos-review.pdf`: the header has no profile photo, the "경력" heading starts page 2 as in `photos.pdf`, and the career photo below 검증 레스토랑 1's representative sentence is still present with its caption legible.

## Findings

Before the fix in `74cbb56`, `long.pdf` page 1 held only the header, the career-summary band, and `경력 요약`, with roughly the bottom two-thirds of the page blank and all six careers starting on page 2.
The cause was `break-inside: avoid` on `.resume-section` in `app/globals.css`, which grouped the entire career section (its `경력` heading plus all six career entries) as one indivisible block, so the whole block moved to page 2 whenever it could not fit as a unit.
Fixed in `74cbb56` by dropping `.resume-section` from that selector and adding `.resume-summary-band` and `.resume-summary` by name, so only individual careers (via the pre-existing `.resume-career` rule) and the two small header sections are kept intact, letting the career list start filling page 1 again.

The earlier record's falsified figures came from a build before `74cbb56` and were re-taken at `8f826fa`.

PR #12 review found that `page.tsx` read the current month once at mount, so a tab left open across a month boundary would print a current career one month short; `5b4767e` re-reads the month when the preview is entered or printed.
Both runs were repeated at `5b4767e` with the same page counts and ratios as the record made then, which is expected because the fixtures do not span a month boundary.

No PDF or screenshot is committed. The PDFs stay under `.print-verify/`, which `.gitignore` excludes.
