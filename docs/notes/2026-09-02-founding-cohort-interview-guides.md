# Founding Cohort Interview Guides

## Purpose

`docs/plans/founding-cohort-validation.md` step 1 requires 20 interviews, 10 with culinary professionals and 10 with restaurant operators or head chefs, each covering five named topics, with anonymized notes in `docs/notes/`.
Step 2 then allows a profile field to be added only when the same problem appears in at least 5 interviews.

That threshold is what shapes these guides.
An interview that produces a good story but cannot be counted against the threshold has not done its job.
Every guide below therefore pairs an open question with a fixed coding line that the note records.

This is a working guide, not an approved specification.
Revise it after the first two interviews if a question repeatedly fails to produce a codable answer.

## Interviewer Discipline

- Do not describe Mise en Place before the interview questions are finished.
  A participant who knows what you are building answers the product instead of their experience.
  Answer "무슨 서비스예요?" with "아직 만드는 중이라, 먼저 경험을 듣고 싶습니다" and offer to explain fully at the end.
- Do not offer a list to choose from.
  Ask the open question, wait, and code the answer afterwards.
  When nothing comes, ask "가장 최근 사례로 말씀해 주세요" rather than suggesting an option.
- Ask for the most recent instance, not the typical one.
  A remembered pattern is an opinion; the most recent instance is an event with details.
- Ask "그때 어떻게 하셨어요?" before "어떻게 하는 게 좋을까요?"
  A stated preference that no behaviour supports does not count toward the threshold.
- Record a participant's request for a feature as a request, never as a problem.
  The threshold counts problems.
- Do not correct a participant's account, and do not argue about whether something was lawful.

## Consent and Recruiting

Get consent before the first question, verbally, and record that it was given.

The consent script states, in plain Korean:

1. 무엇을 위한 인터뷰인지: 요리사 채용과 이직 경험을 이해하기 위한 조사입니다.
2. 무엇을 기록하는지: 답변 내용만 기록하고, 이름과 근무하신 업장 이름은 기록하지 않습니다.
3. 녹음 여부: 녹음은 하지 않습니다. 메모만 남깁니다.
4. 어디에 쓰이는지: 서비스를 만들지 결정하는 데에만 사용하고, 외부에 공개하지 않습니다.
5. 중단과 삭제: 언제든 답변을 그만두실 수 있고, 인터뷰 후에도 삭제를 요청하실 수 있습니다.
6. 보상 여부: 있으면 그 내용, 없으면 없다는 사실.

Do not record audio.
A recording is source material that has to be stored, protected, and deleted, and the coding lines below do not need it.

Do not recruit through an employer.
A cook introduced by their own head chef cannot answer the deal-breaker questions freely.

## Anonymization

Each participant gets an identifier at recruiting time, before the interview: `CP-01` through `CP-10` for culinary professionals, `OP-01` through `OP-10` for operators and head chefs.
The note uses the identifier only.

Never record:

- Name, phone number, messenger handle, email address, or any other contact detail.
- Resident registration number, date of birth, or address.
- The name of any restaurant the participant has worked at, currently works at, or operates.
- The name of any other person mentioned during the interview.
- Any exact compensation figure tied to a named employer.

Record instead:

- Restaurant as a shape: 좌석 수 구간, 주방 인원 구간, 업태 (양식, 한식, 제과 등), 독립 매장 여부.
- Tenure as a duration in months.
- Compensation as a band, in 50만원 steps, and only when the participant offers it.
- Region no finer than 서울 자치구 단위, and omit it when the restaurant would be identifiable from it.

Keep the identifier-to-person mapping outside this repository, and delete it at the retention point stated in the consent.
The repository holds only the anonymized notes.

A note that cannot be written without an identifying detail is a note that should not be written.

## Guide A: Culinary Professionals

Target: cooks and pastry chefs with 1 to 10 years of experience, per the initial segment in `docs/specs/initial-product-scope.md`.
Length: 45 minutes.

### A0. Framing

- 지금 하시는 일과, 주방에서 맡고 계신 자리를 먼저 말씀해 주세요.
- 요리를 직업으로 하신 지는 얼마나 되셨나요?

Code: 경력 개월 수, 현재 역할, 담당 스테이션, 업태, 주방 인원 구간.

