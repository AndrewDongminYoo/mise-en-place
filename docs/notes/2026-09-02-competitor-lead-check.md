# Competitor Lead Check

## Scope and Depth

`docs/notes/2026-08-market-research.md` section "Research Leads" names six domestic services and three international product patterns and states that they were not independently checked.
This note records a check of some of them on 2026-09-02, and it is deliberately narrow.

**Depth: public pages only.**
No account was created, nothing was purchased, and no logged-in view was seen.
Every finding below therefore describes what a service publishes, not what it does.

This distinction decides what the findings can support.
Observing that a homepage carries no verification claim is evidence about the homepage.
It is not evidence that the service performs no verification, and this note never uses it that way.

The Foodscout observations already recorded in `docs/notes/2026-08-market-research.md` are not repeated here.

## What Was Checked

| Service | Result |
| --- | --- |
| 푸드잡24 | Checked: listing index, one posting detail, customer-service page. |
| 푸드앤잡 and 푸드앤잡플러스 | `[TOOL_FAILED]` — HTTP 503 on both the home page and the listing page. |
| Culinary Agents | Checked: home page only. |
| Good Food Jobs | Checked: home page only. |
| Poached | `[TOOL_FAILED]` — HTTP 403. |
| 외식과사람들, 한국외식업 구인구직, 조리사닷컴 | `[UNKNOWN]` — not checked. |

## Finding: Disclosure Is Inconsistent, Not Absent

This is the finding that changes something, so it is stated first.

A 푸드잡24 posting detail page uses a fixed field template.
The labels observed, with no employer identity recorded:

`근무지역`, `모집직종`, `근무시간`, `급여`, `퇴직금`, `고용형태`, `4대보험`, `휴무`, `숙식`, `성별`, `나이`, `경력`, `학력`, `접수마감`.

In the posting inspected, every one of those fields carried a concrete value, including working hours, monthly pay, days off per month, severance, and social-insurance enrolment.

The listing index tells a different story.
Compensation there appears sometimes as a concrete monthly figure and sometimes as `협의후결정` or `협의가능`, and working conditions appear only occasionally in the summary.

So the incumbent template already asks for most of what `docs/specs/initial-product-scope.md` requires, and some employers fill it in.
What varies is whether an employer answers, not whether the field exists.

`docs/notes/2026-08-market-research.md` currently frames the opportunity partly on conditions being undisclosed.
That framing needs narrowing rather than discarding: the gap is not the absence of fields, it is that nothing prevents a required field from being answered with `협의후결정`, and nothing checks an answer that is given.

This makes two things in the approved scope more load-bearing than they looked:

- The prohibition on placeholder answers in a required field, because the placeholder is the observed failure mode.
- The rule that employer confirmation alone is not sufficient, because a filled field is not a checked field.

It also weakens one hypothesis that was never approved anyway: that simply collecting working-condition fields is a differentiator.
It is not. Refusing to publish without them, and checking them, might be.

## Finding: Two Template Fields Mise en Place Has Not Decided About

The observed template includes `성별` and `나이`, and the posting inspected carried values in both.

`docs/specs/initial-product-scope.md` does not list either field, and does not say they are excluded.
That is currently an omission rather than a decision.

Do not treat the incumbent's practice as a precedent for including them.
`docs/notes/2026-09-02-employment-service-legal-sources.md` carries the question for a qualified reviewer; decide it there, not here.

## Finding: Paid Placement Is the Visible Revenue Model

푸드잡24 presents postings under tier labels including `VVIP`, `VIP`, `프리미엄`, `상단고정`, `급구`, `특별`, `상시`, and `일반`.
A customer-service page links to a `광고요금안내`, but no price is published at the depth checked, so the amounts are `[UNKNOWN]`.

This is consistent with the Foodscout observation already recorded in `docs/notes/2026-08-market-research.md`: the domestic model on public evidence is paid listing distribution and visibility.

It is a weak signal for the revenue hypothesis in `docs/specs/initial-product-scope.md`.
It shows that restaurants pay for placement, not that they would pay for verification, and the Track B gate already requires 3 restaurants to state they would pay before that question is treated as answered.

## Finding: The International Patterns Were Not Established

Culinary Agents presents itself as a hiring platform built around free professional profiles and paid job marketing, with a plans-and-pricing page not read at this depth.
Good Food Jobs presents a job board with a pricing page not read at this depth.
Neither home page carried a compensation-transparency or employer-verification claim.

Read that last sentence as written.
Neither service was shown to lack verification; their home pages were shown not to advertise it.

Poached, the lead most relevant to this project because of the trial-shift and worker-feedback pattern that `docs/notes/2026-08-market-research.md` records, could not be reached at all.
Its pattern remains `[UNKNOWN]` and unchecked.

## What a Real Check Would Need

Only run this if a decision depends on it.
Nothing in either validation track currently does.

- An employer-side account on one domestic service, to see whether any required field is enforced before a posting publishes.
- A job-seeker account, to see what a posting exposes after login that the public page does not.
- The published rate card, for a concrete price point rather than a tier name.
- A retry of Poached and 푸드앤잡, which failed on transport rather than on content.

## Evidence Basis

Every finding above came from a public page fetched on 2026-09-02 and summarized, not from the page source read directly.
Treat the field labels as reliable and any interpretation of them as this note's own.

Unknown distribution: TOOL_FAILED 2, UNKNOWN 2, PARTIAL 0.
