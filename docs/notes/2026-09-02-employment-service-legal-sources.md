# Employment-Service Legal Sources and Open Questions

## Purpose and Limits

`docs/plans/founding-cohort-validation.md` requires the operating model to be confirmed with current official guidance or qualified counsel before introductions or payment, and requires the reviewed model and its source to be recorded in `docs/notes/` before external operation.
This note is the first half of that record: the official sources located, and the questions that a qualified reviewer has to answer.

**This note states no legal classification and reaches no conclusion.**
It does not decide whether Mise en Place is or is not subject to registration or notification, and nothing here may be quoted as if it did.
The repository already holds this posture: `docs/notes/2026-08-market-research.md` closes with the same checkpoint, and `docs/specs/initial-product-scope.md` calls its own privacy boundary a product baseline rather than a legal conclusion.

Source basis is marked as in `docs/notes/2026-09-02-korean-employment-law-sources.md`: `PRIMARY` means the article text was read, `SEARCH` means it was read from a search result and needs confirmation at the link.

## The Operating Facts That the Questions Attach To

State the facts before the law, because the questions only make sense against a described activity.
These are the facts as `docs/specs/initial-product-scope.md` and `docs/plans/founding-cohort-validation.md` currently define them.

| Fact | Current plan |
| --- | --- |
| Who is introduced to whom | The operator reviews both profiles and makes 3 to 5 manual introductions each week. |
| Who chooses | The operator selects the pairing and explains the relevant facts and known mismatches. |
| What is published | Verified restaurant profiles with open positions and required qualifications. |
| Who pays | The revenue hypothesis is a restaurant profile or job-posting fee. Culinary professionals do not pay. |
| Success fee | The initial model does not collect a success fee. |
| Employment relationship | Mise en Place does not employ, supply, or dispatch anyone. **Not in either document.** This is the operator's stated intent, written here so counsel can see the assumption, and it is the row question 1 leans on hardest. Add it to `docs/specs/initial-product-scope.md` as an operating commitment, or put it to counsel as an open fact rather than a settled one. |

Track A, the resume builder, involves no introduction and no employer relationship at all.
Keep the two tracks separate in any question put to counsel, because they may not receive the same answer.

## 직업안정법