### A1. The Most Recent Job Change

- 가장 최근에 일자리를 옮기신 게 언제인가요?
- 옮기기로 마음먹은 계기가 무엇이었는지, 그때 상황부터 말씀해 주세요.
- 결정하고 나서 실제로 옮기기까지 얼마나 걸렸나요?

Probes: 그만두기 전에 다음 자리를 먼저 구하셨나요? 중간에 쉬는 기간이 있었나요?

Code: 이직 시점, 계기 분류, 탐색 기간, 공백 유무.

### A2. Channels

- 그때 자리를 어떻게 찾으셨어요?
- 그 방법 말고 같이 써보신 게 있나요?
- 그중에 실제로 지금 자리로 이어진 건 어느 쪽이었나요?

Probes: 아는 사람 소개였다면, 소개해 준 사람과는 어떤 관계였나요? 구인 사이트를 쓰셨다면 어디였나요?

Code: 사용한 채널 목록, 실제로 성사된 채널, 채널별 만족 여부.

### A3. What Differed After Starting

- 일을 시작하고 나서, 듣던 것과 달랐던 게 있었나요?
- 어떤 점이 언제 달랐는지, 기억나는 대로 말씀해 주세요.
- 그때 어떻게 하셨나요?

Probes: 급여, 근무 시간, 쉬는 날, 마감 시간, 맡기로 한 자리, 인원. Ask each only if the participant has stopped volunteering and has not covered it.

Code: 차이가 발생한 항목별로 한 줄씩. 차이를 알게 된 시점. 대응 (참음, 협의, 퇴사, 기타). 이 항목이 이 인터뷰에서 문제로 언급되었는지 여부.

This question carries the most weight for the threshold in step 2.
Code every item separately, because "근무 시간이 달랐다" and "급여가 달랐다" are two counts, not one.

### A4. Information That Would Have Prevented It

- 들어가기 전에 무엇을 알았더라면 그 자리를 다르게 판단하셨을까요?
- 그건 어떻게 하면 미리 알 수 있었을까요?
- 면접 때 물어보셨나요? 물어보지 않으셨다면 왜였는지도 말씀해 주세요.

Probes: 물어보기 어려웠던 항목이 있었나요?

Code: 사전에 필요했던 정보 항목. 면접에서 물었는지 여부. 묻기 어려웠던 이유.

The "묻기 어려웠던 이유" line matters more than the information list.
A field that a person cannot ask about themselves is a field the product has to supply.

### A5. Deal-Breakers

- 지금이라면 어떤 조건은 아무리 좋아도 못 받아들이시겠어요?
- 그 조건을 겪어 보신 적이 있나요?
- 반대로, 조건이 조금 나빠도 감수할 만한 자리는 어떤 자리인가요?

Code: 거절 조건 목록. 각 항목이 경험에서 나왔는지 여부. 감수 가능 조건.

### A6. Close

- 제가 여쭤보지 않았는데 중요한 게 있을까요?
- 비슷한 경험을 이야기해 주실 만한 분이 계실까요?

Only now, if the participant asks, describe what is being built.
Record whether the referral offer was made, not who was named.

## Guide B: Operators and Head Chefs

Target: independent, chef-driven restaurants in Seoul, per the initial segment.
Length: 45 minutes.

### B0. Framing

- 매장과 주방 구성을 먼저 말씀해 주세요.
- 지금 주방에 몇 분이 계시고, 각각 어떤 자리를 맡고 계신가요?

Code: 업태, 좌석 수 구간, 주방 인원 구간, 서비스 회전 구간, 독립 매장 여부.

### B1. The Most Recent Hire

- 가장 최근에 사람을 뽑으신 게 언제인가요?
- 그 자리가 왜 비었는지부터 말씀해 주세요.
- 공고를 올리고 실제로 출근할 때까지 얼마나 걸렸나요?

Probes: 그 사이에 주방은 어떻게 돌리셨나요?

Code: 채용 시점, 결원 사유, 소요 기간, 공석 기간 대응.

### B2. Channels

- 어디에 올리셨어요?
- 지원은 얼마나 들어왔나요?
- 그중에 면접까지 간 사람은 몇 명이었나요?
- 실제로 뽑힌 분은 어느 경로로 오셨나요?

