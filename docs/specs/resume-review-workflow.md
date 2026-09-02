# Resume Review Workflow

## Status

This document is a draft operating specification.
It is not approved until the operator accepts it.

`docs/specs/initial-product-scope.md` section "Resume Review Milestone" records resume review as a required part of the first product milestone and defers four decisions to a separate specification: reviewer type, assignment model, response time, and payment model.
This document proposes those four decisions for the validation slice only, and adds the review data boundary and feedback model that the four decisions depend on.

The recommendations here are chosen defaults, not evidence.
Each one names the alternative it rejected so a later decision can reverse it cheaply.

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
| AI-generated review | `docs/specs/initial-product-scope.md` excludes AI-authored or embellished career claims, and the privacy boundary forbids sending resume content to an AI service. |
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

## Decision 4: Payment Model

**Decision.** Review is free during Track A validation, for every participant, with no future-payment commitment stated or implied.

`docs/specs/initial-product-scope.md` states the revenue hypothesis as a restaurant profile or job-posting fee, and states that culinary professionals do not pay.
Charging a culinary professional for review would contradict that hypothesis and would test pricing before the underlying value is demonstrated.

Do not present review as a trial of a paid feature, and do not collect payment details.

## Review Data Boundary

Review is the first workflow that requires resume content to leave the device.
It therefore needs its own boundary, and that boundary must not weaken the one in `docs/specs/initial-product-scope.md`.

Rules for the validation slice:

- The person exports the resume themselves, through the print or PDF output that the product already provides.
- The person sends that export to the operator through a channel the person already controls and chooses.
- The application does not upload the resume, does not transmit it to a review service, and does not gain a server-side review store.
- The original source document is never part of a review request, and the reviewer never asks for it.
- The person removes the identity and contact fields from the export before sending it when they prefer to, and review still works without them.
- The operator deletes the received export at the agreed deletion point recorded in the validation consent, and records that deletion date in the review queue entry.
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

An accepted suggestion keeps the "Written by the person" label.
The label describes the source of the information, and the information still comes from the person: the reviewer may reword only facts the person already supplied.

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

The current prototype holds the resume in page state only.
Reloading the page loses the draft, so a person who leaves for a review and returns cannot apply feedback to the resume they wrote.

This makes draft continuity a prerequisite for any asynchronous review, and it is not yet specified.
Two ways to satisfy it:

- Run each review inside one moderated session, with the participant keeping the draft open. This needs no implementation and is sufficient for the moderated completion tests.
- Add a browser-local export and import of the confirmed structured record, as a file the person saves and reopens. This keeps the browser-local boundary and would also let a participant return across sessions.

The second option is the smaller long-term cost, but it is an application change and is out of scope for this document.
The decision is `[UNKNOWN]` until the operator selects one.
Until then, review runs in moderated sessions only.

## Review Validation Gate

Review is measured against the resume it changes, not against reviewer output volume.
This milestone passes when all of the following hold:

- Every review request in the queue has a request date, a review date, and a recorded deletion date for the received export.
- Every returned review consists of feedback items in the four-part format above.
- No returned review contains a fact that the person did not supply.
- Every accepted change was applied by the person, in their own resume, and no accepted change altered an imported employer name or qualification date.
- At least 5 participants request a review after completing a resume.
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
| Draft continuity mechanism for asynchronous review | `[UNKNOWN]` — see the prerequisite section above. |
| Whether review remains free after Track A | `[UNKNOWN]` — depends on the Track A outcome and the Track B revenue hypothesis. |
| Reviewer type after validation | `[UNKNOWN]` — reconsider only with evidence that review changed resume usefulness. |
| Consent wording for sending a resume export to the operator | `[UNKNOWN]` — draft it with the validation consent in `docs/plans/resume-builder-validation.md` step 3. |
