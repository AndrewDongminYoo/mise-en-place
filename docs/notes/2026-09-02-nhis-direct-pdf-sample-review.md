# National Health Insurance Direct-Issue PDF Sample Review

## Scope

An operator-supplied certificate from the National Health Insurance Service direct issuance flow was reviewed locally.
The source remains only in the operator's primary checkout under `.samples/`, which the local `.git/info/exclude` excludes.
The source is not present in this feature worktree, and Git does not track it.
This note contains no password, identity value, employer name, qualification date, or extracted document text.

## Observed Facts

- The PDF is password-protected and has two A4 portrait pages.
- The PDF contains a text layer with a Unicode mapping.
- A local PDF.js 6.3.289 diagnostic opened the document after local password entry.
- The text API exposed the `건강보험 자격득실확인서` title.
- The text API exposed the `가입자 구분`, `사업장 명칭`, `자격 취득일`, and `자격 상실일` table headers on each page.
- Employer and date values align with stable table columns.
- The reviewed Government24 proxy-issued samples do not expose this text layout and remain manual-entry cases.
- A production-build Google Chrome pass completed the Government24 manual fallback, incorrect-password retry, and direct-layout import.
- Requests made after document selection were limited to same-origin static assets and contained no request body.
- Web Storage, IndexedDB, and Cache Storage remained empty after the import.
- The browser pass reported no console or page errors.

## Browser Validation Method

The check used `pnpm build` and `pnpm exec next start -H 127.0.0.1 -p 3107`.
A temporary Playwright harness outside the repository drove the installed Google Chrome binary.
It selected the locally excluded samples and received the password through a hidden input pipe.
The harness activated request capture immediately before each import.
It rejected any request except same-origin `GET` requests for `/_next/static/` assets with no query string or body.
After import, it queried Web Storage, IndexedDB, and Cache Storage and required each store to be empty.
The harness exercised an incorrect password before the valid local password.
It also checked that the file stayed selected for retry and that both inputs were empty after success or manual fallback.
The run did not record the password, extracted text, document bytes, or request bodies in repository artifacts.

## Candidate Layout

The diagnostic parser targets this exact direct-issued layout:

- A4 portrait pages.
- The `건강보험 자격득실확인서` title.
- The four observed table headers at the observed column positions.
- `직장가입자` rows with an employer name and a qualification acquisition date.
- An optional qualification loss date for an active record.

The parser ignores identity, resident registration number, certificate number, and all non-employment fields.
Any page or target row that does not match the candidate layout must reach manual entry without a partial import.

## Evidence Status

The sample gate is `[PARTIAL]` with 1 usable case out of the required 5.
The candidate can support a browser-local diagnostic, but it is not yet a supported layout.
Four or more additional usable cases must confirm the layout and extracted rows before the support claim changes.
