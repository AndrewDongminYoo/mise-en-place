import assert from "node:assert/strict";
import test from "node:test";

import {
  addCustomChoice,
  createBlankCareerEntry,
  createDemoCareerEntries,
  createImportedCareerEntries,
  formatMonthRange,
  getCareerErrors,
  getCulinaryChoiceGroups,
  getEmployerLabel,
  getEnrichmentErrors,
  getImportedCareerFieldProvenance,
  parseResumeDraft,
  serializeResumeDraft,
  toReviewIdentity,
  toggleBoundedChoice,
  toggleCulinarySpecialty,
  type ResumeDraft,
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

test("shows techniques only for the selected culinary specialties", () => {
  const restaurantSkills = getCulinaryChoiceGroups(
    ["restaurant"],
    "skills",
  ).flatMap((group) => group.options);
  const bakerySkills = getCulinaryChoiceGroups(
    ["bakery"],
    "skills",
  ).flatMap((group) => group.options);

  assert.equal(restaurantSkills.includes("수비드"), true);
  assert.equal(restaurantSkills.includes("반죽 발효 관리"), false);
  assert.equal(bakerySkills.includes("반죽 발효 관리"), true);
  assert.equal(bakerySkills.includes("식재료 발효·숙성"), false);
});

test("combines equipment groups when one career spans multiple specialties", () => {
  assert.deepEqual(
    getCulinaryChoiceGroups(["restaurant", "bakery"], "equipment").map(
      (group) => group.label,
    ),
    ["레스토랑 조리", "제빵"],
  );
});

test("keeps at least one culinary specialty selected", () => {
  assert.deepEqual(toggleCulinarySpecialty(["restaurant"], "restaurant"), [
    "restaurant",
  ]);
  assert.deepEqual(toggleCulinarySpecialty(["restaurant"], "bakery"), [
    "restaurant",
    "bakery",
  ]);
  assert.deepEqual(
    toggleCulinarySpecialty(["restaurant", "bakery"], "restaurant"),
    ["bakery"],
  );
  assert.deepEqual(
    toggleCulinarySpecialty(["restaurant", "restaurant"], "restaurant"),
    ["restaurant"],
  );
});

test("adds a trimmed custom choice without blanks or duplicates", () => {
  assert.deepEqual(addCustomChoice(["수비드"], "  오마카세 서비스  "), [
    "수비드",
    "오마카세 서비스",
  ]);
  assert.deepEqual(addCustomChoice(["수비드"], "   "), ["수비드"]);
  assert.deepEqual(addCustomChoice(["수비드"], "수비드"), ["수비드"]);
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
    employmentEnd: "2025-03",
  };

  assert.deepEqual(getCareerErrors([entry]), []);
});

test("rejects a malformed employment start month", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "작은 파스타 바",
    employmentStart: "2024-13",
  };

  assert.deepEqual(getCareerErrors([entry]), [
    "작은 파스타 바의 근무 시작월 형식을 확인해 주세요.",
  ]);
});

test("rejects an employment end month before the start month", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "작은 파스타 바",
    employmentStart: "2025-03",
    employmentEnd: "2024-03",
  };

  assert.deepEqual(getCareerErrors([entry]), [
    "작은 파스타 바의 근무 종료월은 시작월보다 빠를 수 없습니다.",
  ]);
});

test("requires an end month when a career is not current", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "가상키친",
    employmentStart: "2024-03",
    isCurrent: false,
  };

  assert.deepEqual(getCareerErrors([entry]), [
    "가상키친의 근무 종료월을 입력하거나 재직 중을 선택해 주세요.",
  ]);
});

test("allows at most one current career", () => {
  const first = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "가상키친",
    employmentStart: "2024-03",
    isCurrent: true,
  };
  const second = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "가상다이닝",
    employmentStart: "2025-01",
    isCurrent: true,
  };

  assert.deepEqual(getCareerErrors([first, second]), [
    "재직 중인 경력은 한 개만 선택할 수 있습니다.",
  ]);
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

test("rejects a supplied malformed email", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "작은 파스타 바",
    employmentStart: "2024-03",
    role: "Chef de Partie",
    responsibilities: ["스테이션 운영"],
  };

  assert.deepEqual(
    getEnrichmentErrors({ ...completeIdentity, email: "not-an-email" }, [entry]),
    ["올바른 이메일 주소를 입력해 주세요."],
  );
});

