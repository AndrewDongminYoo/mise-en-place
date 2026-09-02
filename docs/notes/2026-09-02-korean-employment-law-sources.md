# Korean Employment-Law Sources for Employer Verification

## Purpose

`docs/specs/initial-product-scope.md` section "Minimum Employer Verification" requires the reviewer to calculate whether an employer's offered compensation and working hours meet current statutory requirements by using current official sources.
It does not name those sources.
This note is the source table that `docs/specs/employer-verification-procedure.md` reads from, so the procedure does not carry statutory numbers of its own.

## Status and Freshness

Every row was read from an official source on 2026-09-02, and re-verified against the 국가법령정보 open API on the same date.

This note reads published rules and says how they apply to a workplace of a given size, which is what the verification procedure needs.
That is not legal advice, and it is not a conclusion about any particular employer's terms.
Deciding whether one employer's offer meets a requirement is the reviewer's judgment against these sources, and it is recorded as a comparison rather than as a finding of non-compliance.

Statutes and notices change.
Re-read each linked source before a verification review, and update the row and its read date when the source has moved.
The minimum-wage rows are the ones that change on a fixed annual cycle, so check them first.

Source basis for each row is one of:

- `PRIMARY` — the article or notice text itself was read.
- `SEARCH` — the rule was read from a 국가법령정보센터 or 고용노동부 search result, not the article text. Confirm at the link before relying on it.

Read statute text through the 국가법령정보 open API rather than the web pages:
`https://www.law.go.kr/DRF/lawService.do?OC=test&target=law&LM=<법령명>&type=XML`, with `target=admrul` for a 행정규칙.
It returns 조문, 항, 호, and the 부칙 as XML, and the 부칙 is where an article's expiry lives.
Two rows in this note were wrong on the first pass because a search summary quoted an article without it.

## Minimum Wage

