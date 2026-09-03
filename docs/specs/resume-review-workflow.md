# Resume Review Workflow

## Status

Approved by the operator on 2026-09-02.

`docs/specs/initial-product-scope.md` section "Resume Review Milestone" records resume review as a required part of the first product milestone and defers four decisions to a separate specification: reviewer type, assignment model, response time, and payment model.
This document settles those four decisions for the validation slice only, and adds the review data boundary and feedback model that the four decisions depend on.

The four decisions are approved, but the reasoning behind each one is a chosen default rather than evidence.
Each names the alternative it rejected, so a later decision can reverse it cheaply once Track A produces evidence.

## Scope

This specification covers resume review during Track A validation, with 10 or fewer participating culinary professionals at a time.
It does not describe a reviewer marketplace, a paid review product, or any review capability for Track B.

Read this document together with:

- `docs/specs/initial-product-scope.md` for the product boundary, the provenance labels, the privacy and security boundary, and the Track A gate.
- `docs/plans/resume-builder-validation.md` for the moderated completion tests that this review workflow runs inside.

## What Review Is

Review answers one question: does this resume let a hiring restaurant understand what this person actually did in a kitchen?

A review produces feedback about clarity, missing kitchen detail, and unclear scope of responsibility.
Review does not check whether a claim is true.
Review does not add a credential, a badge, a score, or any signal that the career record was verified.

`docs/specs/initial-product-scope.md` prohibits labels such as "career verified" and "resume verified."
A reviewed resume is still an unverified self-authored record, and the product must not present it otherwise.

## Decision 1: Reviewer Type

**Decision.** The operator is the only reviewer during Track A validation.

The operator already runs the moderated completion tests in `docs/plans/resume-builder-validation.md`, already sees each participant's resume in that session, and is the person who must read the failure points.
A second reviewer role would add a recruiting problem, a quality-control problem, and a consent question before there is any evidence that review changes resume usefulness.

Rejected alternatives:

| Alternative | Why it is rejected for this slice |
| --- | --- |
| Peer review by another culinary professional | Requires a participant pool that does not exist yet, and exposes one participant's resume to another before any consent model is defined. |
| Paid professional resume writer | Introduces a payment flow, a contractor relationship, and a rewriting incentive that conflicts with the authored-content rule below. |
| AI-generated review | `docs/specs/initial-product-scope.md` excludes AI-authored or embellished career claims in its deferred scope, which carries this row on its own. Its privacy boundary separately forbids sending the source document or extracted document text to an AI service, and does not reach authored resume content. |
| Head chef or restaurant reviewer | Mixes Track A with Track B, and makes an employer a gatekeeper of a document the person has not chosen to share with employers. |

Revisit this decision only when completion evidence shows that review affects whether participants use the resume.

## Decision 2: Assignment Model

**Decision.** Review is requested explicitly by the culinary professional and assigned manually to the operator in a single queue.

Review never starts automatically when a resume reaches preview.
The person asks for it, in the same way the talent-pool choice is asked separately from resume creation.

The queue is a dated list held by the operator.
Each entry records the request date, the participant identifier used in the validation notes, the review date, and the completion date.
There is no routing rule, no capacity model, and no assignment interface.

Rejected alternative: automatic review on resume completion.
That would make review a step of the product rather than a choice, and it would move resume content off the device without a separate decision by the person.

## Decision 3: Response Time

**Decision.** The stated target is 2 business days from request to returned feedback, and the committed limit is 3 business days.

The target is stated to the person before they request a review, so a request is an informed choice rather than an open wait.
When the committed limit cannot be met, the operator tells the person the new date before the limit passes rather than after.

These numbers are a starting commitment for a single reviewer with at most 10 participants.
They are not a service level for any later product.

These took effect on 2026-09-03.
The condition was that a participant can leave and return to a saved draft, and the draft-continuity prerequisite below closed with PR #5.

Review returned inside the moderated session still has no turnaround to measure, so the numbers bind only where a request and its return are separated.
Which of the two a session uses is part of the sequencing decision in `docs/notes/2026-09-02-moderated-completion-test-protocol.md`, not a reason to leave the commitment unstated: the target has to be stated before the person requests a review, and by then the session already knows which it is.