test("allows a blank optional email", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "작은 파스타 바",
    employmentStart: "2024-03",
    role: "Chef de Partie",
    responsibilities: ["스테이션 운영"],
  };

  assert.deepEqual(
    getEnrichmentErrors({ ...completeIdentity, email: "" }, [entry]),
    [],
  );
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

test("uses imported employer and qualification dates as editable initial values", () => {
  const [entry] = createImportedCareerEntries([
    {
      legalEmployer: "주식회사 가상키친",
      qualificationStart: "2022-03-14",
      qualificationEnd: "2023-08-21",
    },
  ]);

  assert.equal(entry.origin, "document");
  assert.equal(entry.legalEmployer, "주식회사 가상키친");
  assert.equal(entry.qualificationStart, "2022-03-14");
  assert.equal(entry.qualificationEnd, "2023-08-21");
  assert.equal(entry.restaurantName, "주식회사 가상키친");
  assert.equal(entry.employmentStart, "2022-03");
  assert.equal(entry.employmentEnd, "2023-08");
  assert.equal(entry.isCurrent, false);

  entry.restaurantName = "가상키친";
  entry.employmentStart = "2022-04";
  entry.employmentEnd = "2023-07";

  assert.deepEqual(entry.importedFields, {
    legalEmployer: "주식회사 가상키친",
    qualificationStart: "2022-03-14",
    qualificationEnd: "2023-08-21",
  });
});

test("marks the only imported record without a qualification end as current", () => {
  const [entry] = createImportedCareerEntries([
    {
      legalEmployer: "주식회사 가상키친",
      qualificationStart: "2025-06-01",
      qualificationEnd: "",
    },
  ]);

  assert.equal(entry.isCurrent, true);
  assert.equal(entry.employmentEnd, "");
});

test("tracks imported field provenance through corrections and reverts", () => {
  const importedFields = {
    legalEmployer: "주식회사 가상키친",
    qualificationStart: "2022-03-14",
    qualificationEnd: "2023-08-21",
  };
  const [entry] = createImportedCareerEntries([importedFields]);

  assert.deepEqual(entry.importedFields, importedFields);
  assert.equal(
    getImportedCareerFieldProvenance(entry, "legalEmployer"),
    "imported",
  );
  assert.equal(
    getImportedCareerFieldProvenance(entry, "qualificationStart"),
    "imported",
  );

  const correctedEntry = {
    ...entry,
    legalEmployer: "가상키친",
  };
  assert.equal(
    getImportedCareerFieldProvenance(correctedEntry, "legalEmployer"),
    "confirmed",
  );
  assert.equal(
    getImportedCareerFieldProvenance(correctedEntry, "qualificationStart"),
    "imported",
  );
  assert.equal(
    getImportedCareerFieldProvenance(
      { ...entry, qualificationStart: "2022-03-15" },
      "qualificationStart",
    ),
    "confirmed",
  );
  assert.equal(
    getImportedCareerFieldProvenance(
      { ...correctedEntry, legalEmployer: importedFields.legalEmployer },
      "legalEmployer",
    ),
    "imported",
  );

  const manualEntry = createBlankCareerEntry("manual");
  assert.equal(manualEntry.importedFields, null);
  assert.equal(
    getImportedCareerFieldProvenance(manualEntry, "legalEmployer"),
    "authored",
  );
});

test("stores equipment separately from skills", () => {
  const [entry] = createDemoCareerEntries();

  assert.deepEqual(entry.stations, ["핫 / Hot", "파스타·면"]);
  assert.deepEqual(entry.skills, ["파스타·생면", "생선 필레·손질", "수비드"]);
  assert.deepEqual(entry.equipment, ["콤비오븐"]);
});

test("labels employer names according to their source", () => {
  assert.equal(getEmployerLabel("document"), "원문 사업장명");
  assert.equal(getEmployerLabel("manual"), "법인명");
});

function completeDraft(): ResumeDraft {
  const entry = createBlankCareerEntry("manual");

  return {
    careers: [
      {
        ...entry,
        restaurantName: "동네 비스트로",
        employmentStart: "2024-03",
        employmentEnd: "2025-03",
        role: "Chef de Partie",
        stations: ["Hot"],
        responsibilities: ["스테이션 운영"],
        skills: ["수비드"],
        equipment: ["콤비오븐"],
      },
    ],
    identity: completeIdentity,
    isDemoDraft: false,
    talentPoolChoice: "resume-only",
  };
}

