import assert from "node:assert/strict";
import test from "node:test";

import {
  addCustomChoice,
  appendCareerPhoto,
  collectReferencedPhotoIds,
  createBlankCareerEntry,
  createDemoCareerEntries,
  createImportedCareerEntries,
  formatDuration,
  formatMonthRange,
  getCareerErrors,
  getCareerPhotoDescriptionError,
  getCulinaryChoiceGroups,
  getEmployerLabel,
  getEnrichmentErrors,
  getImportedCareerFieldProvenance,
  getPhotoReferenceErrors,
  hasPublicRecordBadge,
  parseResumeDraft,
  removeCareerPhotoReference,
  removeMissingPhotoReferences,
  selectCareerResumePhoto,
  serializeResumeDraft,
  summarizeIncludedCareers,
  SUMMARY_LIMITS,
  toReviewIdentity,
  toggleBoundedChoice,
  toggleCulinarySpecialty,
  type CareerEntry,
  type ResumeDraft,
  type ResumeIdentity,
} from "./resume-model.mts";

const completeIdentity: ResumeIdentity = {
  name: "유동민",
  headline: "Chef de Partie",
  email: "chef@example.com",
  phone: "010-0000-0000",
  summary: "파스타와 핫 스테이션 운영 경험이 있습니다.",
  profilePhotoId: null,
};

test("creates blank restaurant metadata and local media fields", () => {
  const entry = createBlankCareerEntry("manual") as CareerEntry;

  assert.equal(entry.restaurantLocation, "");
  assert.deepEqual(entry.restaurantHighlights, []);
  assert.deepEqual(entry.portfolioPhotos, []);
  assert.equal(entry.resumePhotoId, null);
});

test("migrates version 2 drafts without restaurant metadata or photos", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  stored.version = 2;
  delete stored.identity.profilePhotoId;
  delete stored.careers[0].restaurantLocation;
  delete stored.careers[0].restaurantHighlights;
  delete stored.careers[0].portfolioPhotos;
  delete stored.careers[0].resumePhotoId;

  const restored = parseResumeDraft(JSON.stringify(stored));

  assert.notEqual(restored, null);
  assert.equal(restored!.identity.profilePhotoId, null);
  assert.equal(restored!.careers[0].restaurantLocation, "");
  assert.deepEqual(restored!.careers[0].restaurantHighlights, []);
  assert.deepEqual(restored!.careers[0].portfolioPhotos, []);
  assert.equal(restored!.careers[0].resumePhotoId, null);
});

test("round trips restaurant metadata and photo references", () => {
  const draft = completeDraft();
  draft.identity.profilePhotoId = "profile-a";
  draft.careers[0].restaurantLocation = "서울 용산구 한남동";
  draft.careers[0].restaurantHighlights = ["미쉐린 1스타 (2024)"];
  draft.careers[0].portfolioPhotos = [
    {
      assetId: "work-a",
      description: "광어 세비체 · 소스와 플레이팅",
    },
  ];
  draft.careers[0].resumePhotoId = "work-a";

  assert.deepEqual(parseResumeDraft(serializeResumeDraft(draft)), draft);
});

test("normalizes authored restaurant metadata when saving a draft", () => {
  const draft = completeDraft();
  draft.careers[0].restaurantLocation = "  서울 용산구 한남동  ";
  draft.careers[0].restaurantHighlights = [
    "  미쉐린 1스타 (2024)  ",
    "   ",
  ];
  draft.careers[0].portfolioPhotos = [
    { assetId: "work-a", description: "  파스타 · 소스와 마감  " },
  ];

  const restored = parseResumeDraft(serializeResumeDraft(draft));

  assert.notEqual(restored, null);
  assert.equal(restored!.careers[0].restaurantLocation, "서울 용산구 한남동");
  assert.deepEqual(restored!.careers[0].restaurantHighlights, [
    "미쉐린 1스타 (2024)",
  ]);
  assert.equal(
    restored!.careers[0].portfolioPhotos[0].description,
    "파스타 · 소스와 마감",
  );
});

test("rejects malformed version 3 photo references", () => {
  const outsideCareer = JSON.parse(serializeResumeDraft(completeDraft()));
  outsideCareer.careers[0].portfolioPhotos = [
    { assetId: "work-a", description: "파스타 · 소스와 마감" },
  ];
  outsideCareer.careers[0].resumePhotoId = "work-b";

  const duplicateIds = structuredClone(outsideCareer);
  duplicateIds.careers[0].portfolioPhotos = [
    { assetId: "work-a", description: "파스타 · 소스와 마감" },
    { assetId: "work-a", description: "생선 요리 · 손질과 굽기" },
  ];
  duplicateIds.careers[0].resumePhotoId = "work-a";

  const tooMany = structuredClone(outsideCareer);
  tooMany.careers[0].portfolioPhotos = Array.from(
    { length: 7 },
    (_, index) => ({
      assetId: `work-${index}`,
      description: `메뉴 ${index + 1} · 조리와 마감`,
    }),
  );
  tooMany.careers[0].resumePhotoId = null;

  const longDescription = structuredClone(outsideCareer);
  longDescription.careers[0].portfolioPhotos[0].description = "가".repeat(121);
  longDescription.careers[0].resumePhotoId = "work-a";

  assert.equal(parseResumeDraft(JSON.stringify(outsideCareer)), null);
  assert.equal(parseResumeDraft(JSON.stringify(duplicateIds)), null);
  assert.equal(parseResumeDraft(JSON.stringify(tooMany)), null);
  assert.equal(parseResumeDraft(JSON.stringify(longDescription)), null);
});