Code: 사용한 채널, 채널별 지원 수 구간, 면접 전환, 최종 성사 채널, 비용을 지불한 채널과 금액 구간.

### B3. What Went Wrong After the Hire

- 뽑고 나서 예상과 달랐던 적이 있나요?
- 가장 최근 사례로 말씀해 주세요.
- 그분은 지금도 계신가요? 아니라면 얼마나 계셨나요?

Probes: 기술이 달랐나요, 태도였나요, 근무 조건에 대한 기대가 달랐나요?

Code: 불일치 항목, 발견 시점, 재직 기간, 이탈 여부.

### B4. Information That Would Have Prevented It

- 뽑기 전에 무엇을 알았더라면 다르게 판단하셨을까요?
- 이력서에서 확인이 안 되는 건 주로 어떤 부분인가요?
- 면접이나 트라이얼에서 그걸 어떻게 확인하시나요?

Probes: 트라이얼을 하신다면 몇 시간이고 급여는 어떻게 하시나요? Record the answer as stated; this is an interview, not a verification review.

Code: 이력서로 확인 불가능한 항목. 대체 확인 방법. 트라이얼 운영 방식.

### B5. Deal-Breakers and Disclosure

- 어떤 지원자는 조건이 맞아도 안 뽑으시나요?
- 공고에 미리 밝히기 어려운 조건이 있나요? 있다면 왜 어려운지도 말씀해 주세요.
- 급여나 근무 시간을 공고에 적으실 때, 어디까지 적으시나요?

Code: 거절 조건. 공개하기 어려운 항목과 그 이유. 공고 기재 범위.

The "밝히기 어려운 이유" line is the employer-side counterpart of A4's "묻기 어려웠던 이유."
`docs/specs/initial-product-scope.md` forbids placeholders in required fields, so an employer's reason for withholding a field is direct evidence about whether that rule is workable.

### B6. Close

- 제가 여쭤보지 않았는데 중요한 게 있을까요?

## Note Template

One file per interview, in `docs/notes/`, named `interview-CP-01.md` or `interview-OP-01.md`.

```markdown
# Interview CP-01

- Date:
- Guide: A
- Consent given: yes
- Length:

## Participant Shape

- 경력 개월 수:
- 현재 역할 / 스테이션:
- 업태 / 주방 인원 구간 / 좌석 수 구간:

## Coded Answers

### A1 Most recent job change
- 계기:
- 탐색 기간:
- 공백:

### A2 Channels
- 사용:
- 성사:

### A3 What differed after starting
| 항목 | 어떻게 달랐는지 | 알게 된 시점 | 대응 |
| --- | --- | --- | --- |

### A4 Information that would have prevented it
- 필요했던 정보:
- 면접에서 물었는지:
- 묻기 어려웠던 이유:

### A5 Deal-breakers
- 거절 조건 (경험 기반 여부 표시):
- 감수 가능 조건:

## Quotes

Verbatim only, with no identifying detail. Trim rather than paraphrase.

## Interviewer Notes

What the participant would not answer, where the guide failed, what to change.
```

Keep the quotes section short.
A quote earns its place when the participant's own wording is the finding, for example the exact phrase they were given instead of a schedule.

## Counting Toward the Threshold

Step 2 of `docs/plans/founding-cohort-validation.md` allows a profile field to be added when the same problem appears in at least 5 interviews.
Count it this way:

- The unit is an interview, not a mention. Five mentions by one participant is one.
- The unit is a problem the participant experienced or acted on, not a feature they asked for.
- Count the two sides separately. Five culinary professionals and five operators are two separate thresholds, and a field that only one side raises is a field only one side needs.
- Record the count with the interview identifiers behind it, so the trace back to evidence that step 2 requires is possible.

A problem that reaches 5 does not automatically become a field.
It becomes a candidate that has to be traceable to those interviews when the profile schema is revised.

## Verification of This Step

`docs/plans/founding-cohort-validation.md` verifies step 1 by confirming that 20 interviews have source notes and that the notes contain no unnecessary personal data.

Check both before declaring the step complete:

- 20 note files exist, 10 with guide A and 10 with guide B, each with a consent line.
- A search across the note files finds no phone number, no email address, no restaurant name, and no personal name.
  Run the search rather than relying on having been careful, and record that it was run.
