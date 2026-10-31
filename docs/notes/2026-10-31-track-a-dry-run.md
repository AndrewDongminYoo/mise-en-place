# Track A Dry Run

The moderated completion-test protocol asks for a dry run before session 1, because a restart costs 10 more participants from the segment Track B also needs.
This note records that dry run against the Track A Session Preflight in `docs/plans/resume-builder-validation.md`.
It contains text only: no PDF, screenshot, certificate, or participant data.

## Run

- Date: 2026-10-31
- Code commit: `122dde0`. Every check below ran against this commit.
- Runtime: Node 26.13.0 from `devEngines.runtime` through pnpm 11.22.0, Next.js 16.4.3.
- Browser: Playwright 1.64.1 with headless Chromium 156.0.8078.4 (Playwright Chromium revision 1248).
- Server: the production build that `pnpm print:verify` produced, served by `next start` on the loopback interface.

The first run on the same day was at `0aef5eb`.
Its findings changed the build, so this record replaces it; see Findings and Decisions.

## Freeze Rule

Session 1 can run on a later commit only when this command prints nothing:

```bash
git diff --stat 122dde0 <session commit> -- . ':(exclude)docs' ':(exclude)*.md'
```

Any output means this dry run does not cover the session build, so run it again first.
The check excludes documentation instead of listing code paths, so a new root file such as `next.config.ts`, an instrumentation file, or a script tag in `public/` also counts.
A list of only `app`, `scripts`, `package.json`, and `pnpm-lock.yaml` would miss those files, and consent item 7 warns that an added error reporter or analytics tag would break the document promise without any visible change.
Record the build commit on every session sheet, as the protocol requires.

## Preflight Results

| Condition                                                                     | What was observed                                                                                                  | Result |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------ |
| `pnpm install --frozen-lockfile`                                              | Exit 0.                                                                                                            | pass   |
| `pnpm test`, `pnpm lint`, `pnpm typecheck`                                    | 89 of 89 tests pass; lint and typecheck exit 0.                                                                    | pass   |
| `pnpm print:verify`                                                           | All 6 cases pass; figures in `docs/notes/2026-09-19-resume-print-verification.md`.                                 | pass   |
| `pnpm print:verify --skip-build --falsify`                                    | The ink check fails on all 6 cases; the form with `--` before the flags gives the same result.                     | pass   |
| `pnpm preflight:verify --skip-build`                                          | All 21 checks pass; the rows below come from it.                                                                   | pass   |
| An intentional request makes the network guard report a failure               | `fetch("/photo-network-guard-probe")` was captured in both walkthroughs.                                           | pass   |
| Consent item 7: after the warm-up import, an import sends no request          | Warm-up: 6 same-origin `GET` requests under `/_next/static/`, empty bodies. Next import: 0 requests.               | pass   |
| A participant who adds no photos completes the workflow                       | Manual entry through steps 1 to 4, standard and review print; no photo on either sheet; talent pool `resume-only`. | pass   |
| A participant who adds photos can edit a description and change the selection | A required description was changed and the representative photo moved to another photo; the sheet uses the change. | pass   |
| The standard and review PDFs follow the photo visibility rules                | Preview and standard print: 1 profile photo, 2 career photos. Review print: 0 profile photos, 2 career photos.     | pass   |
| The photo workflow sends no photo file, Blob, Object URL, or description      | 0 requests while adding, editing, printing, reloading, and restoring photos.                                       | pass   |
| The participant can delete the stored draft and all local photos              | Before: the draft key and 4 stored photos. After "이 기기에서 지우기": no draft key and 0 photos.                  | pass   |

## Method

`pnpm preflight:verify` (`scripts/preflight-verify.mts`) runs the browser checks on demand and is not part of CI.
Run it after `pnpm print:verify`, or without `--skip-build` to build first.

- The network guard listens on the browser context, so worker requests are included.
  After the page has loaded, every HTTP or HTTPS request counts as a failure.
  It also searches each request URL and body for the photo descriptions, `blob:` URLs, and the imported file's name and first bytes.
- Page loads and reloads are outside the guard.
- The deletion check reads `localStorage` and the `mise-en-place-media` IndexedDB database before and after the deletion, so an empty result after deletion is compared with a non-empty baseline.
- All inputs are synthetic: photos are generated PNGs (1200 × 900 and 900 × 1200), and the import file is a one-page PDF the script prints itself.

## Findings and Decisions

The first run at `0aef5eb` found three things. The operator decided the first two on 2026-10-31.

1. **The first import in a tab downloads application code.**
   Importing a PDF made 6 `GET` requests for `/_next/static/chunks/*.js` on the same origin, each with an empty body, and a second import in the same tab made none.
   No request carried the file name or the document bytes, but the protocol's check that "no request leaves the page" read as a failure on a new tab.
   Decision: the moderator imports once before the participant arrives.
   The protocol now describes that warm-up, and `pnpm preflight:verify` checks both steps.
2. **A career photo left the "경력" heading alone at the foot of page 1.**
   Decision: fix it before session 1.
   `0d56748` adds `break-after: avoid` to `.resume-section > h3`, and `photos.pdf` and `photos-review.pdf` now start page 2 with the heading.
3. **The media plan and the preflight name different servers.**
   Task 6 of `docs/plans/resume-restaurant-metadata-and-local-media.md` runs its browser checks on `pnpm dev`.
   This dry run used the production build, because the preflight asks for the build the session will use.

The runtime also moved from Node 24 to Node 26 in `7319fc4`, so that `@types/node` 26 describes the runtime it runs on.

## Not Covered

- A successful import of a National Health Insurance certificate. No certificate was used, because this repository is public; the synthetic PDF only exercised the fallback path.
- The browser developer-tools panels that the protocol tells the moderator to use. The script observes the same requests through Playwright.
- Browsers other than Chromium, and the device the sessions will use.
- The 7th-photo limit and the 20 MB rejection, which belong to the media plan's acceptance checks rather than to the preflight.