test("rejects restaurant metadata outside its bounds", () => {
  const tooLongLocation = JSON.parse(serializeResumeDraft(completeDraft()));
  tooLongLocation.careers[0].restaurantLocation = "가".repeat(101);

  const tooManyHighlights = JSON.parse(serializeResumeDraft(completeDraft()));
  tooManyHighlights.careers[0].restaurantHighlights = Array.from(
    { length: 6 },
    (_, index) => `주요 이력 ${index + 1}`,
  );

  assert.equal(parseResumeDraft(JSON.stringify(tooLongLocation)), null);
  assert.equal(parseResumeDraft(JSON.stringify(tooManyHighlights)), null);
});

test("requires a description for every career photo before preview", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    restaurantName: "테스트 키친",
    portfolioPhotos: [{ assetId: "work-a", description: " " }],
  };

  assert.deepEqual(getPhotoReferenceErrors([entry]), [
    "테스트 키친의 첫 번째 작업 사진에 메뉴명과 본인이 맡은 부분을 입력해 주세요.",
  ]);
  assert.equal(
    getCareerPhotoDescriptionError(entry, 0),
    "테스트 키친의 첫 번째 작업 사진에 메뉴명과 본인이 맡은 부분을 입력해 주세요.",
  );
});

test("selects at most one representative photo from the same career", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    portfolioPhotos: [
      { assetId: "work-a", description: "파스타 · 소스와 마감" },
      { assetId: "work-b", description: "농어 구이 · 생선 손질" },
    ],
    resumePhotoId: "work-a",
  };

  assert.equal(selectCareerResumePhoto(entry, "work-b").resumePhotoId, "work-b");
  assert.equal(selectCareerResumePhoto(entry, null).resumePhotoId, null);
  assert.throws(
    () => selectCareerResumePhoto(entry, "work-c"),
    /현재 경력에 있는 사진만 대표사진으로 선택할 수 있습니다/,
  );
});

test("limits each career to six unique photos", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    portfolioPhotos: Array.from({ length: 6 }, (_, index) => ({
      assetId: `work-${index}`,
      description: `메뉴 ${index + 1} · 조리와 마감`,
    })),
  };

  assert.throws(
    () =>
      appendCareerPhoto(entry, {
        assetId: "work-6",
        description: "추가 메뉴 · 조리와 마감",
      }),
    /경력마다 작업 사진을 최대 6개까지 추가할 수 있습니다/,
  );
  assert.throws(
    () => appendCareerPhoto(entry, entry.portfolioPhotos[0]),
    /같은 사진을 한 경력에 두 번 추가할 수 없습니다/,
  );
});

test("clears representative selection when its photo is removed", () => {
  const entry = {
    ...createBlankCareerEntry("manual"),
    portfolioPhotos: [
      { assetId: "work-a", description: "파스타 · 소스와 마감" },
      { assetId: "work-b", description: "농어 구이 · 생선 손질" },
    ],
    resumePhotoId: "work-a",
  };

  const updated = removeCareerPhotoReference(entry, "work-a");

  assert.deepEqual(updated.portfolioPhotos, [entry.portfolioPhotos[1]]);
  assert.equal(updated.resumePhotoId, null);
});

test("collects referenced photo ids without duplicates", () => {
  const draft = completeDraft();
  draft.identity.profilePhotoId = "profile-a";
  draft.careers[0].portfolioPhotos = [
    { assetId: "work-a", description: "파스타 · 소스와 마감" },
  ];
  draft.careers[0].resumePhotoId = "work-a";

  assert.deepEqual(collectReferencedPhotoIds(draft), ["profile-a", "work-a"]);
});

test("removes missing profile and career photo references", () => {
  const draft = completeDraft();
  draft.identity.profilePhotoId = "profile-a";
  draft.careers[0].portfolioPhotos = [
    { assetId: "work-a", description: "파스타 · 소스와 마감" },
    { assetId: "work-b", description: "농어 구이 · 생선 손질" },
  ];
  draft.careers[0].resumePhotoId = "work-a";

  const updated = removeMissingPhotoReferences(draft, ["profile-a", "work-a"]);

  assert.equal(updated.identity.profilePhotoId, null);
  assert.deepEqual(updated.careers[0].portfolioPhotos, [
    draft.careers[0].portfolioPhotos[1],
  ]);
  assert.equal(updated.careers[0].resumePhotoId, null);
});

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
      {
        name: "",
        headline: "",
        email: "",
        phone: "",
        summary: "",
        profilePhotoId: null,
      },
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
    showCareerSummary: true,
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
    "showCareerSummary",
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

