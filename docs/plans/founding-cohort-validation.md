# Hiring Network Founding Cohort Validation Plan

## Status

This is Track B.
Start it only after a separate operating decision.
Passing the resume-tool gate in `docs/plans/resume-builder-validation.md` does not satisfy or authorize this track.

## Goal

Validate demand for minimum-verified restaurant roles and structured culinary professional profiles before building hiring-platform features.

## Step 1: Interviews

Interview 10 culinary professionals and 10 restaurant operators or head chefs.
Ask each participant about:

- Their most recent hiring or job-change process.
- The channels that they used.
- Conditions that differed after work started.
- Information that would have prevented a poor match.
- Conditions that they will not accept.

Store anonymized notes outside this repository, because it is public and the consent script promises that the interview will not be disclosed externally.
Commit only the coded counts. See `docs/notes/2026-09-02-founding-cohort-interview-guides.md`.

Verify this step by confirming that 20 interviews have source notes and that the notes contain no unnecessary personal data.

## Step 2: Profile Schema

Draft one restaurant profile and one culinary professional profile from the interview evidence.
Add a field only when the same problem appears in at least 5 interviews.
Prefer required structured fields and explicit deal-breakers over unrestricted introduction text.

Use `docs/specs/initial-product-scope.md` as the starting schema.
Revise that specification when interview evidence changes the approved fields.

Verify this step by tracing every required field to the interview evidence or the approved minimum-verification policy.

## Step 3: Founding Cohort

Recruit 10 restaurants and 30 culinary professionals.
Apply the minimum employer verification in `docs/specs/initial-product-scope.md` before publishing a restaurant or role.
Do not continue with an employer that leaves a required field undisclosed, offers terms below current statutory requirements, provides materially inconsistent information, or refuses to substantiate a required claim.

Create the accepted profiles manually.
Review both sides and make 3 to 5 introductions each week.

Do not automate matching during this cohort.
Do not add accounts, chat, public reviews, or recommendation scores to support the cohort.

Verify this step by confirming that every published role has a dated minimum-verification record and every introduction links to two complete profiles.

## Step 4: Measure Outcomes

Track:

- Verified restaurant profiles.
- Completed culinary professional profiles.
- Mutual-interest matches.
- Interviews.
- Hires.
- Satisfaction from both sides 30 days after each start date.
- Restaurant willingness to pay for the next hire.

The cohort reaches its target only when every Track B gate in `docs/specs/initial-product-scope.md` passes.

Verify this step by reconciling every count to its underlying profile, introduction, interview, hire, or follow-up record.

## Legal and Payment Checkpoint

Confirm the operating model with current official guidance or qualified counsel before making introductions or testing payment.
Record the reviewed model and its source in `docs/notes/` before external operation.

## Implementation Decision

Do not start hiring-platform feature development from interview enthusiasm or resume-tool adoption.
Use the completed Track B gate to decide whether to plan verified restaurant profiles and hiring workflows.
