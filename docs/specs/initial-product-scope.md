# Initial Product Scope

## Status

This document defines two validation hypotheses and their product boundaries.
It is not an application implementation specification.
Do not treat either hypothesis as validated until its independent gate has supporting evidence.

## Product Order

Mise en Place begins with a single-sided resume tool that gives one culinary professional an immediate result.
The hiring network remains the long-term product and a separate validation track.
Resume-tool adoption does not prove restaurant demand, hiring fit, or willingness to pay.

## Track A: Chef Resume Builder

### Product Statement

The first product turns a user-provided employment-history document into an editable culinary resume.
Document extraction supplies an employment skeleton.
The culinary professional supplies and confirms the role, station, responsibilities, skills, equipment, and representative experience that make the record useful.

### Supported Inputs

The first implementation slice evaluates:

- One candidate text-based National Health Insurance qualification certificate layout from the direct issuance flow.
- Manual entry as the fallback for unsupported or failed documents.

The candidate is a password-protected PDF with the `가입자 구분`, `사업장 명칭`, `자격 취득일`, and `자격 상실일` table headers.
The exact supported layout remains `[UNKNOWN]` until at least 5 usable cases pass the local validation in `docs/plans/resume-builder-validation.md`.
Do not add OCR or a generic document adapter for the first slice.
A user-provided Work24 integrated career certificate is a candidate second format after samples justify it.
Direct Work24 or National Health Insurance service integration is not approved, and the access path for private platforms remains `[UNKNOWN]`.

### Core Flow

1. Import the supported document or choose manual entry.
2. Review every extracted employer name and qualification date, then correct or exclude each record.
3. Add culinary-career details through structured choices and short authored text.
4. Preview, edit, print, or download one resume layout.

After the resume is complete, ask separately whether the person wants future contact from verified restaurants.
The default is to keep the profile private and outside the talent pool.

### Culinary Career Schema

Each imported employment record preserves:

- Source document type.
- Original employer name.
- Qualification acquisition date.
- Qualification loss date.
- Inclusion or exclusion decision.

The culinary professional can confirm or add:

- Restaurant display name.
- Actual employment start and end dates.
- Role, including a custom value.
- Independently owned stations.
- Up to 3 primary responsibilities.
- Cooking methods, ingredients, skills, and equipment.
- One representative experience or achievement.

The person enters resume identity and contact information separately.
Do not populate those fields from the employment-history document.

### Provenance Labels

Preserve provenance at the field level.

| Label | Meaning |
| --- | --- |
| Imported from public record | The browser extracted the original employer name or qualification date from a user-provided document. |
| Confirmed by the person | The person reviewed or corrected a restaurant name, employment date, or role. |
| Written by the person | The person supplied responsibilities, achievements, skills, equipment, or portfolio information. |

These labels describe the source of a field.
They do not certify the complete career record, job performance, role, or employment period.
Do not use labels such as "career verified" or "resume verified."
After the original document is discarded, do not imply that Mise en Place can independently reproduce or recheck it.

### Resume Output

The first slice provides one resume layout.
Every generated statement remains editable by the culinary professional.
The product may organize supplied facts, but it must not invent or exaggerate duties, seniority, achievements, or skills.
Print and PDF download are the only output formats required for the first slice.

### Resume Review Milestone

Resume review remains required for the first product milestone.
Feedback must remain separate from the authored resume until the culinary professional accepts a change.
The reviewer type, assignment model, response time, and payment model require a separate approved specification.
The document-import and resume-authoring validation can run before that operating model is selected.

### Talent-Pool Consent

Resume creation and talent-pool participation require separate choices.
Offer these outcomes only after resume completion:

- Save only the resume.
- Receive contact only for an explicitly selected opportunity.
- Make a private profile available to verified restaurants.

The default is the first option.
The validation prototype may measure the choice without persisting a profile.
Before server persistence begins, define how the person returns to, withdraws, and deletes the profile.
When a person explicitly chooses persistence, store only the confirmed structured data needed for that choice.
Never store the original source document.

### Privacy and Security Boundary

The source document can contain data that the product does not need.
The first slice therefore uses this boundary:

- Parse the source document in the browser.
- Do not send the source document or extracted document text to the application server, analytics, logs, session-recording tools, or an AI service.
- Do not store the source document in `localStorage`, IndexedDB, or another persistent browser store.
- Ignore names, resident registration numbers, certificate numbers, and other fields that are not needed to build the employment skeleton.
- Keep data on the device until the person performs a separate explicit save action.
- Send only the confirmed structured fields covered by that save action.
- Treat every imported or authored string as untrusted input and render it as text.
- Obtain talent-pool consent separately from resume creation.

This boundary is a product baseline, not a legal conclusion.
Review the current legal and consent requirements before any external launch or talent-pool persistence.

