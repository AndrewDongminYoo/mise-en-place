# Employer Verification Procedure

## Status

Approved by the operator on 2026-09-02.

This procedure does not define what must be verified.
`docs/specs/initial-product-scope.md` section "Minimum Employer Verification" owns the required-field list, the four no-publish conditions, and the rule that employer confirmation alone is not sufficient.
This document adds what that section leaves open: which evidence satisfies a field, how the statutory calculation is performed, what the verification record contains, where it is kept, and how a refusal and a re-verification are handled.

When the two disagree, `docs/specs/initial-product-scope.md` governs and this document is corrected.

## Prerequisite

`docs/plans/founding-cohort-validation.md` blocks introductions and payment testing until the operating model has been reviewed against current official guidance or by qualified counsel, and requires the reviewed model recorded before external operation.
Approaching an employer for evidence is external operation, so it waits for that record too.
`docs/notes/2026-09-02-employment-service-legal-sources.md` holds the sources and the open questions for that review.

Running this procedure on a real employer is part of Track B operation.
Do not run it before that review is recorded.

## Who Reviews

One reviewer per employer, named in the record.
During the founding cohort the reviewer is the operator.

The reviewer's job is to compare what the employer states against evidence, and to calculate the statutory result independently.
The reviewer does not negotiate terms, does not advise the employer on how to become compliant, and does not decide that a shortfall is acceptable.

## Evidence

`docs/specs/initial-product-scope.md` lists the fields that must be evidenced.
This section lists the artifacts that can supply that evidence.

Every required field must map to at least one artifact below.
A field with no artifact is not verified, whatever the employer has said about it.

| Artifact | Supplies evidence for | Notes |
| --- | --- | --- |
| 사업자등록증 | Business identity. | Check that the business name, registration number, and representative match every other document. |
| 영업신고증 or the equivalent food-service permit | Worksite identity. | The permitted address is the worksite claim to check the role against. |
| A written 근로계약서 or a draft offer for the specific opening | Employment type, probation terms, compensation, workdays, hours, breaks, days off, overtime handling, trial terms, benefits, deductions. | 근로기준법 제17조 already requires some of these in writing; the source table lists which. The rest are not covered by that article and have to be asked for. |
| 취업규칙, where the employer has one | Schedule confirmation timing, overtime and late-close handling, break practice. | Required by law above a size threshold; its absence is not itself a finding. |
| A recent payslip for the same role, with personal identifiers removed | Whether the stated compensation matches what is actually paid. | Ask for the role, not the person. Do not accept a document carrying a resident registration number. |
| A named recruiting contact reachable at a business channel | Recruiting contact. | A personal messenger handle with no business identity behind it does not satisfy this. |
| The employer's stated 상시 근로자 수 and the basis for it | Which 근로기준법 provisions apply. | Recount it; see the statutory calculation below. |
| A written statement of the reason for the opening | Reason for the opening. | Compare against tenure of the previous holder when the employer will state it. Record that tenure in months only. The previous employee is not a party to this verification and did not consent to anything, so nothing else about them enters the record. |

Anything the employer supplies as an image or a scan is evidence of the same rank as a document, provided the reviewer can read every field being relied on.
A verbal statement is not evidence and never closes a field on its own.

Every artifact must arrive with the personal identifiers of any individual removed.
This applies to the 근로계약서 and the 취업규칙 as much as to the payslip: an executed contract routinely carries the employee's name, resident registration number or date of birth, address, and signature, and none of that is evidence for any required field.

Do not accept, and do not store, any document containing a resident registration number, a bank account number, or an identity-verification image.
If one arrives, ask for a redacted replacement and delete the original immediately.
Immediate deletion overrides the agreed retention point below, in both the published and the refused paths.

## Statutory Calculation