## Decision 4: Payment Model

**Decision.** Review is free during Track A validation, for every participant, with no future-payment commitment stated or implied.

`docs/specs/initial-product-scope.md` states the revenue hypothesis as a restaurant profile or job-posting fee, and states that culinary professionals do not pay.
Charging a culinary professional for review would contradict that hypothesis and would test pricing before the underlying value is demonstrated.

Do not present review as a trial of a paid feature, and do not collect payment details.

## Review Data Boundary

Review is the first workflow that requires resume content to leave the device.
It therefore needs its own boundary, and that boundary must not weaken the one in `docs/specs/initial-product-scope.md`.

This path does not run until the consent script covers it.
`docs/notes/2026-09-02-moderated-completion-test-protocol.md` drafts the four consent items for the export, its channel, its deletion, and the option to strip identity fields; they are not approved yet, and the review phase stays off until they are.

Rules for the validation slice:

- The person exports the resume themselves, through the print or PDF output that the product already provides.
- The person sends that export to the operator through a channel the person already controls and chooses.
- The application does not upload the resume, does not transmit it to a review service, and does not gain a server-side review store.
- The original source document is never part of a review request, and the reviewer never asks for it.
- The person removes the identity and contact fields from the export before sending it. Review works without them, so removal is the default rather than an option the person has to think of.
- The operator deletes the received export **as soon as the review is returned**, which is what consent item 13 promises, and records that deletion date in the review queue entry.
  This is not the 90-day point that `docs/notes/2026-09-02-founding-cohort-interview-guides.md` sets for research notes. A resume export is the participant's own document, not a coded note, and it is deleted on completion rather than on that schedule.
- Deletion covers the operator's local copy **and** the message thread on whichever channel carried it. A deletion that leaves the file in a chat history has not happened.
- Review feedback is returned as text, not as a rewritten resume file.

This keeps the review loop inside the existing browser-local boundary and needs no new persistence, no account, and no new dependency.

Revisit this boundary only when server persistence is approved, and only after the return, withdrawal, and deletion flow that `docs/specs/initial-product-scope.md` requires before persistence exists.

## Feedback Model

Feedback stays separate from the authored resume until the person accepts a change.
This is the constraint that `docs/specs/initial-product-scope.md` already states, expressed as a working format.

Each feedback item has four parts:

1. The resume section it refers to.
2. The observation, stated as what a reader cannot tell from the current text.
3. A question that would produce the missing fact, addressed to the person.
4. Optionally, a rewording of facts the person already supplied.

A feedback item is a suggestion.
Nothing in a feedback item changes the resume until the person edits their own resume.

### Provenance After Acceptance

An accepted suggestion keeps whatever label the field already carried.
A reworded responsibility or achievement stays "Written by the person"; a reworded role or employment date stays "Confirmed by the person"; an imported employer name or qualification date is not something the reviewer may reword at all.
The labels in `docs/specs/initial-product-scope.md` are field-level, so a rule that stamped one label on every accepted suggestion would relabel the fields it touched.
In every case the label still describes the source of the information, because the reviewer may reword only facts the person already supplied.

Because that rule carries the label, it is enforced on the reviewer, not on the person.
See the conduct limits below.

Do not add a fourth provenance label for reviewed content.
A "reviewed" label would read as a quality claim about a record that review does not check.

## Reviewer Conduct Limits

The reviewer must not:

- Introduce a fact, duty, station, skill, item of equipment, seniority level, or achievement that is not already in the resume or in the person's own answer to a review question.
- Increase the scope of a stated responsibility, for example by rewriting a station role as kitchen-wide ownership.
- Estimate or fill an employment date.
- Change an original employer name, or merge it into the restaurant display name.
- Suggest wording that implies the record was verified.
- Retain, forward, or reuse a participant's resume outside the review and the validation notes.
- Record source-document text, resident registration numbers, or certificate numbers in any review artifact.

When the reviewer believes a fact is missing, the reviewer asks a question.
The reviewer does not supply a plausible answer.

## Prerequisite: Draft Continuity

**Satisfied on 2026-09-03 by PR #5.**
This section recorded the prerequisite while it was open; the paragraphs below say what was decided and what it now costs.

