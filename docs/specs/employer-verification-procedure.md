# Employer Verification Procedure

## Status

This document is a draft operating procedure.
It is not approved until the operator accepts it.

It does not define what must be verified.
`docs/specs/initial-product-scope.md` section "Minimum Employer Verification" owns the required-field list, the four no-publish conditions, and the rule that employer confirmation alone is not sufficient.
This document adds what that section leaves open: which evidence satisfies a field, how the statutory calculation is performed, what the verification record contains, where it is kept, and how a refusal and a re-verification are handled.

When the two disagree, `docs/specs/initial-product-scope.md` governs and this document is corrected.

## Prerequisite

`docs/plans/founding-cohort-validation.md` blocks Track B recruitment and introductions until the operating model has been reviewed against current official guidance or by qualified counsel.
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
| A written 근로계약서 or a draft offer for the specific opening | Employment type, probation terms, compensation, workdays, hours, breaks, days off, overtime handling, trial terms, benefits, deductions. | 근로기준법 제17조 already requires a written document covering the wage components, calculation method, payment method, 소정근로시간, 휴일, and 연차 유급휴가, so those fields exist in writing before Mise en Place asks. The remaining fields in this row are not covered by that article and have to be asked for. |
| 취업규칙, where the employer has one | Schedule confirmation timing, overtime and late-close handling, break practice. | Required by law above a size threshold; its absence is not itself a finding. |
| A recent payslip for the same role, with personal identifiers removed | Whether the stated compensation matches what is actually paid. | Ask for the role, not the person. Do not accept a document carrying a resident registration number. |
| A named recruiting contact reachable at a business channel | Recruiting contact. | A personal messenger handle with no business identity behind it does not satisfy this. |
| The employer's stated 상시 근로자 수 and the basis for it | Which 근로기준법 provisions apply. | Recount it; see the statutory calculation below. |
| A written statement of the reason for the opening | Reason for the opening. | Compare against tenure of the previous holder when the employer will state it. |

Anything the employer supplies as an image or a scan is evidence of the same rank as a document, provided the reviewer can read every field being relied on.
A verbal statement is not evidence and never closes a field on its own.

Do not accept, and do not store, any document containing a resident registration number, a bank account number, or an identity-verification image.
If one arrives, ask for a redacted replacement and delete the original immediately.

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
   Use the offer's own 소정근로시간, not the 209-hour monthly basis, unless the schedule actually matches it.
   Exclude any component that is not counted toward the minimum wage.
   When the offer states a range, use the bottom of the range.

4. **Compare against the minimum wage for the year the work will start.**
   A start date in the following calendar year is measured against that year's figure.

5. **Check any probation reduction against the occupation.**
   The reduction is available only for a contract of 1 year or more and only within 3 months of the probation start.
   It is not available at all for an occupation in 한국표준직업분류 대분류 9, which includes 주방보조원 and 조리사 보조원.
   Classify by the work actually described in the offer, not by the title in the listing.

6. **Check hours, breaks, and the weekly paid rest day.**
   For a workplace of 5 or more, check the weekly and daily limits, the overtime ceiling, and the premium rates.
   For a workplace of 4 or fewer, check breaks and the weekly paid rest day, which apply regardless of size, and record that the size-limited provisions were not applicable rather than leaving those lines blank.

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
- The reason for the opening against the previous holder's tenure, when stated.

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
| Field results | One line per required field: the value evidenced, the artifact it came from, and whether it is closed or missing. |
| Counted headcount | The 상시 근로자 수 the reviewer counted and the count date. |
| Statutory basis | Which year's minimum wage was applied, and the date the source table was read. |
| Calculation | The arithmetic for the compensation and hours checks, in enough detail to reproduce. |
| Inconsistencies | Each mismatch found, the explanation given, and whether it was substantiated. |
| Result | Published, refused, or incomplete, with the specific reason. |
| Deletion date | The date the received evidence documents were deleted. |

The record is kept outside this repository.
The repository holds this procedure, the template, and aggregate counts only.
Do not commit an employer's evidence documents, recruiting contact details, or payslips, for the same reason that `docs/plans/resume-builder-validation.md` keeps source documents out of the repository.

Delete the received evidence documents at the retention point agreed with the employer, and record that date.
Keep the record itself, because `docs/plans/founding-cohort-validation.md` requires every published role to have a dated verification record and every count to reconcile to it.

## Refusal

The no-publish conditions are in `docs/specs/initial-product-scope.md`.
When one is met:

1. Stop the review. Do not continue verifying the remaining fields to produce a fuller picture.
2. Record the result as refused, with the specific condition and the exact wording or figure that met it.
3. Tell the employer which field or condition caused the refusal, in one message, without proposing how to satisfy it.
4. Do not publish the role, do not introduce any culinary professional, and do not keep the role in a pending state that reads as forthcoming.
5. Delete the received evidence documents on the same schedule as a completed review.

An employer may apply again with corrected terms.
A re-application is a new round with a new record, not an edit of the refused one.
A refusal for terms below statutory requirements is not reopened by the employer restating the same terms with different wording.

## Re-verification

`docs/specs/initial-product-scope.md` requires repeat verification when any required field changes.
Detecting a change needs both of these, because the first alone assumes the employer will report it:

- The employer agrees, in writing at the first verification, to report a change to any required field before the role continues to be listed.
- The reviewer re-confirms every required field on a fixed cadence while the role is listed. Weekly during the founding cohort, matching the introduction cadence in `docs/plans/founding-cohort-validation.md`.

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