`docs/specs/initial-product-scope.md` requires the reviewer to calculate whether compensation and working hours meet current statutory requirements using current official sources.
The sources are in `docs/notes/2026-09-02-korean-employment-law-sources.md`.
That note owns the numbers; this procedure owns the order of operations.

Perform these in order, and record each result.

1. **Re-read the source table.**
   Open `docs/notes/2026-09-02-korean-employment-law-sources.md` and check that its rows were confirmed recently enough to rely on.
   Record the date you read it.
   The minimum wage changes on a fixed annual cycle, so a review near a year boundary must state which year's figure the offer was measured against.

2. **Count 상시 근로자 수 yourself.**
   Apply 근로기준법 시행령 제7조의2 rather than accepting the employer's headcount.
   Record the counted number and the count date.
   This decides whether the working-time, overtime-premium, and annual-leave rules apply at all.

3. **Reduce the offer to an hourly figure.**
   An hourly offer is already one; use the stated rate.
   A monthly offer is divided by the schedule's **conversion hours**, which are its monthly 소정근로시간 **plus** the paid weekly rest hours that schedule earns.
   Dividing by worked hours alone inflates the hourly figure and will pass an offer that is under the minimum: 2,000,000원 over roughly 174 worked hours reads as 11,494원 and passes, while the same offer over its 209 conversion hours is 9,569원 and fails the 2026 figure.
   The 209 in the source table is that sum for a 40-hour week, not a constant. Compute the schedule's own sum whenever the schedule differs, and record which number you divided by.
   Exclude any component that is not counted toward the minimum wage.
   When the offer states a range, use the bottom of the range.

4. **Compare against the minimum wage for the year the work will start.**
   A start date in the following calendar year is measured against that year's figure.

5. **Check any probation reduction against the occupation.**
   Read the contract-length and probation-window conditions, and the excluded occupation class, from the source table rather than from memory.
   Classify by the work actually described in the offer, not by the title in the listing.
   A 조리보조 role misclassified as a 조리사 is the most likely wage error in this segment, and it goes in the direction that underpays.

6. **Check hours, breaks, and the weekly paid rest day.**
   The source table's annex section says which provisions the counted headcount switches off.
   Check every provision that applies at the counted size, and record the ones that do not apply as not applicable rather than leaving those lines blank.

7. **Check the stated trial or stage terms.**
   An unpaid trial shift is a compensation claim like any other and is measured the same way.
   Record what the employer said the trial pays, in the same units as the offer.

8. **Record the arithmetic, not only the verdict.**
   Another person has to be able to reproduce the calculation from the record without asking the reviewer what was assumed.

When a calculation cannot be completed because a field is missing, the field is missing.
Do not fill it with a typical value for the segment.

## Consistency Checks

`docs/specs/initial-product-scope.md` makes materially inconsistent information a no-publish condition.
These are the comparisons that surface it.

- Business name, registration number, and representative across every submitted document.
- Worksite address on the permit against the worksite stated for the role.
- Compensation in the offer against the payslip for the same role.
- Hours in the offer against the restaurant's published opening hours and the stated 서비스 volume.
- The number of staff implied by the kitchen size and service volume against the counted 상시 근로자 수.
- The reason for the opening against the previous holder's tenure in months, when stated.
- The offered compensation against the average implied by the employer's published 국민연금 data, where the workplace appears in it.
  `docs/notes/2026-09-02-korean-employment-law-sources.md` holds the source and its three limits: much of this segment is below the dataset's coverage threshold, the figure is censored at the contribution ceiling, and it averages every role at the workplace.
  Treat a gap as a question to ask, never as a finding, and never show the figure to a culinary professional beside a specific offer.

A mismatch is not automatically disqualifying.
Ask once, record the explanation, and record whether the explanation is substantiated.

## Placeholders

`docs/specs/initial-product-scope.md` prohibits placeholder answers such as "negotiable," "company policy," or "to be discussed later" in a required field.
Treat these as the same refusal in other words:

