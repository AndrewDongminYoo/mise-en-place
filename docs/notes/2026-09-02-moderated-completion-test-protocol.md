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

The prototype holds the resume in page state only.
A participant who reaches the preview and closes the tab keeps nothing.

That is why every session is a single sitting, and why the printed or exported output produced in the room is the only artifact a participant leaves with.
`docs/specs/resume-review-workflow.md` section "Prerequisite: Draft Continuity" records the same gap and the two ways to close it.
Do not close it inside this protocol; run the sessions as single sittings and let the sessions show whether the gap matters.

It also shapes one threshold directly.
A participant can only use in an application what they walked out with, so what they walked out with is part of the record.

## Recruiting and Screening

Recruit to the initial segment in `docs/specs/initial-product-scope.md`: cooks and pastry chefs with 1 to 10 years of experience.

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
4. 무엇을 기록하지 않는지: 성함, 연락처, 근무하신 업장 이름, 그리고 서류에 들어 있는 개인정보는 적지 않습니다.
5. 화면 녹화: 하지 않습니다.
6. 서류: 가져오신 서류는 이 컴퓨터 밖으로 나가지 않고, 저희 서버로도 전송되지 않습니다.
7. 중단과 삭제: 언제든 그만두실 수 있고, 끝난 뒤에도 기록 삭제를 요청하실 수 있습니다.
8. 보상 여부: 있으면 그 내용, 없으면 없다는 사실.

If a participant brings their own qualification certificate, the document boundary in `docs/specs/initial-product-scope.md` section "Privacy and Security Boundary" applies to the session exactly as it applies to the product.
Do not photograph the screen while the document is open, do not copy any extracted value into the notes, and do not keep the file.

## Session Structure

One participant, one moderator, one sitting, about 60 minutes.

| Phase | Minutes | What happens |
| --- | --- | --- |
| Consent and warm-up | 5 | Consent script. Ask what they do now and how long they have cooked. |
| Prior resume | 5 | Ask when they last wrote a resume, what they used, and what was hardest. Ask before they see the prototype, so the answer is not shaped by it. |
| Task | 30 | Hand over the prototype with one instruction and observe. |
| Post-task questions | 10 | Threshold questions below, in the fixed order given. |
| Talent-pool choice | 5 | Observed, not asked about, until it has been made. |
| Debrief | 5 | Open questions, then explain the product if they ask. |

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

Completion is counted regardless of the help level used, and the help level is reported alongside it.
Report completions that needed level 4 or 5 separately, so a count carried by moderator intervention is visible rather than hidden inside the total.

### Used or Intends to Use

Two separate outcomes, recorded separately, never merged into one number.

**Intends**, recorded at the session, requires a specific answer to this question, asked once, in this wording:

> 이 이력서를 앞으로 어디에 쓰실 생각이 있으신가요?

The answer counts only when it names a concrete use: a kind of place, a timing, or an application they already have in mind.
Record it verbatim.
A general approval such as "괜찮네요" or "잘 만들었네요" does not count, and neither does an answer given after the moderator suggests a use.
Ask nothing further; do not offer examples.

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

## Observation Sheet

One file per session, `docs/notes/session-RP-01.md`.

```markdown
# Session RP-01

- Date:
- Consent given: yes
- Build: commit sha
- Input path: manual entry / own certificate / demo data
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

- Completed:  (yes / partial / no)
- Intent, verbatim:
- Talent-pool selection:  (time taken, re-read yes/no, reason if unprompted)

## Follow-up (day 14)

- Reached:
- Used:

## Moderator Notes

Where the protocol failed, what to change, and any intervention above level 3 with its reason.
```

Write the sheet immediately after the session.
A sheet written the next day records what the moderator remembers, which is the parts that confirmed an expectation.

## Changing the Prototype Mid-Run

Do not change the prototype between participants.
Ten sessions across three builds are not ten sessions of one product, and the gate cannot be reconciled across them.

The exception is a defect that prevents completion outright.
When that happens: stop, fix, record the change and the commit, and restart the count.
Sessions run before the fix are reported separately and do not count toward the gate.

Record the build commit on every sheet so this is checkable afterwards rather than remembered.

## Reconciliation

`docs/plans/resume-builder-validation.md` step 3 is verified by reconciling all 10 participant outcomes against the Track A gate.

Produce one summary that, for each of the three behavioral thresholds, lists the participant identifiers on each side of it.
A count with no identifiers behind it is not reconciled.

Report alongside it, because each one changes how the counts should be read:

- How many completions needed help at level 4 or 5.
- How many participants reached preview but produced no output.
- How many follow-ups went unanswered.
- Which fields blocked completion for more than one participant.
- Which build each session ran against.

A threshold met is a threshold met.
Do not adjust a definition after seeing the counts; if a definition turns out to be wrong, say which one and why, and report both the original and the revised count.

## Privacy Check Before Declaring the Step Done

Run the same check that closes the interview step, and record that it was run:

- 10 session sheets exist, each with a consent line and a build commit.
- A search across the sheets finds no personal name, phone number, email address, employer name, resident registration number, or certificate number.
- No source document, screenshot, or extracted document text was retained anywhere.
