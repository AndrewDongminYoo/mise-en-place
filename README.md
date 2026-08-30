# Mise en Place

Mise en Place first helps culinary professionals turn scattered employment records into resumes that show what they actually did in a kitchen.
It will later connect those professionals with verified restaurants and help both sides manage healthy careers and employer reputations.

## First Product

The first product is a chef-specific resume builder:

- Import the employer name and qualification dates from one supported National Health Insurance certificate format.
- Let the person correct, confirm, or exclude every imported record.
- Keep the source employer name separate from the restaurant display name.
- Add culinary-specific roles, stations, responsibilities, skills, equipment, and representative experience.
- Produce one editable resume and one PDF layout.
- Ask separately whether the person wants to join a private talent pool for verified restaurants.

The original document stays in the browser and is not sent to the application server, analytics, logs, or an AI service.
Manual entry is the fallback when extraction fails.
OCR, direct government-service integration, multiple templates, automated career claims, public profiles, job recommendations, and mobile apps are outside the first slice.

Resume review remains required for the first product milestone, but its reviewer and operating model need a separate approved specification.

## Two Validation Tracks

Resume-tool adoption does not prove that a hiring network will work.
The repository therefore tracks the two hypotheses separately.

### A. Resume Tool

The immediate milestone is a four-step prototype: document import, employment-record confirmation, culinary-career enrichment, and PDF preview.
The target is 7 completed resumes from 10 culinary professionals, 5 participants who use or intend to use the result in an application, and 3 participants who choose private talent-pool storage for future hiring contact.

See [Resume Builder Validation Plan](docs/plans/resume-builder-validation.md).

### B. Hiring Network

The later network hypothesis is a narrow pairing of independent, chef-driven restaurants in Seoul and career-oriented cooks and pastry chefs with 1 to 10 years of experience.
Mise en Place does not aim to collect every food-service job.
It will not introduce a culinary professional to an employer that fails minimum verification.
Compensation, schedules, hours, breaks, overtime handling, and trial terms must be disclosed before an introduction without placeholders such as "negotiable," "company policy," or "to be discussed later."

The network gate remains 10 verified restaurant profiles, 30 culinary professional profiles, 10 mutual-interest matches, 5 interviews, 2 hires, a 30-day satisfaction check with both sides, and 3 restaurants that state they would pay for their next hire.
Passing the resume-tool gate does not satisfy this gate.

점핏, 원티드, and 리멤버 are positioning references for a trusted professional network and long-term career management.
They are not feature checklists.

## Documentation

- [Market Research Notes](docs/notes/2026-08-market-research.md) separate verified observations from research leads.
- [Resume Builder Validation Plan](docs/plans/resume-builder-validation.md) defines the immediate validation steps.
- [Founding Cohort Validation Plan](docs/plans/founding-cohort-validation.md) defines the later hiring-network validation.
- [Initial Product Scope](docs/specs/initial-product-scope.md) defines both product boundaries and their independent gates.

## Development

Install dependencies and start the local development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Available scripts:

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```