- A compensation figure with no upper bound, or a range so wide it states nothing.
- "면접 시 협의" and equivalents.
- "업계 관행에 따름."
- A schedule stated only as "매장 사정에 따라."
- A trial period with no stated pay.
- A benefit stated as "4대보험 등" with no specification of which are enrolled.

Record the exact wording the employer used.
The wording is the evidence for the refusal, and a paraphrase is not.

## What a Listing Is

A verified listing is one vacancy, not a standing advertisement.

- The listing names the number of people being hired for it. Two openings are two listings or one listing stating two.
- The listing expires 30 days after publication. A continuing vacancy is re-published as a new round with a new record, not extended.
- An employer whose listing for the same role has been continuously open for more than 90 days is not re-published without a stated explanation of why the vacancy persists, recorded in the round.
- The listing states what the person does in their first week: the station they own or assist on, the shift pattern, and who they report to.

The last item is the one that closes the gap this product exists for.
Compensation and hours can be verified from documents; what the work actually is arrives on the first day, and 채용절차의 공정화에 관한 법률 제4조제3항 names exactly that harm without reaching an employer of this size.
See `docs/notes/2026-09-02-korean-employment-law-sources.md`.

`docs/specs/initial-product-scope.md` does not yet list the first-week description among the required fields, and its section on minimum employer verification owns that list.
Add it there before treating this as a required field rather than a verification practice.

## Removal and Suspension

Not publishing a role and removing an employer are different acts, and conflating them is how a removal becomes arbitrary.

| Situation | Consequence |
| --- | --- |
| A required field is blank or carries a placeholder | The role is not published. No removal. The employer may supply the field. |
| A stated fact is contradicted by the employer's own evidence during verification | The round is refused and recorded. No removal on a first instance. |
| The same field is misstated again in a later round, after a refusal on it | Suspension. |
| A placed culinary professional reports that a stated condition differs from what they were told, and re-verification confirms it | Suspension. |

The last row is the one that matters, because it is the only trigger that reads the employer's behaviour rather than their paperwork, and it is the harm the statute leaves unaddressed at this size.

A suspension requires all of these, recorded in the round:

- The specific field, the statement made, and the evidence that contradicts it.
- The date, and the reviewer who decided.
- Notice to the employer stating the field and the contradiction, and nothing further.
- A stated end date. The default is 180 days; the operator sets it.
- A route back: the employer supplies corrected evidence and passes a fresh verification round.

While suspended, the employer's roles are not published and no introduction is made.
Do not silently keep a suspended employer's listing in a pending state, and do not describe a suspension publicly.
The suspension is between the operator and the employer; publishing it is a claim about a named business that this procedure does not support.

`[UNKNOWN]` — the 180-day default, and whether an appeal exists beyond re-verification, are operator decisions and are not settled here.

Two things to settle before the first suspension:

- The revenue hypothesis charges the employer, so a suspension withdraws a paid service. Whatever the employer agrees to when they pay has to state this consequence in advance, or the first suspension is a dispute rather than a rule.
- `docs/notes/2026-09-02-employment-service-legal-sources.md` carries the question of what the platform may assert and act on when it finds a false statement, given that the Act granting that standing does not apply below 30 employees.

## The Verification Record

One record per employer, per verification round.

`docs/specs/initial-product-scope.md` requires the reviewer, review date, evidence source, and verification result.
The record adds these so it can be reproduced and re-checked later:

| Field | Content |
| --- | --- |
| Employer | Business name and registration number as they appear on the 사업자등록증. |
| Round | An incrementing number, so a re-verification never overwrites a prior round. |
| Reviewer | The named reviewer. |
| Review date | The date the verification result was reached. |
| Evidence list | One line per artifact received: what it was, the date received, and whether it was readable for the fields relied on. |
| Field results | One line per required field: the value evidenced, the artifact it came from, and whether it is closed, missing, or not reached. Stopping a review at the field that triggered a refusal records every later field as not reached, because recording them as missing would overstate the refusal basis in a record that later rounds cannot edit. |
| Counted headcount | The 상시 근로자 수 the reviewer counted and the count date. |
| Statutory basis | Which year's minimum wage was applied, and the date the source table was read. |
| Calculation | The arithmetic for the compensation and hours checks, in enough detail to reproduce. |
| Inconsistencies | Each mismatch found, the explanation given, and whether it was substantiated. |
| Result | Published, refused, or incomplete, with the specific reason. |
| Deletion date | The date the received evidence documents were deleted. |

The record is kept outside this repository.
The repository holds this procedure, the template, and aggregate counts only.
Do not commit an employer's evidence documents, recruiting contact details, or payslips, for the same reason that `docs/plans/resume-builder-validation.md` keeps source documents out of the repository.

Agree a retention point in writing when the evidence is requested, and default to 30 days after the verification result when the employer states no preference.
Delete the received evidence documents at that point and record the date.
Keep the record itself, because `docs/plans/founding-cohort-validation.md` requires every published role to have a dated verification record and every count to reconcile to it.

## Refusal

The no-publish conditions are in `docs/specs/initial-product-scope.md`.
When one is met:

1. Stop the review. Do not continue verifying the remaining fields to produce a fuller picture.
2. Record the result as refused, with the specific condition and the exact wording or figure that met it.
3. Tell the employer which field or condition caused the refusal, in one message, without proposing how to satisfy it.
   State it as the comparison that was performed, not as a verdict: the offer's hourly figure measured against the published minimum wage for the relevant year, or the required field that carried no answer.
   The reviewer is not a lawyer and classified the occupation themselves, so a message that reads as a finding of non-compliance claims an authority this procedure does not have.
   `docs/notes/2026-09-02-employment-service-legal-sources.md` carries the question of what a non-lawyer may state here.
4. Do not publish the role, do not introduce any culinary professional, and do not keep the role in a pending state that reads as forthcoming.
5. Delete the received evidence documents on the same schedule as a completed review.

An employer may apply again with corrected terms.
A re-application is a new round with a new record, not an edit of the refused one.
A refusal for terms below statutory requirements is not reopened by the employer restating the same terms with different wording.

## Re-verification

`docs/specs/initial-product-scope.md` requires repeat verification when any required field changes.
Detecting a change needs both of these, because the first alone assumes the employer will report it:

- The employer agrees, in writing at the first verification, to report a change to any required field before the role continues to be listed.
- The reviewer sends one change-check message on a fixed cadence while the role is listed, asking whether any required field has changed. Weekly during the founding cohort, matching the introduction cadence in `docs/plans/founding-cohort-validation.md`.
  A full re-verification of every field for every listed employer, every week, will be abandoned by the second week, and a cadence that is abandoned leaves roles listed behind records that are silently stale. That is the failure this cadence exists to prevent, so the cadence is deliberately small.
- A full re-verification runs on the trigger events below, not on the cadence.

Re-verify without waiting for the cadence when any of these happen:

- The minimum wage changes, which for a listing that spans a calendar-year boundary means every listing.
- The counted 상시 근로자 수 crosses the 5-employee line, which changes which provisions apply.
- The employer changes the worksite, the role, the schedule, or the compensation.
- A culinary professional reports that a stated condition differs from what they were told.

The last one is the most important signal this procedure produces, because it is the only check that reads the employer's behaviour rather than their documents.
Record it, re-verify, and record the outcome.

## What This Procedure Does Not Establish

Verification confirms the reviewed facts on the review date.
It is not an endorsement of the employer, not a prediction about the working experience, and not a legal opinion that the employer is compliant.

Do not describe a verified employer with a word that implies more than the reviewed facts.
This is the same constraint that `docs/specs/initial-product-scope.md` places on resume provenance labels, applied to the employer side.
