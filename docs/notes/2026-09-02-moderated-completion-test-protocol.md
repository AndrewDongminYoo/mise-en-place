# Moderated Completion Test Protocol

## Purpose

`docs/plans/resume-builder-validation.md` step 3 runs the workflow with 10 culinary professionals and lists what to record.
`docs/specs/initial-product-scope.md` holds the Track A gate that those recordings are counted against.

Neither says how a session is run, and neither defines what its three behavioral thresholds mean in an observable way.
A session run without those definitions produces an outcome that cannot be reconciled to the gate afterwards, and a threshold argued about after the fact is not a gate.

This document owns the session structure, the consent, the help ladder, the observation sheet, the threshold definitions, and the reconciliation.
It does not restate the record list or the gate numbers.
Read it with both documents above open.

This is a working protocol, not an approved specification.
Revise it after the first session if a definition proves unobservable.

## The Constraint This Protocol Operates Under

This section described a prototype that held the resume in page state only, where a participant who reached the preview and closed the tab kept nothing.
That stopped being true on 2026-09-03: the confirmed record is written to `localStorage` and restored on an explicit action, so a participant returning on the same device and browser keeps their draft.
`docs/specs/resume-review-workflow.md` section "Prerequisite: Draft Continuity" records the mechanism.

**Every session is still a single sitting.** Storage was one reason for that rule and is no longer one, but the rule is an operating decision this protocol reserves to the operator rather than a consequence of the gap, and the remaining reasons are unchanged: one moderator, one room, and a 60 to 75 minute block.
Change it deliberately if a session needs it, not because this paragraph stopped applying.

What did change is the artifact. The printed or exported output produced in the room is no longer the *only* thing a participant leaves with, because the draft survives on their own device.

It also shapes one threshold directly.
What a participant leaves with is part of the record, and now has two parts: the printed or exported output, and whether the draft is still on their device.

## Recruiting and Screening

Recruit working cooks and pastry chefs.
Do not filter by years of experience.
The 1-to-10-year band in `docs/specs/initial-product-scope.md` belongs to the Track B initial segment, which `AGENTS.md` calls a hypothesis until the network gate passes, and neither the Track A gate nor `docs/plans/resume-builder-validation.md` step 3 restricts participants by experience.
Filtering Track A by it would measure the resume tool on a pool chosen by an unvalidated Track B guess.
Record each participant's experience in months so the band can be examined afterwards rather than assumed beforehand.

Screen out:

- Anyone the operator currently manages, employs, or has employed.
  They cannot decline a task or report that a step was confusing.
- Anyone who has already seen the prototype.
- Anyone recruited through their own employer.

Assign an identifier at recruiting time, `RP-01` through `RP-10`, and use it everywhere.
The anonymization rules in `docs/notes/2026-09-02-founding-cohort-interview-guides.md` apply unchanged.

Do not describe the product before the session.
Say only that it is a resume tool for cooks and that the session is about watching someone use it.

## Consent

Take consent verbally before the session starts, and record that it was given.
It states:

1. 무엇을 하는지: 요리사용 이력서 도구를 직접 써 보시고, 제가 옆에서 지켜봅니다.
2. 평가 대상: 도구를 평가하는 자리이고, 사용하시는 분을 평가하지 않습니다. 막히는 지점이 나오면 그게 저희가 찾던 결과입니다.
3. 무엇을 기록하는지: 어디서 막히셨는지, 무엇을 고치셨는지, 어떤 말씀을 하셨는지를 적습니다.
4. 무엇을 기록하지 않는지: 성함, 근무하신 업장 이름, 그리고 서류에 들어 있는 개인정보는 적지 않습니다.
5. 연락처: 14일 뒤에 한 가지만 여쭤보려고 연락처를 따로 보관하고, 그 질문이 끝나면 삭제합니다. 보관을 원하지 않으셔도 오늘 참여에는 아무 영향이 없습니다.
6. 화면 녹화: 하지 않습니다.
7. 서류: 가져오신 서류는 이 컴퓨터 밖으로 나가지 않고, 저희 서버로도 전송되지 않습니다. 오늘 세션이 끝나면 이 컴퓨터에서도 지웁니다.
8. 보관 기간: 관찰 기록은 조사가 끝난 뒤 90일이 지나면 삭제합니다.
9. 공개되는 것: 열 분의 결과를 합친 숫자만 공개된 기록에 남기고, 누가 어땠는지는 남기지 않습니다. 원하지 않으시면 합계에서도 빼드립니다.
10. 중단과 삭제: 언제든 그만두실 수 있고, 그 전에도 기록 삭제를 요청하실 수 있습니다.
11. 보상 여부: 있으면 그 내용, 없으면 없다는 사실.