The prototype used to hold the resume in page state only, so reloading lost the draft and a person who left for a review and returned could not apply feedback to the resume they wrote.
Two ways to satisfy it were offered: run every review inside one moderated session with the draft kept open, or add a browser-local export and import of the confirmed structured record as a file.

The operator approved a third mechanism instead.
The confirmed structured record is written to `localStorage` once the person passes the step-2 confirmation, and `restoreStoredDraft` in `app/page.tsx` brings it back on an explicit action rather than silently.
The source document, its extracted text and its password are still never stored, so the privacy boundary in `docs/specs/initial-product-scope.md` is unchanged.

This covers a participant returning on the same device and browser, which is what an asynchronous review in these sessions needs.
It does not cover a different device, and the file export from the second option above remains the way to do that if a session ever requires it.
Review is therefore no longer restricted to a single sitting on that ground.

## Prerequisite: An Identity-Free Export

**Satisfied on 2026-09-03 by PR #8.**

The data boundary requires the participant to remove identity and contact fields before sending the export, and consent item 14 asks them to.
The build could not do it: `getEnrichmentErrors` in `app/resume-model.mts` rejects an empty name, so a resume without one could not reach preview, and the print sheet in `app/page.tsx` always rendered `identity.name`.
Removing the name to satisfy the boundary therefore removed the participant's ability to produce the export at all.

The resolution leaves that validation alone and omits the fields at render time instead.
`toReviewIdentity` in `app/resume-model.mts` blanks name, email and phone, and a second print action on the preview renders the sheet from it.
The headline, the summary and every career record stay, because they describe the work the reviewer is asked to read.
The draft is untouched, so one resume produces both copies and the person keeps their own name.

The removal is the product's rather than the person's, which is what the review data boundary above requires.
Both prerequisites are now closed, so the review phase is no longer blocked on an application change, and consent item 14 asks for something the product does.

## Review Validation Gate

Review is measured against the resume it changes, not against reviewer output volume.
This milestone passes when all of the following hold:

- Every review request in the queue has a request date, a review date, and a recorded deletion date for the received export.
- Every returned review consists of feedback items in the four-part format above.
- No returned review contains a fact that the person did not supply.
- Every accepted change was applied by the person, in their own resume, and no accepted change altered an imported employer name or qualification date.
- At least 5 participants request a review after completing a resume.
  The review phase of `docs/notes/2026-09-02-moderated-completion-test-protocol.md` is where this count would be produced, and that phase is off until the operator decides whether review runs in parallel with the Track A sessions or after them.
  `docs/plans/resume-builder-validation.md` step 4 currently sequences it after, so this gate has no run path until that decision is made.
- At least 3 of those participants change their resume after reading the feedback.
- No participant reports that the review made a claim they could not stand behind.

The last item is a stop condition.
One report of an unsupportable claim means the conduct limits failed, and the workflow is corrected before any further review.

## Deferred Review Scope

Do not build these for the validation slice:

- A reviewer marketplace, reviewer accounts, or reviewer profiles.
- In-product commenting, threads, or chat.
- A review request queue inside the application.
- Review turnaround tracking, reviewer ratings, or reviewer payment.
- Automatic or AI-assisted review.
- A reviewed badge, resume score, or completeness score.
- Review for restaurant profiles, which belongs to Track B and is specified separately.

## Open Decisions

| Decision | State |
| --- | --- |
| Draft continuity mechanism for asynchronous review | Resolved 2026-09-03 — browser-local `localStorage` persistence with an explicit restore, PR #5. Covers one device; see the prerequisite section above. |
| Whether review remains free after Track A | `[UNKNOWN]` — depends on the Track A outcome and the Track B revenue hypothesis. |
| Reviewer type after validation | `[UNKNOWN]` — reconsider only with evidence that review changed resume usefulness. |
| Consent wording for sending a resume export to the operator | Drafted as items 12 to 15 of the consent script in `docs/notes/2026-09-02-moderated-completion-test-protocol.md`, awaiting approval alongside the sequencing decision. `docs/plans/resume-builder-validation.md` step 3 has no consent step, which is why the wording lives in the protocol. |
