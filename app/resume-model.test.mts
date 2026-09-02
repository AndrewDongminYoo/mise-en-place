import assert from "node:assert/strict";
import test from "node:test";

import {
  createBlankCareerEntry,
  createDemoCareerEntries,
  formatMonthRange,
  getCareerErrors,
  getEnrichmentErrors,
  toggleBoundedChoice,
  type ResumeIdentity,
} from "./resume-model.mts";

const completeIdentity: ResumeIdentity = {
  name: "유동민",
  headline: "Chef de Partie",
  email: "chef@example.com",
  phone: "010-0000-0000",
  summary: "파스타와 핫 스테이션 운영 경험이 있습니다.",
};

test("limits primary responsibilities to three choices", () => {
  const selected = ["서비스 준비", "스테이션 운영", "발주·재고"];

  assert.deepEqual(
    toggleBoundedChoice(selected, "메뉴 개발", 3),
    selected,
  );
});

test("lets a selected choice be removed at the limit", () => {
  const selected = ["서비스 준비", "스테이션 운영", "발주·재고"];

  assert.deepEqual(toggleBoundedChoice(selected, "스테이션 운영", 3), [
    "서비스 준비",
    "발주·재고",
  ]);
});

test("requires one complete included career before confirmation", () => {
  const entry = createBlankCareerEntry("manual");

  assert.deepEqual(getCareerErrors([entry]), [
    "이력서에 사용할 경력을 한 개 이상 완성해 주세요.",
  ]);
});

test("accepts a complete manual career", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "작은 파스타 바",
    employmentStart: "2024-03",
  };

  assert.deepEqual(getCareerErrors([entry]), []);
});

test("requires authored resume essentials before preview", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "작은 파스타 바",
    employmentStart: "2024-03",
  };

  assert.deepEqual(
    getEnrichmentErrors(
      { name: "", headline: "", email: "", phone: "", summary: "" },
      [entry],
    ),
    [
      "이름을 입력해 주세요.",
      "이력서 제목을 입력해 주세요.",
      "작은 파스타 바의 직책을 입력해 주세요.",
      "작은 파스타 바의 주요 업무를 한 개 이상 선택해 주세요.",
    ],
  );

  entry.role = "Chef de Partie";
  entry.responsibilities = ["스테이션 운영"];

  assert.deepEqual(getEnrichmentErrors(completeIdentity, [entry]), []);
});

test("formats an open employment period as current", () => {
  assert.equal(formatMonthRange("2024-03", ""), "2024.03 - 현재");
});

test("keeps demo provenance and employer names explicit", () => {
  const [entry] = createDemoCareerEntries();

  assert.equal(entry.origin, "document");
  assert.equal(entry.isDemo, true);
  assert.equal(entry.legalEmployer, "주식회사 엠에프지코리아");
  assert.equal(entry.restaurantName, "더 키친 살바토레 쿠오모");
});

test("stores equipment separately from skills", () => {
  const [entry] = createDemoCareerEntries();

  assert.deepEqual(entry.skills, ["제면", "생선 손질", "수비드"]);
  assert.deepEqual(entry.equipment, ["콤비오븐"]);
});