### Deferred Scope

The first implementation slice excludes:

- Multiple resume templates.
- AI-authored or embellished career claims.
- Support for every public-document format.
- OCR.
- Direct National Health Insurance or Work24 integration.
- Account synchronization.
- Restaurant auto-search or entity merging.
- Public profile URLs.
- Job recommendations.
- Cover-letter generation.
- Resume scores.
- Mobile applications.

### Resume-Tool Validation Gate

The resume-tool gate requires all of these results:

- At least 5 usable, consented certificates match the selected layout in browser-local tests.
- One National Health Insurance qualification certificate layout is processed.
- Original employer name, qualification acquisition date, and qualification loss date are extracted.
- Every extracted record can be corrected or excluded.
- Original employer name and restaurant display name remain separate.
- Each career entry accepts role, station, primary responsibilities, skills, and equipment.
- Imported, confirmed, and authored information remain distinguishable.
- The original source document is not stored on the server.
- One resume layout can be printed or downloaded as a PDF.
- At least 7 of 10 participating culinary professionals complete a resume.
- At least 5 participants use the resume in an application or state that they intend to use it.
- At least 3 participants choose private profile storage for future hiring contact.

## Track B: Verified Hiring Network

### Initial Segment

The initial network segment includes:

- Independent, chef-driven restaurants in Seoul.
- Cooks and pastry chefs with 1 to 10 years of experience.
- Full-time hiring where both sides value fit, retention, and professional growth.

The initial segment excludes:

- Hotels.
- Institutional food service.
- Franchises.
- Front-of-house part-time work.
- Day labor and individual shift staffing.

### Minimum Employer Verification

Mise en Place lists a role and makes introductions only after the employer provides evidence for:

- Business identity and recruiting contact.
- Worksite and role.
- Employment type and probation terms.
- Gross base compensation or a bounded compensation range.
- Normal workdays, hours, break time, and days off.
- Schedule confirmation timing.
- Overtime and late-close handling.
- Paid trial or stage terms, when applicable.
- Benefits and required deductions.
- Reason for the opening.
- Confirmation that the offered compensation and conditions meet current statutory requirements.

The required fields cannot use placeholders such as "negotiable," "company policy," or "to be discussed later."
Record the reviewer, review date, evidence source, and verification result.
The reviewer checks business identity and written employment terms against evidence.
The reviewer calculates whether compensation and working hours meet current statutory requirements by using current official sources.
Employer confirmation alone is not sufficient.
Repeat verification when any required field changes.

Do not publish the role or introduce a culinary professional when:

- A required field is missing.
- The offered terms do not meet current statutory requirements.
- The employer provides materially inconsistent information.
- The employer will not substantiate a required claim.

Verification confirms only the reviewed facts.
It is not a general endorsement of the employer.

### Profiles and Matching

The public restaurant profile contains:

- Culinary direction and restaurant vision.
- Head chef and core team introductions.
- Working conditions.
- Kitchen size and service volume.
- Education and feedback practices.
- Growth and advancement paths.
- Open positions.
- Required qualifications.
- Explicit deal-breakers.
- Business and working-condition verification status.

The private culinary professional profile contains:

- Confirmed employment history.
- Stations that the person can own.
- Cooking methods, ingredients, and equipment experience.
- Portfolio work.
- Skills that the person wants to learn.
- Preferred kitchen size and service format.
- Compensation and schedule expectations.
- Career direction across management, ownership, and specialist craft.
- Explicit deal-breakers.

The operator reviews both profiles and makes 3 to 5 manual introductions each week.
Each introduction explains the relevant facts and known mismatches.
The validation flow does not calculate an AI or rules-based compatibility score.

### Deferred Network Scope

Do not build these features for the founding cohort:

- Real-time chat.
- Automated recommendations.
- Public reviews.
- Mobile applications.
- Administration dashboards.
- Shift staffing.
- Community features.
- Success-fee billing.

### Revenue Hypothesis

The initial revenue hypothesis is a restaurant profile or job-posting fee.
Culinary professionals do not pay.
The initial model does not collect a success fee.

Confirm the legal classification before offering introductions or accepting payment.

### Hiring-Network Validation Gate

The network gate requires all of these results:

- 10 verified restaurant profiles.
- 30 completed culinary professional profiles.
- 10 mutual-interest matches.
- 5 completed interviews.
- 2 completed hires.
- A 30-day satisfaction check with each hired culinary professional and restaurant.
- 3 restaurants that state they would pay to use the service for their next hire.

The gate measures demand for the hiring service.
It does not prove that a specific interface, recommendation method, or technical architecture will work.

## Decision Rule

Passing Track A supports further investment in resume authoring, review, and consensual talent-pool entry.
It does not satisfy Track B.
Passing Track B supports further investment in verified restaurant profiles and hiring workflows.