When the review phase below is enabled, these items are read as well, before the review is offered:

12. 검토를 원하시면 완성된 이력서를 직접 내보내서, 원하시는 방법으로 저에게 보내주시게 됩니다. 앱이 자동으로 보내는 것은 없습니다.
13. 보내주신 이력서는 검토가 끝나면 삭제하고, 삭제한 날짜를 기록합니다. 주고받은 대화방에 남은 파일도 함께 지웁니다.
14. 보내실 때 이름과 연락처는 지우고 보내주세요. 검토에는 지장이 없고, 저에게 남는 정보를 줄이기 위한 것입니다.
15. 검토를 받지 않으셔도 오늘 참여에는 아무 영향이 없습니다.

Items 12 to 15 are drafted here and are not approved, and item 14 additionally depends on an export path the product does not yet have; see the identity-free export prerequisite in `docs/specs/resume-review-workflow.md`.
They exist because `docs/specs/resume-review-workflow.md` opens a path that sends resume content to the operator while leaving its consent wording undefined, which would take a transfer the participant never agreed to.
Do not enable the review phase until these are approved together with the sequencing decision.

Item 5 is the one exception to the anonymization rules, and it exists because the day-14 follow-up below cannot otherwise happen.
Keep the contact detail with the identifier mapping, outside this repository, and delete it as soon as the follow-up is answered or the attempt is abandoned.
A participant who declines still takes part; record them as no-follow-up rather than dropping them.

Item 8's 90-day point is the one stated in `docs/notes/2026-09-02-founding-cohort-interview-guides.md`, which owns it.

Item 9 covers the reconciliation summary, which is the only thing from these sessions that is committed, and this repository is public.
Removing the identifiers does not make publishing the totals something the participant agreed to; item 9 is what covers them.

Item 7 is an absolute technical claim, so verify it before the first session of each build rather than asserting it.
Open the browser devtools network panel, run one import, and confirm that no request leaves the page.
Record that check on the sheet. An added error reporter or analytics tag would falsify the promise silently.

If a participant brings their own qualification certificate, the document boundary in `docs/specs/initial-product-scope.md` section "Privacy and Security Boundary" applies to the session exactly as it applies to the product.
Do not photograph the screen while the document is open, and do not copy any extracted value into the notes.

Two rules follow from the candidate layout that `docs/plans/resume-builder-validation.md` step 1 selected.
The certificate is password-protected, so the participant types a password in front of the moderator: never ask for it, never write it down, and look away while it is entered.
Ask the participant to keep the default resident-registration-number masking enabled when they issue the document, which is the same request step 1 makes.

Deleting the file is a step, not an intention.
A participant who mails the certificate to themselves and opens it leaves the PDF in the browser download directory, in the download history, and in any folder that syncs to a cloud drive.
After the import, delete the file from where it landed, clear it from the trash, and record that on the sheet.
The consent promises that the document does not leave the machine, which says nothing about the copy left on it, so the participant's actual exposure is worse than what they agreed to until this step runs.

## Session Structure

One participant, one moderator, one sitting: 60 minutes, or 75 when the participant accepts a review.

| Phase | Minutes | What happens |
| --- | --- | --- |
| Consent and warm-up | 5 | Consent script. Ask what they do now and how long they have cooked. |
| Prior resume | 5 | Ask when they last wrote a resume, what they used, and what was hardest. Ask before they see the prototype, so the answer is not shaped by it. |
| Task | 30 | Hand over the prototype with one instruction and observe. |
| Post-task questions | 10 | Threshold questions below, in the fixed order given. |
| Talent-pool choice | 5 | Observed, not asked about, until it has been made. |
| Debrief | 5 | Open questions, then explain the product if they ask. |
| Review offer | 15 | **Only if the operator has enabled it; see below.** Offer a review, and run it in this sitting if the participant accepts. |

The review phase is why the session may run to 75 minutes, and it is off until the operator turns it on.

`docs/plans/resume-builder-validation.md` step 4 places specifying the resume-review workflow **after** the Track A gate passes, and the Track A gate contains no review item at all.
Running review inside step 3 therefore changes the approved sequence, and that is the operator's decision rather than this protocol's.
What has already changed is that the review workflow was specified and approved on 2026-09-02, ahead of the point the plan schedules it, so the sequence has diverged from the plan once already.

The mechanism is written down here because `docs/specs/resume-review-workflow.md` restricted review to moderated sessions while draft continuity was open, which left its gate with no other session to occur in. That restriction lifted on 2026-09-03, so an asynchronous review is now possible; whether to use one is part of the same sequencing decision below.
It is not run on that reasoning alone.
Before the first session, decide one of:

- Run review in parallel, and update `docs/plans/resume-builder-validation.md` step 4 and the Track A gate so the sequence and the counts match what is actually being run.
- Leave review until after the Track A gate, as the plan currently sequences it, and run these sessions without the phase. The review gate then needs its own later sessions and a fresh participant pool.

Whichever is chosen, review outcomes never count toward the three Track A thresholds.
Those belong to the gate in `docs/specs/initial-product-scope.md`, which does not mention review, and mixing them would change what the gate measures.
Offer the review, do not schedule it: the participant asks or does not, and either answer is the measurement.

The task instruction is exactly this, and nothing more:

> 이 도구로 본인 이력서를 완성해 주세요. 다 되셨다고 생각되면 말씀해 주세요.

Do not say which step comes first, do not mention demo data, and do not mention printing.
If the participant asks what to do, apply the help ladder.

Ask the participant to think aloud once, at the start, and do not remind them again.
A reminder in the middle of a stuck moment resolves the stuck moment.

## The Help Ladder

Every intervention is recorded at its level.
Use the lowest level that moves the session, and wait at least 30 seconds before escalating.

| Level | Intervention |
| --- | --- |
| 0 | None. |
| 1 | Repeat the task instruction verbatim, adding nothing. |
| 2 | Ask what they are trying to do, without answering it. |
| 3 | Point at the region of the screen, without naming the control. |
| 4 | Name the control. |
| 5 | Perform the step for them. |

Record the highest level used, per step, per participant.
A step that needed level 5 did not complete unaided, and that is a result rather than a failure of the session.

Never explain why a validation error appeared.
The error text is what is under test.

## Threshold Definitions

The gate's three behavioral thresholds are in `docs/specs/initial-product-scope.md`.
These are the observable definitions the session records against.
Fix them before the first session and do not change them mid-run.

### Completed a Resume

Counted when the participant reaches the resume preview with no outstanding validation error **and** produces the print or PDF output.

Reaching the preview without producing the output is recorded as partial, not as completion.
The output is what leaves the room, and the constraint section above is why that matters.

Two further exclusions, because without them the threshold can be reached without the product working:

- The resume must be built from the participant's own employment data.
  A run that reaches the output on the built-in demo data is partial, because the task instruction asks for 본인 이력서 and a demo resume is nobody's.
- A step performed by the moderator at help level 5 did not complete.
  A session that needed level 5 to reach the output is partial.

So completion is counted at help levels 0 through 4, on the participant's own data.
Report the level-4 completions separately, so a count carried by heavy prompting stays visible inside the total.
That count, and not the raw number of sessions that produced a PDF, is the figure the Track A threshold in `docs/specs/initial-product-scope.md` is measured against.

### Used or Intends to Use

Two separate outcomes, recorded separately, never merged into one number.

**Intends**, recorded at the session, requires a specific answer to this question, asked once, in this wording:

> 이 이력서를 앞으로 어디에 쓰실 생각이 있으신가요?

The answer counts only when it names a concrete use: a kind of place, a timing, or an application they already have in mind.
Record it verbatim.
The answer must name a kind of establishment **and** a timeframe, or an application already underway.
Fix these examples before the first session so the coding does not drift:

- Counts: "다음 달에 동네 비스트로 몇 군데 넣어보려고요."
- Counts: "지금 지원 중인 데가 있는데 거기 다시 낼 거예요."
- Does not count: "괜찮네요." and "잘 만들었네요."
- Does not count: "나중에 다른 데 넣어볼 수도 있죠." The place and the time are both unspecified.

An answer given after the moderator suggests a use does not count either.
Ask nothing further; do not offer examples to the participant.
The question is asked in the room, minutes after the moderator has been helping, so acquiescence pressure runs the same direction as the count.
That is the reason for the strictness.

**Used**, recorded at a follow-up 14 days later, requires the participant to state that they submitted or showed the resume somewhere.
Ask once:

> 그때 만드신 이력서를 어디에 내시거나 보여 주신 적 있으세요?

Record the answer and whether the follow-up reached them at all.
An unreachable participant is unreachable, not a no.

The gate counts a participant once, whether they used it or intended to.
Keep the two figures separate in the record so a threshold met entirely on intent is visible as such.

### Chose Private Profile Storage

Counted when the participant selects the private-profile option in the talent-pool choice after completing the resume, with no explanation of the options from the moderator beyond reading them as written.

`docs/specs/initial-product-scope.md` allows the prototype to measure the choice without persisting a profile, so the observation is the record.
Record the selection, the time taken, whether they re-read the options, and a one-line reason in their own words if they give one unprompted.

If the participant asks what an option means, read the option text again and say nothing else.
Explaining the options makes the choice the moderator's.

