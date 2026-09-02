# Korean Employment-Law Sources for Employer Verification

## Purpose

`docs/specs/initial-product-scope.md` section "Minimum Employer Verification" requires the reviewer to calculate whether an employer's offered compensation and working hours meet current statutory requirements by using current official sources.
It does not name those sources.
This note is the source table that `docs/specs/employer-verification-procedure.md` reads from, so the procedure does not carry statutory numbers of its own.

## Status and Freshness

Every row was read from an official source on 2026-09-02.
Nothing in this table is a legal conclusion, and none of it is legal advice.
It records where a rule is published and what the source said on that date.

Statutes and notices change.
Re-read each linked source before a verification review, and update the row and its read date when the source has moved.
The minimum-wage rows are the ones that change on a fixed annual cycle, so check them first.

Source basis for each row is one of:

- `PRIMARY` — the article or notice text itself was read.
- `SEARCH` — the rule was read from a 국가법령정보센터 or 고용노동부 search result, not the article text. Confirm at the link before relying on it.

## Minimum Wage

| Applies | Hourly | Monthly at 209 hours | Notice | Source basis |
| --- | --- | --- | --- | --- |
| 2026-01-01 onward | 10,320원 | 2,156,880원 | 고용노동부고시 제2025-47호 | `PRIMARY` — [고용노동부 발표](https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18144) |
| 2027-01-01 onward | 10,700원 | 2,236,300원 | 고용노동부고시 제2026-60호, 2026-08-05 | `PRIMARY` — [고용노동부 발표](https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19744), [국가법령정보센터 고시](https://www.law.go.kr/LSW//admRulInfoP.do?admRulSeq=2100000283564&chrClsCd=010201) |

Both notices state that the wage applies to every workplace with no distinction by type of business.
The 2027 figure is a 3.7 percent increase over 2026.

The 209-hour monthly basis assumes 40 소정근로시간 per week plus the paid weekly rest day.
A role with different 소정근로시간 needs its own monthly figure; do not reuse the table figure as a floor for a part-time schedule.

`SEARCH` — 최저임금법 제3조 applies the Act to every business or workplace that uses workers, and excludes only a business using solely cohabiting relatives, 가사사용인, and seafarers under 선원법.
This matters for the target segment: a restaurant with fewer than 5 employees is still fully bound by the minimum wage, even though `근로기준법` applies to it only in part.
Confirm at [최저임금법](https://www.law.go.kr/LSW/lsInfoP.do?urlMode=lsInfoP&lsId=000129).

### Probation Reduction

`SEARCH` — 최저임금법 제5조제2항 allows an employer to pay up to 10 percent below the hourly minimum wage when the employment contract is for 1 year or more and the worker is within 3 months of the probation start date.

`PRIMARY` — 고용노동부 고시 제2018-23호, issued 2018-03-19 and effective 2018-03-20, defines the excluded occupations for that reduction:

> 최저임금법 제5조제2항에 따른 "단순노무업무로 고용노동부장관이 정하여 고시한 직종에 종사하는 근로자"란 한국표준직업분류 상 대분류 9(단순노무 종사자)에 해당하는 사람을 말한다.

A worker in 대분류 9 receives 100 percent of the minimum wage regardless of probation status or contract length.

The kitchen occupations inside 대분류 9 are, from the 한국표준직업분류 leaflet attached to the same notice:

| Code | Occupation | Notes |
| --- | --- | --- |
| 952 | 음식 관련 단순 종사자 | 조리 관련 단순 반복 작업, or 조리보조 work under a 조리장 or 조리사. |
| 9521 | 패스트푸드 준비원 | |
| 9522 | 주방 보조원 | 직업예시 includes 주방 보조원, 조리사 보조원, 식재료 세척원, 학교급식 보조원. |

So a 주방보조원 or 조리사 보조원 may not be paid a probation-reduced wage.
A 조리사 is not in 대분류 9, so the reduction can apply to that role when the contract is 1 year or longer.
Decide the classification from the work the person actually performs, not from the job title in the listing.

Source: [고용노동부 고시 안내 게시물](http://www.moel.go.kr/local/seoulgangnam/news/notice/noticeView.do?bbs_seq=20180300575), attachments 1 and 4.

## Working Time, Rest, and Premium Pay

All rows below are 근로기준법, 시행 2026-08-20, 법률 제21373호.

| Article | Rule | Source basis |
| --- | --- | --- |
| 제17조 근로조건의 명시 | The employer must state 임금, 소정근로시간, the 제55조 휴일, the 제60조 연차 유급휴가, and further conditions set by 대통령령, and must give the worker a written document covering the wage components, calculation method, payment method, and items 2 through 4. | `PRIMARY` — [조문](https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010201&lsJoLnkSeq=1015677481) |
| 제50조 근로시간 | Weekly working time excluding breaks may not exceed 40 hours; daily working time excluding breaks may not exceed 8 hours; waiting time under the employer's direction counts as working time. | `PRIMARY` — [조문](https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=900552087) |
| 제53조제1항 | By agreement between the parties, 제50조 hours may be extended by up to 12 hours per week. | `SEARCH` — [조문](https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1023660279&chrClsCd=010202&ancYnChk=) |
| 제53조제3항 | An employer using fewer than 30 regular employees may extend by up to a further 8 hours per week under a written agreement with the 근로자대표. | `SEARCH` — same link |
| 제54조 휴게 | At least 30 minutes of break for 4 hours of work and at least 1 hour for 8 hours, given during working hours and freely usable by the worker. | `SEARCH` — [조문](https://www.law.go.kr/lsLawLinkInfo.do?lsJoLnkSeq=1000993065&chrClsCd=010202) |
| 제55조제1항 | At least one paid rest day per week on average. | `SEARCH` — same source family as 제54조 |
| 제56조 | At least 50 percent of 통상임금 added for extended work, for night work between 22:00 and 06:00, and for holiday work. | `SEARCH` — [조문](https://www.law.go.kr/LSW/lsLawLinkInfo.do?lsJoLnkSeq=900550493&chrClsCd=010202) |
| 제60조 | 연차 유급휴가. | `SEARCH` — referenced by 제17조 primary text |

The 제53조제3항 row is directly relevant to this segment.
Most independent restaurants are under 30 employees, so the extended ceiling is available to them, and its condition is a written agreement with the 근로자대표 rather than the individual worker's consent.

## Workplace Size Changes Which Rules Apply

`PRIMARY` — 근로기준법 시행령 별표 1, 개정 2018-06-29, "상시 4명 이하의 근로자를 사용하는 사업 또는 사업장에 적용하는 법 규정(제7조 관련)", read from the [국가법령정보센터 파일](https://www.law.go.kr/LSW/flDownload.do?flSeq=150839753&bylClsCd=110201).

The annex lists which chapters and articles of 근로기준법 apply to a workplace with 4 or fewer regular employees:

| 장 | 적용되는 조문 |
| --- | --- |
| 제1장 총칙 | 제1조부터 제13조까지 |
| 제2장 근로계약 | 제15조, 제17조, 제18조, 제19조제1항, 제20조부터 제22조까지, 제23조제2항, 제26조, 제35조부터 제42조까지 |
| 제3장 임금 | 제43조부터 제45조까지, 제47조부터 제49조까지 |
| 제4장 근로시간과 휴식 | 제54조, 제55조제1항, 제63조 |
| 제5장 여성과 소년 | 제64조, 제65조제1항·제3항, 제66조부터 제69조까지, 제70조제2항·제3항, 제71조, 제72조, 제74조 |
| 제6장 안전과 보건 | 제76조 |
| 제8장 재해보상 | 제78조부터 제92조까지 |
| 제11장 근로감독관 등 | 제101조부터 제106조까지 |
| 제12장 벌칙 | 제107조부터 제116조까지, limited to violations of the provisions above |

What this means for verification of a restaurant with 4 or fewer regular employees:

- 제17조 written statement of working conditions still applies.
- 제54조 breaks and 제55조제1항 weekly paid rest day still apply.
- 제50조 working-time limits, 제53조 overtime limits, 제56조 premium pay, and 제60조 annual paid leave do **not** apply.
- 제55조제2항, the paid public holidays, does not apply, because the annex lists only 제55조제1항.
- The minimum wage still applies in full, because 최저임금법 has its own applicability rule.

`PRIMARY` — 상시 근로자 수 is counted under 근로기준법 시행령 제7조의2, "상시 사용하는 근로자 수의 산정 방법", read at [국가법령정보센터](https://www.law.go.kr/LSW/lumLsLinkPop.do?lspttninfSeq=70859&chrClsCd=010202).
Read that article and apply it rather than accepting the employer's own headcount statement.

A workplace at or near the 5-employee line can cross it between reviews, which changes the applicable rules.
Record the counted number and the count date in the verification record, not just the resulting side of the line.

## Severance

`SEARCH` — 근로자퇴직급여 보장법 제4조제1항 requires the employer to set up at least one 퇴직급여제도 for departing workers, and excludes a worker whose 계속근로기간 is under 1 year and a worker whose 소정근로시간 averages under 15 hours per week over 4 weeks.
Confirm at [근로자퇴직급여 보장법](https://www.law.go.kr/LSW/lsInfoP.do?lsId=009883&ancYnChk=0).

This is worth checking against the reason given for an opening.
A pattern of contracts ending before 1 year is an operating fact the reviewer can observe, and `docs/specs/initial-product-scope.md` already requires the employer to state the reason for the opening.

## Not Covered Here

These are outside what was read on 2026-09-02, and each is `[UNKNOWN]` for this note:

- Social-insurance enrolment obligations and the employee-side deduction rates.
- 근로기준법 시행령 conditions attached to 제17조, which the article delegates to 대통령령.
- The 연차 유급휴가 accrual schedule in 제60조.
- 기간제 및 단시간근로자 보호 등에 관한 법률, which governs fixed-term and part-time contracts.
- Any rule specific to foreign workers.

Add a row only when the source has actually been read, and mark its basis.
