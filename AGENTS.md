<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Mise en Place Project Rules

## Product Direction

Mise en Place begins as a chef-specific resume builder and grows into a hiring network for culinary professionals and verified restaurants.
The first product imports an employment-history skeleton from a supported user-provided document, lets the culinary professional confirm the record, and structures their actual role, station, skills, equipment, responsibilities, and achievements.
PDF parsing reduces input friction.
The product value is the structured culinary career record, not generic document extraction.
The long-term product lets culinary professionals manage resumes and portfolios while restaurants publish careers sites that explain their vision, culinary philosophy, kitchen operation, working conditions, and growth paths.
점핏, 원티드, and 리멤버 are positioning references, not feature requirements.

The first validation track is a single-sided resume tool.
It must support one text-based National Health Insurance qualification certificate format, manual entry as the fallback, complete correction or exclusion of extracted records, culinary-career enrichment, one resume layout, and local PDF output.
Do not add OCR, generic document adapters, direct government-service integration, multiple templates, automated career claims, or job recommendations until evidence justifies them.
Resume authoring, a separately specified review workflow, and opt-in talent-pool entry remain required parts of the first product milestone.
Do not remove these workflows during later scope reduction.

Treat an imported public record only as an employment-history skeleton.
Keep the original employer name separate from the restaurant display name.
Distinguish information imported from a public record, confirmed by the person, and written by the person.
Do not label the entire resume or career as verified.

Parse the original employment document in the browser.
Do not send the original document or its contents to the application server, analytics, logs, or an AI service.
Do not persist the original document in browser storage.
Ignore names, resident registration numbers, certificate numbers, and other fields that are unnecessary for employment-history extraction.
Only confirmed structured data may leave the browser after a separate explicit save action.
Talent-pool consent must be separate from resume creation and default to private.

The hiring network is a separate validation track, not proof supplied by resume-tool adoption.
It is not a broad restaurant job board or a fast-fill shift marketplace.
The initial network hypothesis is independent, chef-driven restaurants in Seoul and career-oriented cooks and pastry chefs with 1 to 10 years of experience.
Treat this segment as a hypothesis until the network validation gate in `docs/specs/initial-product-scope.md` passes.
Prefer concrete operating facts and deal-breakers over vague culture statements or opaque match scores.
List only employers and roles that pass the minimum verification in `docs/specs/initial-product-scope.md`.
Do not accept placeholders such as "negotiable," "company policy," or "to be discussed later" for required working-condition fields.
Do not introduce a culinary professional to an employer that fails verification.
Do not build account synchronization, real-time chat, recommendation algorithms, public reviews, mobile apps, or an administration dashboard during either validation track unless the operator explicitly changes the scope.

## Project Sources of Truth

- `docs/specs/initial-product-scope.md` defines the current product boundaries and validation gates.
- `docs/plans/resume-builder-validation.md` defines the resume-tool validation sequence.
- `docs/plans/founding-cohort-validation.md` defines the hiring-network validation sequence.
- `docs/specs/resume-review-workflow.md` proposes the resume-review operating model that the first product milestone requires. Draft, pending operator approval.
- `docs/specs/employer-verification-procedure.md` defines how the minimum employer verification is carried out and recorded. Draft, pending operator approval.
- `docs/notes/2026-08-market-research.md` records market observations and their evidence status.
- `docs/notes/2026-09-02-korean-employment-law-sources.md` owns the statutory figures and citations that employer verification reads.
- `docs/notes/2026-09-02-employment-service-legal-sources.md` holds the employment-service legal sources and the open questions for a qualified reviewer.
- `docs/notes/2026-09-02-founding-cohort-interview-guides.md` holds the Track B interview guides, anonymization rules, and note template.
- `docs/notes/2026-09-02-moderated-completion-test-protocol.md` holds the Track A session protocol and the observable definitions of the gate's behavioral thresholds.
- `docs/notes/2026-09-02-competitor-lead-check.md` records a public-page check of the research leads and what that depth can and cannot support.
- `docs/notes/` stores working evidence and research.
- `docs/plans/` stores approved execution plans.
- `docs/specs/` stores approved product and technical requirements.

## Repository Conventions

This repository uses Next.js 16.3.3, React 19.2.8, TypeScript, Tailwind CSS 4, and pnpm 11.22.0.
Use the scripts in `package.json` through pnpm.
Keep the validation documents current when an approved product decision changes the target segment, profile schema, deferred scope, or validation gate.