The option wording is owned by the application, in the talent-pool options in `app/page.tsx`.
Do not paraphrase it and do not restate it here; read what the build under test displays, and record the build commit so the instrument is known afterwards.

One known defect in that wording, which the moderator must not smooth over: the private-profile option offers exposure to verified restaurants, and none has been verified, because `docs/specs/employer-verification-procedure.md` blocks verification until the Track B legal review is recorded.
If a participant asks whether such restaurants exist, answer that none do yet, answer with nothing else, and record that the question was asked.

## Observation Sheet

One file per session, named `session-RP-01.md`, kept outside this repository beside the identifier mapping.
This repository is public, and the consent script tells the participant what is recorded without telling them it is published.
`.gitignore` refuses `docs/notes/session-*.md` as a backstop; the rule is that the sheet is never created inside the repository at all.
Only the reconciliation summary below is committed.

```markdown
# Session RP-01

- Date:
- Consent given: yes
- Build: commit sha
- Network check before this build's first session: pass / fail
- Input path: manual entry / own certificate / demo data
- Source file deleted:
- Contact retained for follow-up: yes / declined
- Duration:

## Prior Resume

- Last written:
- Tool used:
- Hardest part:

## Step Outcomes

| Step | Reached | Highest help level | Time | Errors seen | Notes |
| --- | --- | --- | --- | --- | --- |
| Start |  |  |  |  |  |
| Career confirmation |  |  |  |  |  |
| Enrichment |  |  |  |  |  |
| Preview |  |  |  |  |  |
| Output |  |  |  |  |  |

## Corrections and Exclusions

One line per imported record the participant changed or excluded, and what they changed it to. No employer names.

## Fields That Blocked Completion

One line per field the participant could not answer, with what they said while stuck.

## Thresholds

- Completed:  (yes / partial / no), with the highest help level used
- Intent, verbatim:
- Talent-pool selection:  (time taken, re-read yes/no, reason if unprompted)
- Review requested:  (yes / no), and whether it ran in this sitting

## Follow-up (day 14)

- Reached:
- Used:
- Contact detail deleted:

## Moderator Notes

Where the protocol failed, what to change, and any intervention above level 3 with its reason.
```

Write the sheet immediately after the session.
A sheet written the next day records what the moderator remembers, which is the parts that confirmed an expectation.

## Changing the Prototype Mid-Run

Do not change the prototype between participants.
Ten sessions across three builds are not ten sessions of one product, and the gate cannot be reconciled across them.

The exception is a defect that prevents completion outright, which is observable rather than judged: two or more participants cannot reach the output at help level 4.
One stuck participant is a finding, not a defect that stops the run.

When the threshold is met: stop, fix, record the change and the commit, and restart the count.
The gate's 10 sessions are then the 10 that ran after the fix, and the earlier sessions are reported separately.
Recruiting 10 more participants draws on the same segment Track B needs 30 of, so treat a restart as expensive and find defects in a dry run before session 1.

Record the build commit on every sheet so this is checkable afterwards rather than remembered.

## Reconciliation

`docs/plans/resume-builder-validation.md` step 3 is verified by reconciling all 10 participant outcomes against the Track A gate.

Produce one summary that, for each of the three behavioral thresholds, gives the count on each side of it.
Keep the identifiers behind those counts with the session sheets, outside this repository, and reconcile against that offline record.
A count that cannot be reconciled offline is not reconciled; a committed summary naming which participant completed, intended to apply, or chose the private profile is a respondent-level outcome, and the consent script never said it would be published.

Report alongside it, because each one changes how the counts should be read:

- How many completions needed help at level 4.
- How many sessions were partial because of demo data or a level-5 intervention.
- How many participants requested a review, which is the count `docs/specs/resume-review-workflow.md` reads for its own gate.
- How many participants reached preview but produced no output.
- How many follow-ups went unanswered.
- Which fields blocked completion for more than one participant.
- Which build each session ran against.

A threshold met is a threshold met.
Do not adjust a definition after seeing the counts; if a definition turns out to be wrong, say which one and why, and report both the original and the revised count.

## Privacy Check Before Declaring the Step Done

Run both searches that close the interview step in `docs/notes/2026-09-02-founding-cohort-interview-guides.md`, which owns them, and record that both were run.
Do not restate its list here, because it had already drifted between the two documents once.

Then check what is specific to these sessions:

- 10 session sheets exist, each with a consent line, a build commit, a network-check line, and a source-file deletion line.
- No source document, screenshot, or extracted document text was retained anywhere.
  Look in the browser download directory, the download history, and the trash, not only in the notes.
- Every retained contact detail was deleted after its follow-up, or the participant declined to give one.