| Applies | Hourly | Monthly at 209 hours | Notice | Source basis |
| --- | --- | --- | --- | --- |
| 2026-01-01 onward | 10,320원 | 2,156,880원 | 고용노동부고시 제2025-47호, 2025-08-05 | `PRIMARY` — figures from the [고용노동부 발표](https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18144); the notice number and dates from the [고시 게시물](https://www.moel.go.kr/info/lawinfo/instruction/view.do?bbs_seq=20250800121), because the press release does not carry them |
| 2027-01-01 onward | 10,700원 | 2,236,300원 | 고용노동부고시 제2026-60호, 2026-08-05 | `PRIMARY` — [고용노동부 발표](https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19744), [국가법령정보센터 고시](https://www.law.go.kr/LSW//admRulInfoP.do?admRulSeq=2100000283564&chrClsCd=010201) |

Both notices state that the wage applies to every workplace with no distinction by type of business.
The 2027 figure is a 3.7 percent increase over 2026.

The 209-hour monthly basis assumes 40 소정근로시간 per week plus the paid weekly rest day.
A role with different 소정근로시간 needs its own monthly figure; do not reuse the table figure as a floor for a part-time schedule.

`SEARCH` — 최저임금법 제3조 applies the Act to every business or workplace that uses workers, and excludes only a business using solely cohabiting relatives, 가사사용인, and seafarers under 선원법.
This matters for the target segment: a restaurant with fewer than 5 employees is still fully bound by the minimum wage, even though `근로기준법` applies to it only in part.
Confirm at [최저임금법](https://www.law.go.kr/LSW/lsInfoP.do?urlMode=lsInfoP&lsId=000129).

### Probation Reduction

`PRIMARY` — 최저임금법 제5조제2항 본문 does not carry the reduction itself. It delegates to 대통령령, and its 단서 carries the exclusion: "다만, 단순노무업무로 고용노동부장관이 정하여 고시하는 직종에 종사하는 근로자는 제외한다."

`PRIMARY` — the reduction is in 최저임금법 시행령 제3조 (수습 중에 있는 근로자에 대한 최저임금액), read via the 국가법령정보 open API:

> 법 제5조제2항 본문에 따라 1년 이상의 기간을 정하여 근로계약을 체결하고 수습 중에 있는 근로자로서 수습을 시작한 날부터 3개월 이내인 사람에 대해서는 … 시간급 최저임금액에서 100분의 10을 뺀 금액을 그 근로자의 시간급 최저임금액으로 한다.

All four conditions have to hold together: a contract of 1 year or more, the person is actually in a 수습 period, the day is within 3 months of the probation start, and the occupation is not excluded.
Reading only the contract length is the common error.

`PRIMARY` — 고용노동부 고시 제2018-23호, issued 2018-03-19 and effective 2018-03-20, defines the excluded occupations for that reduction:

> 최저임금법 제5조제2항에 따른 "단순노무업무로 고용노동부장관이 정하여 고시한 직종에 종사하는 근로자"란 한국표준직업분류 상 대분류 9(단순노무 종사자)에 해당하는 사람을 말한다.

A worker in 대분류 9 receives 100 percent of the minimum wage regardless of probation status or contract length.

The kitchen occupations inside 대분류 9 are, from the 한국표준직업분류 leaflet attached to the same notice:

| Code | Occupation | Notes |
| --- | --- | --- |
| 952 | 음식 관련 단순 종사자 | 조리 관련 단순 반복 작업, or 조리보조 work under a 조리장 or 조리사. |
| 9521 | 패스트푸드 준비원 | |
| 9522 | 주방 보조원 | 직업예시 includes 주방 보조원, 조리사 보조원, 식재료 세척원, 학교급식 보조원. |

So a 주방보조원 or 조리사 보조원 may not be paid a probation-reduced wage at all.
A 조리사 sits in 대분류 4, not 대분류 9, so the occupation condition does not block the reduction for that role. The other three conditions above still have to hold.
Decide the classification from the work the person actually performs, not from the job title in the listing.

대분류 9 is wider than the kitchen. It also holds 음식 배달원 and the 청소 및 경비 관련 단순 노무직 group, so a restaurant's delivery and cleaning hires are outside the reduction for the same reason.
Check the class, not this table's three rows.

The leaflet attached to the 고시 uses the 7th edition of the 한국표준직업분류. The 8th edition (통계청고시 제2024-328호) has been in force since 2025-01-01, and these codes and names are unchanged between the two.

Source: [고용노동부 고시 안내 게시물](http://www.moel.go.kr/local/seoulgangnam/news/notice/noticeView.do?bbs_seq=20180300575), attachments 1 and 2.

## Working Time, Rest, and Premium Pay

All rows below are 근로기준법, 시행 2026-08-20, 법률 제21373호.

| Article | Rule | Source basis |
| --- | --- | --- |
| 제17조 근로조건의 명시 | The employer must state 임금, 소정근로시간, the 제55조 휴일, the 제60조 연차 유급휴가, and further conditions set by 대통령령, and must give the worker a written document covering the wage components, calculation method, payment method, and items 2 through 4. | `PRIMARY` — [조문](https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010201&lsJoLnkSeq=1015677481) |
| 제50조 근로시간 | Weekly working time excluding breaks may not exceed 40 hours; daily working time excluding breaks may not exceed 8 hours; waiting time under the employer's direction counts as working time. | `PRIMARY` — [조문](https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=900552087) |
| 제53조제1항 | By agreement between the parties, 제50조 hours may be extended by up to 12 hours per week. | `PRIMARY` — 국가법령정보 open API |
| 제53조제3항 | **Expired.** The further 8 hours per week for employers of fewer than 30 regular employees took effect on 2021-07-01 and lost effect on 2022-12-31, under 부칙 제2조 of 법률 제15513호: "제53조제3항 및 제6항의 개정규정은 2022년 12월 31일까지 효력을 가진다." The article text still prints, with that expiry noted in brackets beneath it. | `PRIMARY` — 부칙 read via the 국가법령정보 open API |
| 제54조 휴게 | At least 30 minutes of break for 4 hours of work and at least 1 hour for 8 hours, given during working hours and freely usable by the worker. | `PRIMARY` — 국가법령정보 open API |
| 제55조제1항 | At least one paid rest day per week on average. | `PRIMARY` — 국가법령정보 open API |
| 제55조제2항 | Paid public holidays as set by 대통령령, replaceable by a specific working day under a written agreement with the 근로자대표. Does not apply below 5 regular employees; see the annex below. | `PRIMARY` — same |
| 제56조제1항 | Extended work: at least 50 percent of 통상임금 added. | `PRIMARY` — 국가법령정보 open API |
| 제56조제2항 | Holiday work: 50 percent for the first 8 hours, and **100 percent** beyond 8 hours. | `PRIMARY` — same |
| 제56조제3항 | Night work, 22:00 to 06:00: at least 50 percent added. | `PRIMARY` — same |
| 제60조 | 연차 유급휴가. The accrual schedule was not read in this pass. | `SEARCH` — referenced by 제17조 primary text |

The 제53조제3항 row is kept because its text is still visible on the article page and reads as a live allowance.
It is not one.
For a workplace of 5 or more the weekly ceiling is 40 plus 12, and a schedule built on 40 plus 12 plus 8 is over the limit by 8 hours.
This row is the reason the source table exists: the earlier reading of it came from a search summary that quoted the article without its 부칙, and a verification review built on that would have passed a 60-hour week.

## Workplace Size Changes Which Rules Apply

`PRIMARY` — 근로기준법 시행령 별표 1, 개정 2018-06-29, "상시 4명 이하의 근로자를 사용하는 사업 또는 사업장에 적용하는 법 규정(제7조 관련)", read from the [국가법령정보센터 파일](https://www.law.go.kr/LSW/flDownload.do?flSeq=150839753&bylClsCd=110201).

The annex lists which chapters and articles of 근로기준법 apply to a workplace with 4 or fewer regular employees:

| 장 | 적용되는 조문 |
| --- | --- |
| 제1장 총칙 | 제1조부터 제13조까지 |
| 제2장 근로계약 | 제15조, 제17조, 제18조, 제19조제1항, 제20조부터 제22조까지, 제23조제2항, 제26조, 제35조부터 제42조까지 |
| 제3장 임금 | 제43조부터 제45조까지, 제47조부터 제49조까지 |
| 제4장 근로시간과 휴식 | 제54조, 제55조제1항, 제63조 |
| 제5장 여성과 소년 | 제64조, 제65조제1항·제3항(임산부와 18세 미만인 자로 한정한다), 제66조부터 제69조까지, 제70조제2항·제3항, 제71조, 제72조, 제74조 |
| 제6장 안전과 보건 | 제76조 |
| 제8장 재해보상 | 제78조부터 제92조까지 |
| 제11장 근로감독관 등 | 제101조부터 제106조까지 |
| 제12장 벌칙 | 제107조부터 제116조까지, limited to violations of the provisions above |

What this means for verification of a restaurant with 4 or fewer regular employees:

- 제17조 written statement of working conditions still applies.
- 제54조 breaks and 제55조제1항 weekly paid rest day still apply.
- 제50조 working-time limits, 제53조 overtime limits, 제56조 premium pay, and 제60조 annual paid leave do **not** apply.
- Only 제55조제1항 is listed, so 제55조제2항 does not apply at this size. That paragraph requires paid public holidays as set by 대통령령, replaceable by a specific working day under a written agreement with the 근로자대표, so a restaurant that crosses the 5-employee line picks up paid public holidays. Record that as a change in applicable rules when the headcount crosses.
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
- Which days 대통령령 names for 제55조제2항.
- 기간제 및 단시간근로자 보호 등에 관한 법률, which governs fixed-term and part-time contracts.
- Any rule specific to foreign workers.

Add a row only when the source has actually been read, and mark its basis.