test("restores a saved draft through a serialize and parse round trip", () => {
  const draft = completeDraft();

  assert.deepEqual(parseResumeDraft(serializeResumeDraft(draft)), draft);
});

// The page decides whether the draft on screen is the one on the device by
// comparing the stored string against a fresh serialization. That comparison
// is only meaningful if a restored draft serializes back to the same bytes.
test("re-serializes a restored draft to the same string", () => {
  const raw = serializeResumeDraft(completeDraft());
  const restored = parseResumeDraft(raw);

  assert.notEqual(restored, null);
  assert.equal(serializeResumeDraft(restored!), raw);
});

test("migrates bakery and pastry stations from the previous draft schema", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  stored.version = 1;
  stored.careers[0].stations = ["Bakery", "Pastry"];
  delete stored.careers[0].culinarySpecialties;

  const restored = parseResumeDraft(JSON.stringify(stored));

  assert.notEqual(restored, null);
  assert.deepEqual(restored!.careers[0].culinarySpecialties, [
    "bakery",
    "pastry",
  ]);
  assert.deepEqual(restored!.careers[0].stations, ["Bakery", "Pastry"]);
});

test("normalizes duplicate culinary specialties in a saved draft", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  stored.careers[0].culinarySpecialties = ["restaurant", "restaurant"];

  const restored = parseResumeDraft(JSON.stringify(stored));

  assert.notEqual(restored, null);
  assert.deepEqual(restored!.careers[0].culinarySpecialties, ["restaurant"]);
});

test("serializes only the confirmed draft fields", () => {
  const stored: unknown = JSON.parse(serializeResumeDraft(completeDraft()));

  assert.deepEqual(Object.keys(stored as object).sort(), [
    "careers",
    "identity",
    "isDemoDraft",
    "talentPoolChoice",
    "version",
  ]);
});

test("discards a draft that is absent or unreadable", () => {
  assert.equal(parseResumeDraft(null), null);
  assert.equal(parseResumeDraft(""), null);
  assert.equal(parseResumeDraft("{ not json"), null);
  assert.equal(parseResumeDraft("[]"), null);
});

test("discards a draft written by a different schema version", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  stored.version = 99;

  assert.equal(parseResumeDraft(JSON.stringify(stored)), null);
});

test("discards a draft whose career entry lost a required field", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  delete stored.careers[0].restaurantName;

  assert.equal(parseResumeDraft(JSON.stringify(stored)), null);
});

test("discards a draft whose bounded choices are not strings", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  stored.careers[0].stations = [1, 2];

  assert.equal(parseResumeDraft(JSON.stringify(stored)), null);
});

test("discards a draft whose talent-pool choice is not an offered option", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  stored.talentPoolChoice = "public-profile";

  assert.equal(parseResumeDraft(JSON.stringify(stored)), null);
});

test("drops unknown fields instead of restoring them", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  stored.sourceDocumentText = "국민건강보험 자격득실확인서 전문";
  stored.careers[0].pdfPassword = "890101";

  const restored = parseResumeDraft(JSON.stringify(stored));

  assert.notEqual(restored, null);
  assert.equal("sourceDocumentText" in (restored as object), false);
  assert.equal("pdfPassword" in (restored as ResumeDraft).careers[0], false);
});

// The review copy leaves the device, so what it drops is a boundary rather
// than a formatting choice.
test("drops name, email and phone from the review copy", () => {
  const reviewIdentity = toReviewIdentity(completeIdentity);

  assert.equal(reviewIdentity.name, "");
  assert.equal(reviewIdentity.email, "");
  assert.equal(reviewIdentity.phone, "");
});

test("keeps the headline and summary in the review copy", () => {
  const reviewIdentity = toReviewIdentity(completeIdentity);

  assert.equal(reviewIdentity.headline, completeIdentity.headline);
  assert.equal(reviewIdentity.summary, completeIdentity.summary);
});

// The person keeps their own name. The same resume produces both copies, so a
// review export that mutated the draft would take the name away for good.
test("leaves the resume identity it was given alone", () => {
  const identity: ResumeIdentity = { ...completeIdentity };

  toReviewIdentity(identity);

  assert.deepEqual(identity, completeIdentity);
});
