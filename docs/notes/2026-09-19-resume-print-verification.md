# Resume Print Verification

## Run

- Date: 2026-09-19
- Commit: `e22394c`
- Command: `pnpm print:verify -- --skip-build`, then `pnpm print:verify -- --skip-build --falsify`
- Browser: Chromium installed by `pnpm exec playwright install chromium` (`Chrome Headless Shell 153.0.8010.12 (playwright chromium-headless-shell v1243)`), Playwright `1.63.0` (`pnpm exec playwright --version`)

## Automated Checks

| Case | Pages | Page 1 ink ratio | Falsified ink ratio | Result |
| --- | --- | --- | --- | --- |
| demo | 1 | 0.0410 | 0.0000 | pass |
| long | 3 | 0.0177 | 0.0000 | pass |
| photos | 2 | 0.0211 | 0.0000 | pass |
| review | 1 | 0.0399 | 0.0000 | pass |
| photos-review | 2 | 0.0192 | 0.0000 | pass |
| no-summary | 1 | 0.0336 | 0.0000 | pass |

`INK_THRESHOLD` is `0.002`: below one third of the lowest real ratio (`0.0177 / 3 = 0.0059`) and above three times the highest falsified ratio (`3 × 0.0000 = 0.0000`, displayed at four decimals).
Falsified run: the ink check failed on all 6 cases, as it must, and the run exited 0.
Its PDFs are written under `.print-verify/falsified/`, apart from the real ones.

## Visual Review

- `long.pdf`: 3 pages; the first page break (page 1 to page 2) falls between the career-summary band and the career list, before the first career entry (검증 레스토랑 1); the career list then breaks a second time (page 2 to page 3) between 검증 레스토랑 4 and 검증 레스토랑 5.
- `photos.pdf`: the profile photo sits in the header next to the name; the career photo for 검증 레스토랑 1 sits below its representative sentence, with the caption "검증용 접시 · 소스와 플레이팅" clearly legible.
- `demo.pdf`: the band's longest row (기술: 파스타·생면 · 생선 필레·손질 · 수비드) renders on a single line at this content length and stays aligned with its label column, alongside the shorter 맡을 수 있는 스테이션 and 장비 rows.
- `demo.pdf`: the "✓ 공공기록" public-record badge and the "예시 데이터" badge render as outlined, unfilled pills, and their text stays legible against the white page background.
- `review.pdf`: the header shows the headline "Chef de Partie" as the title in place of the name, and there is no email or phone line.
- `photos-review.pdf`: the header has no profile photo, and the career photo below 검증 레스토랑 1's representative sentence is still present with its caption legible.

## Findings

None.

No PDF or screenshot is committed. The PDFs stay under `.print-verify/`, which `.gitignore` excludes.