test("restores a draft saved before the summary toggle with the band shown", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  delete stored.showCareerSummary;

  const restored = parseResumeDraft(JSON.stringify(stored));

  assert.notEqual(restored, null);
  assert.equal(restored!.showCareerSummary, true);
});

test("discards a draft whose summary toggle is not a boolean", () => {
  const stored = JSON.parse(serializeResumeDraft(completeDraft()));
  stored.showCareerSummary = "yes";

  assert.equal(parseResumeDraft(JSON.stringify(stored)), null);
});

test("keeps a hidden summary band through a serialize and parse round trip", () => {
  const draft: ResumeDraft = { ...completeDraft(), showCareerSummary: false };

  assert.equal(
    parseResumeDraft(serializeResumeDraft(draft))!.showCareerSummary,
    false,
  );
});

function summaryCareer(overrides: Partial<CareerEntry>): CareerEntry {
  return {
    ...createBlankCareerEntry("manual"),
    restaurantName: "요약 테스트",
    role: "Commis",
    ...overrides,
  };
}

test("counts overlapping employment months once", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({ employmentStart: "2023-01", employmentEnd: "2023-06" }),
      summaryCareer({ employmentStart: "2023-04", employmentEnd: "2023-12" }),
    ],
    { today: "2026-09" },
  );

  assert.equal(summary.totalMonths, 12);
});

test("adds adjacent employment periods", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({ employmentStart: "2022-01", employmentEnd: "2022-12" }),
      summaryCareer({ employmentStart: "2023-01", employmentEnd: "2023-03" }),
    ],
    { today: "2026-09" },
  );

  assert.equal(summary.totalMonths, 15);
});

test("ends a current career at today", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({
        employmentStart: "2026-01",
        employmentEnd: "2020-01",
        isCurrent: true,
      }),
    ],
    { today: "2026-09" },
  );

  assert.equal(summary.totalMonths, 9);
});

test("ignores excluded careers and skips an invalid start for the duration", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({
        employmentStart: "2024-01",
        employmentEnd: "2024-12",
        included: false,
        stations: ["콜드 / Garde Manger"],
      }),
      summaryCareer({
        employmentStart: "",
        employmentEnd: "2024-12",
        stations: ["핫 / Hot"],
      }),
    ],
    { today: "2026-09" },
  );

  assert.equal(summary.totalMonths, 0);
  assert.deepEqual(summary.stations, ["핫 / Hot"]);
});

test("orders summary choices by career count, then by recency", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({
        employmentStart: "2022-01",
        employmentEnd: "2023-12",
        stations: ["그릴 / Grill", "콜드 / Garde Manger"],
      }),
      summaryCareer({
        employmentStart: "2024-01",
        employmentEnd: "2025-06",
        stations: ["핫 / Hot", "그릴 / Grill"],
      }),
    ],
    { today: "2026-09" },
  );

  assert.deepEqual(summary.stations, ["그릴 / Grill", "핫 / Hot", "콜드 / Garde Manger"]);
});

test("keeps array order for careers that share a start month", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({ employmentStart: "2024-01", employmentEnd: "2024-06", skills: ["소스"] }),
      summaryCareer({ employmentStart: "2024-01", employmentEnd: "2024-06", skills: ["칼 기술"] }),
    ],
    { today: "2026-09" },
  );

  assert.deepEqual(summary.skills, ["소스", "칼 기술"]);
});

test("cuts each summary list at its limit", () => {
  const stations = Array.from({ length: 10 }, (_, index) => `스테이션 ${index}`);
  const summary = summarizeIncludedCareers(
    [summaryCareer({ employmentStart: "2024-01", employmentEnd: "2024-06", stations })],
    { today: "2026-09" },
  );

  assert.equal(summary.stations.length, SUMMARY_LIMITS.stations);
  assert.deepEqual(summary.stations, stations.slice(0, 8));
});

test("lists specialties in the taxonomy order with their labels", () => {
  const summary = summarizeIncludedCareers(
    [
      summaryCareer({
        employmentStart: "2024-01",
        employmentEnd: "2024-06",
        culinarySpecialties: ["pastry", "restaurant"],
      }),
    ],
    { today: "2026-09" },
  );

  assert.deepEqual(summary.specialties, ["레스토랑 조리", "제과·패스트리"]);
});

test("formats a duration in years and months", () => {
  assert.equal(formatDuration(0), "");
  assert.equal(formatDuration(8), "8개월");
  assert.equal(formatDuration(24), "2년");
  assert.equal(formatDuration(40), "3년 4개월");
});

test("shows the public-record badge only on an unchanged document record", () => {
  const [demo] = createDemoCareerEntries();
  const manual = createBlankCareerEntry("manual");
  const edited: CareerEntry = { ...demo, legalEmployer: "다른 법인" };

  assert.equal(hasPublicRecordBadge(demo), true);
  assert.equal(hasPublicRecordBadge(manual), false);
  assert.equal(hasPublicRecordBadge(edited), false);
});