`PRIMARY` — 직업안정법 제2조의2 (정의), 시행 2024-07-24, 법률 제20121호, 2024-01-23 일부개정.
Read at [국가법령정보센터 조문](https://law.go.kr/LSW/lsLawLinkInfo.do?lsJoLnkSeq=1000770093&chrClsCd=010202).
Full text of the Act: [직업안정법](https://www.law.go.kr/lsInfoP.do?lsId=001765).

The definitions that the questions turn on, quoted from that article:

| Term | Definition |
| --- | --- |
| 직업소개 | 구인 또는 구직의 신청을 받아 구직자 또는 구인자(求人者)를 탐색하거나 구직자를 모집하여 구인자와 구직자 간에 고용계약이 성립되도록 알선하는 것 |
| 무료직업소개사업 | 수수료, 회비 또는 그 밖의 어떠한 금품도 받지 아니하고 하는 직업소개사업 |
| 유료직업소개사업 | 무료직업소개사업이 아닌 직업소개사업 |
| 직업정보제공사업 | 신문, 잡지, 그 밖의 간행물 또는 유선·무선방송이나 컴퓨터통신 등으로 구인·구직 정보 등 직업정보를 제공하는 사업 |
| 근로자공급사업 | 공급계약에 따라 근로자를 타인에게 사용하게 하는 사업. 다만, 「파견근로자 보호 등에 관한 법률」 제2조제2호에 따른 근로자파견사업은 제외한다. |

Two features of these definitions are worth recording, as observations about the text and not as conclusions:

- The 무료 and 유료 split is drawn on whether any 금품 is received, and 유료 is defined as the residual.
  The definition does not say who pays.
- 직업정보제공사업 and 직업소개 are separate defined terms with separate definitions.
  The described activity has to be located against both, not against one.

### Registration and Notification

`PRIMARY` — 직업안정법 시행령 제21조, "유료직업소개사업의 등록요건 등", 시행 2026-03-24, 대통령령 제36220호, read at [국가법령정보센터](https://www.law.go.kr/LSW/lumLsLinkPop.do?lspttninfSeq=81969).
Its 제1항 opens by naming who may register under 법 제19조제1항, and its 제5항 sets a facility requirement by 고용노동부령.
It contains no 준수사항.

`PRIMARY` — read through the 국가법령정보 open API:

| Provision | What it does |
| --- | --- |
| 직업안정법 제18조 | 무료직업소개사업, by 신고. |
| 직업안정법 제19조제1항 | 유료직업소개사업, by 등록. |
| 직업안정법 제23조제1항 | 직업정보제공사업, by 신고 to the 고용노동부장관, change of a notified item included. It expressly excludes a person already operating 무료직업소개사업 under 제18조 or 유료직업소개사업 under 제19조, so the three forms are alternatives rather than a stack. |

`SEARCH` — the 유료직업소개사업 등록신청서 is 직업안정법 시행규칙 별지 제14호서식.
The current regulation is 시행 2024-06-12, 고용노동부령 제416호; an earlier note cited the 2008 version by mistake.

### The Administrative Rule That Draws the Line Question 4 Asks About

`PRIMARY` — 직업정보제공사업 신고업무 처리 규정, 고용노동부예규 제142호, 발령 2018-12-03, 시행 2019-01-01, read through the 국가법령정보 open API.
This replaced the 노동부예규 제604호 of 2009 that an earlier version of this note cited.

Its 제3조 (직업소개사업과의 구별) states the administrative distinction directly:

> 직업소개사업은 특정의 구인자와 구직자를 직접 연결하여 고용계약의 성립을 알선하는 것이나, 직업정보제공사업은 불특정다수의 잠재적 구인자와 구직자에게 직업정보를 제공하여 구인·구직자가 스스로 구인 또는 구직하도록 하는 것을 말한다.

Put this in front of the reviewer with question 4, because it is the closest official statement of the line that question asks about.
It is an administrative rule about notification handling, not a ruling on this product, and this note draws no conclusion from it.
The observation worth recording is only that the distinction it draws turns on 특정 versus 불특정다수 and on who performs the 연결, which are facts about how Mise en Place would operate rather than about how it describes itself.

## Personal-Information Sources

`docs/notes/2026-08-market-research.md` already records the reviewed 개인정보 보호법 provisions and the 개인정보보호위원회 guidance on resident registration numbers, with their links.
Do not restate them here.
Two questions in the list below extend that material to the hiring network, where the data leaves the browser and is held by the operator.

## Questions for a Qualified Reviewer

Put these as written.
Each one names the activity rather than asking for a label, because a label without the activity attached cannot be relied on later.

### Classification

1. Does an operator who receives profiles from both sides, selects pairings, and sends each side an explanation of the other perform 직업소개 as 직업안정법 제2조의2 defines it, when no employment contract is negotiated by the operator?
2. If a restaurant pays a recurring profile fee or a per-posting fee while that same operator makes introductions, does the business fall outside 무료직업소개사업, given that the definition requires receiving no 수수료, 회비, or other 금품?
3. Does it change the answer to question 2 if the fee is charged only to the employer and never to the culinary professional?
4. Can the described activity be operated as 직업정보제공사업 alone, and what operational line separates publishing a verified profile from 알선?
5. Does the resume builder in Track A, which makes no introduction and holds no employer relationship, fall under any of these definitions?

### Requirements If Registration or Notification Applies

6. Under 직업안정법 제19조제1항 and 시행령 제21조, who may register a 유료직업소개사업, and can a natural person operating alone do so?
7. What facility, personnel, and record-keeping requirements attach to registration, and which of them apply to a service with no physical office?
8. Is there a ceiling on 소개요금, who may be charged it, and does a subscription or posting fee count against it?
9. What notification, record-keeping, or reporting duties attach to 직업정보제공사업, if that is the applicable form?
10. What are the consequences of operating before registration or notification, and does a validation cohort with no revenue change that?

### Data and Consent

11. What consent basis is required to hold a culinary professional's private profile for the purpose of introductions, and what notice must accompany it?
12. What withdrawal and deletion duties attach to that profile, and how do they interact with the introduction records that `docs/plans/founding-cohort-validation.md` requires the operator to keep?

### Verification Claims

13. Does publishing an employer verification result, as `docs/specs/initial-product-scope.md` defines it, create any duty or liability toward the culinary professional who relies on it?
14. What wording keeps the published result limited to the reviewed facts rather than reading as an endorsement of the employer?
15. When a verification finds that an offer's compensation falls below the published minimum wage, what may a non-lawyer state to the employer and record about it? `docs/specs/employer-verification-procedure.md` now phrases a refusal as the comparison performed rather than as a finding of non-compliance; confirm that is the right line, including where the reviewer has classified the occupation under 한국표준직업분류 themselves.

### Listing Content

16. May a published role state a required or preferred 성별 or 나이, and what applies to a service that publishes an employer's answer rather than writing it? Domestic listing templates carry both fields; see `docs/notes/2026-09-02-competitor-lead-check.md`. The product scope neither lists nor excludes them, so this is an open decision rather than a settled one.

## What Has to Happen Before External Operation

`docs/plans/founding-cohort-validation.md` gates Track B's introductions and any payment test on this review.
Recording the answers completes the second half of that record.

For each question, record: the answer, who gave it, their qualification, the date, and the official source they relied on.
An answer with no source recorded is not a completed item.
Where the answer changes the operating model, revise `docs/specs/initial-product-scope.md` rather than leaving the change only in this note.

Until that record exists, the plan's step 3 recruitment and every introduction remain blocked, and this note does not unblock them.
