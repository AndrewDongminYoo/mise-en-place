export type CareerOrigin = "document" | "manual";

export type CulinarySpecialty = "restaurant" | "bakery" | "pastry";

export type ImportedCareerFields = {
  legalEmployer: string;
  qualificationStart: string;
  qualificationEnd: string;
};

export type CareerPhotoReference = {
  assetId: string;
  description: string;
};

export type CareerEntry = ImportedCareerFields & {
  id: string;
  origin: CareerOrigin;
  isDemo: boolean;
  included: boolean;
  isCurrent: boolean;
  importedFields: Readonly<ImportedCareerFields> | null;
  restaurantName: string;
  restaurantLocation: string;
  restaurantHighlights: string[];
  employmentStart: string;
  employmentEnd: string;
  role: string;
  culinarySpecialties: CulinarySpecialty[];
  stations: string[];
  responsibilities: string[];
  skills: string[];
  equipment: string[];
  representativeExperience: string;
  portfolioPhotos: CareerPhotoReference[];
  resumePhotoId: string | null;
};

export type ResumeIdentity = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  summary: string;
  profilePhotoId: string | null;
};

export type TalentPoolChoice =
  | "resume-only"
  | "selected-only"
  | "private-pool";

export const ROLE_SUGGESTIONS = [
  "Commis",
  "Demi Chef",
  "Chef de Partie",
  "Sous Chef",
  "Head Chef",
] as const;

export const CULINARY_SPECIALTY_OPTIONS = [
  {
    value: "restaurant",
    label: "레스토랑 조리",
    description: "한식·양식·중식·일식 등 서비스 주방",
  },
  {
    value: "bakery",
    label: "제빵",
    description: "빵 반죽, 발효, 성형, 굽기",
  },
  {
    value: "pastry",
    label: "제과·패스트리",
    description: "구움과자, 케이크, 초콜릿, 냉과, 디저트",
  },
] as const satisfies readonly {
  value: CulinarySpecialty;
  label: string;
  description: string;
}[];

export type CulinaryChoiceKind = "stations" | "skills" | "equipment";

export type CulinaryChoiceGroup = {
  label: string;
  options: readonly string[];
};

type CulinaryTaxonomyGroup = {
  value: CulinarySpecialty;
  label: string;
  stations: readonly string[];
  skills: readonly string[];
  equipment: readonly string[];
};

const CULINARY_TAXONOMY: readonly CulinaryTaxonomyGroup[] = [
  {
    value: "restaurant",
    label: "레스토랑 조리",
    stations: [
      "전처리 / Prep",
      "콜드 / Garde Manger",
      "핫 / Hot",
      "그릴 / Grill",
      "소테 / Sauté",
      "튀김 / Fry",
      "파스타·면",
      "육류 손질",
      "생선·해산물",
      "패스 / Expo",
    ],
    skills: [
      "미장플라스",
      "칼 기술",
      "육류 손질",
      "생선 필레·손질",
      "해산물 조리",
      "스톡·육수",
      "소스",
      "파스타·생면",
      "그릴",
      "소테",
      "튀김",
      "로스팅",
      "브레이징",
      "수비드",
      "숯불·장작",
      "피클링·절임",
      "식재료 발효·숙성",
      "플레이팅",
    ],
    equipment: [
      "콤비오븐",
      "상업용 오븐",
      "브로일러",
      "차브로일러",
      "플랫톱 그릴",
      "튀김기",
      "블렌더",
      "슬라이서",
      "웍",
      "화덕·피자 오븐",
      "스모커",
    ],
  },
  {
    value: "bakery",
    label: "제빵",
    stations: [
      "계량·전처리",
      "믹싱",
      "1차 발효",
      "분할·성형",
      "2차 발효",
      "오븐",
      "충전·토핑",
      "냉각·포장",
      "생산 관리",
    ],
    skills: [
      "베이커스 퍼센트",
      "재료 계량",
      "반죽 믹싱",
      "반죽 온도 관리",
      "글루텐 발달 판단",
      "반죽 발효 관리",
      "분할·둥글리기",
      "성형",
      "라미네이션",
      "사워도우",
      "크루아상·비에누아즈리",
      "식빵류",
      "하드계열빵류",
      "단과자빵류",
      "굽기 완료점 판단",
      "생산 스케일링",
    ],
    equipment: [
      "저울",
      "반죽기",
      "스탠드 믹서",
      "도우 시터",
      "발효기",
      "데크·컨벡션 오븐",
      "반죽·제품 냉장고",
      "냉동고",
      "온도계",
      "식빵 팬·냉각팬",
    ],
  },
  {
    value: "pastry",
    label: "제과·패스트리",
    stations: [
      "계량·전처리",
      "반죽·배터",
      "크림·필링",
      "오븐",
      "케이크",
      "초콜릿",
      "냉과",
      "플레이팅",
      "장식·마감",
      "생산 관리",
    ],
    skills: [
      "제과 배합·계량",
      "반죽·배터 제조",
      "크림·커스터드·필링",
      "무스",
      "타르트·파이",
      "슈",
      "마카롱",
      "케이크 시트·조립",
      "아이싱·파이핑",
      "초콜릿",
      "설탕 공예",
      "젤라토·소르베",
      "디저트 소스",
      "플레이팅",
      "제품별 굽기 관리",
    ],
    equipment: [
      "저울",
      "스탠드 믹서",
      "도우 시터",
      "제과용 오븐",
      "냉장·냉동고",
      "온도계",
      "전용 팬·틀",
      "짤주머니·모양깍지",
    ],
  },
];

export function getCulinaryChoiceGroups(
  specialties: readonly CulinarySpecialty[],
  kind: CulinaryChoiceKind,
): CulinaryChoiceGroup[] {
  return CULINARY_TAXONOMY.filter((group) =>
    specialties.includes(group.value),
  ).map((group) => ({
    label: group.label,
    options: group[kind],
  }));
}

export function toggleCulinarySpecialty(
  selected: readonly CulinarySpecialty[],
  value: CulinarySpecialty,
): CulinarySpecialty[] {
  const normalized = [...new Set(selected)];

  if (normalized.includes(value) && normalized.length === 1) {
    return normalized;
  }

  return normalized.includes(value)
    ? normalized.filter((option) => option !== value)
    : [...normalized, value];
}

export function addCustomChoice(
  selected: readonly string[],
  value: string,
): string[] {
  const choice = value.trim();

  if (!choice || selected.includes(choice)) {
    return [...selected];
  }

  return [...selected, choice];
}

export const RESPONSIBILITY_OPTIONS = [
  "서비스 준비",
  "스테이션 운영",
  "발주·재고",
  "메뉴 개발",
  "주니어 교육",
  "위생 관리",
] as const;

export const PROVENANCE_LABELS = {
  imported: "공공기록에서 불러옴",
  confirmed: "본인이 확인함",
  authored: "본인이 작성함",
} as const;

export function getEmployerLabel(origin: CareerOrigin) {
  return origin === "document" ? "원문 사업장명" : "법인명";
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let fallbackId = 0;

function createCareerId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  fallbackId += 1;
  return `career-${Date.now()}-${fallbackId}`;
}

export function createBlankCareerEntry(
  origin: CareerOrigin = "manual",
): CareerEntry {
  return {
    id: createCareerId(),
    origin,
    isDemo: false,
    included: true,
    isCurrent: false,
    importedFields: null,
    legalEmployer: "",
    qualificationStart: "",
    qualificationEnd: "",
    restaurantName: "",
    restaurantLocation: "",
    restaurantHighlights: [],
    employmentStart: "",
    employmentEnd: "",
    role: "",
    culinarySpecialties: ["restaurant"],
    stations: [],
    responsibilities: [],
    skills: [],
    equipment: [],
    representativeExperience: "",
    portfolioPhotos: [],
    resumePhotoId: null,
  };
}

export function createDemoCareerEntries(): CareerEntry[] {
  const importedFields: ImportedCareerFields = {
    legalEmployer: "주식회사 엠에프지코리아",
    qualificationStart: "2018-03-01",
    qualificationEnd: "2019-07-01",
  };

  return [
    {
      ...createBlankCareerEntry("document"),
      ...importedFields,
      isDemo: true,
      importedFields,
      restaurantName: "더 키친 살바토레 쿠오모",
      employmentStart: "2018-03",
      employmentEnd: "2019-06",
      role: "Chef de Partie",
      culinarySpecialties: ["restaurant"],
      stations: ["핫 / Hot", "파스타·면"],
      responsibilities: [
        "서비스 준비",
        "스테이션 운영",
        "메뉴 개발",
      ],
      skills: ["파스타·생면", "생선 필레·손질", "수비드"],
      equipment: ["콤비오븐"],
      representativeExperience:
        "파스타 스테이션을 독립 운영하고 계절 메뉴 테스트와 레시피 표준화를 보조했습니다.",
    },
  ];
}

export function createImportedCareerEntries(
  records: readonly ImportedCareerFields[],
): CareerEntry[] {
  const openRecordCount = records.filter(
    (record) => record.qualificationEnd === "",
  ).length;

  return records.map((record) => ({
    ...createBlankCareerEntry("document"),
    ...record,
    isCurrent: openRecordCount === 1 && record.qualificationEnd === "",
    importedFields: { ...record },
    restaurantName: record.legalEmployer,
    employmentStart: record.qualificationStart.slice(0, 7),
    employmentEnd: record.qualificationEnd.slice(0, 7),
  }));
}

export function getImportedCareerFieldProvenance(
  entry: CareerEntry,
  field: keyof ImportedCareerFields,
): keyof typeof PROVENANCE_LABELS {
  if (entry.importedFields === null) {
    return "authored";
  }

  return entry[field] === entry.importedFields[field] ? "imported" : "confirmed";
}

export function toggleBoundedChoice(
  selected: readonly string[],
  value: string,
  limit?: number,
): string[] {
  if (selected.includes(value)) {
    return selected.filter((item) => item !== value);
  }

  if (limit !== undefined && selected.length >= limit) {
    return [...selected];
  }

  return [...selected, value];
}

export function appendCareerPhoto(
  entry: CareerEntry,
  photo: CareerPhotoReference,
): CareerEntry {
  if (entry.portfolioPhotos.some((item) => item.assetId === photo.assetId)) {
    throw new Error("같은 사진을 한 경력에 두 번 추가할 수 없습니다.");
  }

  if (entry.portfolioPhotos.length >= 6) {
    throw new Error("경력마다 작업 사진을 최대 6개까지 추가할 수 있습니다.");
  }

  return {
    ...entry,
    portfolioPhotos: [...entry.portfolioPhotos, { ...photo }],
  };
}

export function selectCareerResumePhoto(
  entry: CareerEntry,
  assetId: string | null,
): CareerEntry {
  if (
    assetId !== null &&
    !entry.portfolioPhotos.some((photo) => photo.assetId === assetId)
  ) {
    throw new Error("현재 경력에 있는 사진만 대표사진으로 선택할 수 있습니다.");
  }

  return { ...entry, resumePhotoId: assetId };
}

export function removeCareerPhotoReference(
  entry: CareerEntry,
  assetId: string,
): CareerEntry {
  return {
    ...entry,
    portfolioPhotos: entry.portfolioPhotos.filter(
      (photo) => photo.assetId !== assetId,
    ),
    resumePhotoId:
      entry.resumePhotoId === assetId ? null : entry.resumePhotoId,
  };
}

function toKoreanOrdinal(index: number): string {
  const ordinals = ["첫 번째", "두 번째", "세 번째", "네 번째", "다섯 번째", "여섯 번째"];

  return ordinals[index] ?? `${index + 1}번째`;
}

export function getCareerPhotoDescriptionError(
  entry: CareerEntry,
  photoIndex: number,
): string | null {
  const photo = entry.portfolioPhotos[photoIndex];

  if (!photo) {
    return null;
  }

  const restaurantName = entry.restaurantName.trim() || "선택한 경력";
  const description = photo.description.trim();

  if (description.length === 0) {
    return `${restaurantName}의 ${toKoreanOrdinal(photoIndex)} 작업 사진에 메뉴명과 본인이 맡은 부분을 입력해 주세요.`;
  }

  if (description.length > 120) {
    return `${restaurantName}의 ${toKoreanOrdinal(photoIndex)} 작업 사진 설명은 120자 이하로 입력해 주세요.`;
  }

  return null;
}

export function getPhotoReferenceErrors(
  entries: readonly CareerEntry[],
): string[] {
  return entries
    .filter((career) => career.included)
    .flatMap((entry) =>
      entry.portfolioPhotos.flatMap((_, photoIndex) => {
        const error = getCareerPhotoDescriptionError(entry, photoIndex);
        return error ? [error] : [];
      }),
    );
}

export function getCareerErrors(entries: readonly CareerEntry[]): string[] {
  const includedEntries = entries.filter((entry) => entry.included);
  const completeEntries = includedEntries.filter(
    (entry) =>
      entry.restaurantName.trim().length > 0 &&
      entry.employmentStart.trim().length > 0,
  );

  if (completeEntries.length === 0) {
    return ["이력서에 사용할 경력을 한 개 이상 완성해 주세요."];
  }

  if (completeEntries.length !== includedEntries.length) {
    return [
      "이력서에 사용할 모든 경력의 레스토랑명과 실제 근무 시작일을 확인해 주세요.",
    ];
  }

  if (includedEntries.filter((entry) => entry.isCurrent).length > 1) {
    return ["재직 중인 경력은 한 개만 선택할 수 있습니다."];
  }

  const errors: string[] = [];

  for (const entry of includedEntries) {
    const restaurantName = entry.restaurantName.trim();

    if (!MONTH_PATTERN.test(entry.employmentStart)) {
      errors.push(`${restaurantName}의 근무 시작월 형식을 확인해 주세요.`);
      continue;
    }

    if (entry.isCurrent) {
      if (entry.employmentEnd) {
        errors.push(
          `${restaurantName}은 재직 중이므로 근무 종료월을 비워 주세요.`,
        );
      }
      continue;
    }

    if (!entry.employmentEnd) {
      errors.push(
        `${restaurantName}의 근무 종료월을 입력하거나 재직 중을 선택해 주세요.`,
      );
      continue;
    }

    if (!MONTH_PATTERN.test(entry.employmentEnd)) {
      errors.push(`${restaurantName}의 근무 종료월 형식을 확인해 주세요.`);
      continue;
    }

    if (entry.employmentEnd && entry.employmentEnd < entry.employmentStart) {
      errors.push(
        `${restaurantName}의 근무 종료월은 시작월보다 빠를 수 없습니다.`,
      );
    }
  }

  return errors;
}

/**
 * The copy a person sends to a reviewer carries no name, email, or phone.
 *
 * `docs/specs/resume-review-workflow.md` puts the removal on the product
 * rather than on the person, because a boundary that depends on someone
 * remembering to delete three fields is not a boundary. Only those three go:
 * the headline, the summary and every career record describe the work, which
 * is the whole point of asking for a review.
 *
 * The person keeps their own name in the draft. Blanking it here rather than
 * in the stored record is what lets the same resume produce both copies.
 */
export function toReviewIdentity(identity: ResumeIdentity): ResumeIdentity {
  return {
    ...identity,
    name: "",
    email: "",
    phone: "",
    profilePhotoId: null,
  };
}

export function getEnrichmentErrors(
  identity: ResumeIdentity,
  entries: readonly CareerEntry[],
): string[] {
  const errors: string[] = [];

  if (identity.name.trim().length === 0) {
    errors.push("이름을 입력해 주세요.");
  }

  if (identity.headline.trim().length === 0) {
    errors.push("이력서 제목을 입력해 주세요.");
  }

  if (identity.email.trim() && !EMAIL_PATTERN.test(identity.email.trim())) {
    errors.push("올바른 이메일 주소를 입력해 주세요.");
  }

  for (const entry of entries.filter((career) => career.included)) {
    const restaurantName = entry.restaurantName.trim() || "선택한 경력";

    if (entry.role.trim().length === 0) {
      errors.push(`${restaurantName}의 직책을 입력해 주세요.`);
    }

    if (entry.responsibilities.length === 0) {
      errors.push(
        `${restaurantName}의 주요 업무를 한 개 이상 선택해 주세요.`,
      );
    }
  }

  return [...errors, ...getPhotoReferenceErrors(entries)];
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");

  if (!year || !month) {
    return value;
  }

  return `${year}.${month}`;
}

export const RESUME_DRAFT_STORAGE_KEY = "mise-en-place.resume-draft";

const RESUME_DRAFT_VERSION = 3;
const CULINARY_TAXONOMY_DRAFT_VERSION = 1;
const SUPPORTED_RESUME_DRAFT_VERSIONS = [1, 2, 3] as const;

export type ResumeDraft = {
  careers: CareerEntry[];
  identity: ResumeIdentity;
  isDemoDraft: boolean;
  talentPoolChoice: TalentPoolChoice;
  showCareerSummary: boolean;
};

export function collectReferencedPhotoIds(draft: ResumeDraft): string[] {
  const ids = new Set<string>();

  if (draft.identity.profilePhotoId) {
    ids.add(draft.identity.profilePhotoId);
  }

  for (const career of draft.careers) {
    for (const photo of career.portfolioPhotos) {
      ids.add(photo.assetId);
    }
  }

  return [...ids];
}

export function removeMissingPhotoReferences(
  draft: ResumeDraft,
  missingIds: readonly string[],
): ResumeDraft {
  const missing = new Set(missingIds);

  return {
    ...draft,
    identity: {
      ...draft.identity,
      profilePhotoId:
        draft.identity.profilePhotoId &&
        missing.has(draft.identity.profilePhotoId)
          ? null
          : draft.identity.profilePhotoId,
    },
    careers: draft.careers.map((career) => ({
      ...career,
      portfolioPhotos: career.portfolioPhotos.filter(
        (photo) => !missing.has(photo.assetId),
      ),
      resumePhotoId:
        career.resumePhotoId && missing.has(career.resumePhotoId)
          ? null
          : career.resumePhotoId,
    })),
  };
}

const TALENT_POOL_CHOICES: readonly TalentPoolChoice[] = [
  "resume-only",
  "selected-only",
  "private-pool",
];

const CAREER_ORIGINS: readonly CareerOrigin[] = ["document", "manual"];
const CULINARY_SPECIALTIES: readonly CulinarySpecialty[] = [
  "restaurant",
  "bakery",
  "pastry",
];

/**
 * Only the confirmed structured record is written. The source document, its
 * extracted text and its password are never part of a draft, and rebuilding
 * each field by name is what keeps anything else from reaching storage.
 */
export function serializeResumeDraft(draft: ResumeDraft): string {
  return JSON.stringify({
    version: RESUME_DRAFT_VERSION,
    careers: draft.careers.map((entry) => ({
      id: entry.id,
      origin: entry.origin,
      isDemo: entry.isDemo,
      included: entry.included,
      isCurrent: entry.isCurrent,
      importedFields: entry.importedFields
        ? {
            legalEmployer: entry.importedFields.legalEmployer,
            qualificationStart: entry.importedFields.qualificationStart,
            qualificationEnd: entry.importedFields.qualificationEnd,
          }
        : null,
      legalEmployer: entry.legalEmployer,
      qualificationStart: entry.qualificationStart,
      qualificationEnd: entry.qualificationEnd,
      restaurantName: entry.restaurantName,
      restaurantLocation: entry.restaurantLocation.trim(),
      restaurantHighlights: entry.restaurantHighlights
        .map((highlight) => highlight.trim())
        .filter(Boolean),
      employmentStart: entry.employmentStart,
      employmentEnd: entry.employmentEnd,
      role: entry.role,
      culinarySpecialties: [...entry.culinarySpecialties],
      stations: [...entry.stations],
      responsibilities: [...entry.responsibilities],
      skills: [...entry.skills],
      equipment: [...entry.equipment],
      representativeExperience: entry.representativeExperience,
      portfolioPhotos: entry.portfolioPhotos.map((photo) => ({
        assetId: photo.assetId,
        description: photo.description.trim(),
      })),
      resumePhotoId: entry.resumePhotoId,
    })),
    identity: {
      name: draft.identity.name,
      headline: draft.identity.headline,
      email: draft.identity.email,
      phone: draft.identity.phone,
      summary: draft.identity.summary,
      profilePhotoId: draft.identity.profilePhotoId,
    },
    isDemoDraft: draft.isDemoDraft,
    talentPoolChoice: draft.talentPoolChoice,
    showCareerSummary: draft.showCareerSummary,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.every((item) => typeof item === "string")
    ? (value as string[]).slice()
    : null;
}

function readNullableString(value: unknown): string | null | false {
  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : false;
}

function readCareerPhotoReferences(
  value: unknown,
): CareerPhotoReference[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const references: CareerPhotoReference[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      return null;
    }

    const assetId = readString(item.assetId);
    const description = readString(item.description);

    if (
      assetId === null ||
      assetId.trim().length === 0 ||
      description === null ||
      description.trim().length > 120
    ) {
      return null;
    }

    references.push({ assetId, description });
  }

  return references;
}

function hasValidRestaurantMetadata(
  location: string,
  highlights: readonly string[],
): boolean {
  return (
    location.trim().length <= 100 &&
    highlights.length <= 5 &&
    highlights.every((highlight) => {
      const normalized = highlight.trim();

      return normalized.length > 0 && normalized.length <= 80;
    })
  );
}

function hasValidCareerPhotoReferences(
  photos: readonly CareerPhotoReference[],
  resumePhotoId: string | null,
): boolean {
  const ids = photos.map((photo) => photo.assetId);

  return (
    photos.length <= 6 &&
    new Set(ids).size === ids.length &&
    (resumePhotoId === null || ids.includes(resumePhotoId))
  );
}

function readImportedFields(value: unknown): ImportedCareerFields | null | false {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return false;
  }

  const legalEmployer = readString(value.legalEmployer);
  const qualificationStart = readString(value.qualificationStart);
  const qualificationEnd = readString(value.qualificationEnd);

  if (
    legalEmployer === null ||
    qualificationStart === null ||
    qualificationEnd === null
  ) {
    return false;
  }

  return { legalEmployer, qualificationStart, qualificationEnd };
}

function inferLegacyCulinarySpecialties(
  stations: readonly string[],
): CulinarySpecialty[] {
  const specialties: CulinarySpecialty[] = [];

  if (
    stations.length === 0 ||
    stations.some((station) => station !== "Bakery" && station !== "Pastry")
  ) {
    specialties.push("restaurant");
  }

  if (stations.includes("Bakery")) {
    specialties.push("bakery");
  }

  if (stations.includes("Pastry")) {
    specialties.push("pastry");
  }

  return specialties;
}

function readCareerEntry(
  value: unknown,
  draftVersion: number,
): CareerEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const origin = readString(value.origin);
  const strings = {
    legalEmployer: readString(value.legalEmployer),
    qualificationStart: readString(value.qualificationStart),
    qualificationEnd: readString(value.qualificationEnd),
    restaurantName: readString(value.restaurantName),
    restaurantLocation:
      draftVersion < RESUME_DRAFT_VERSION
        ? ""
        : readString(value.restaurantLocation),
    employmentStart: readString(value.employmentStart),
    employmentEnd: readString(value.employmentEnd),
    role: readString(value.role),
    representativeExperience: readString(value.representativeExperience),
  };
  const lists = {
    restaurantHighlights:
      draftVersion < RESUME_DRAFT_VERSION
        ? []
        : readStringArray(value.restaurantHighlights),
    stations: readStringArray(value.stations),
    responsibilities: readStringArray(value.responsibilities),
    skills: readStringArray(value.skills),
    equipment: readStringArray(value.equipment),
  };
  const importedFields = readImportedFields(value.importedFields);
  const culinarySpecialties =
    value.culinarySpecialties === undefined &&
    draftVersion === CULINARY_TAXONOMY_DRAFT_VERSION &&
    lists.stations !== null
      ? inferLegacyCulinarySpecialties(lists.stations)
      : readStringArray(value.culinarySpecialties);
  const portfolioPhotos =
    draftVersion < RESUME_DRAFT_VERSION
      ? []
      : readCareerPhotoReferences(value.portfolioPhotos);
  const resumePhotoId =
    draftVersion < RESUME_DRAFT_VERSION
      ? null
      : readNullableString(value.resumePhotoId);
  const isCurrent =
    value.isCurrent === undefined
      ? false
      : typeof value.isCurrent === "boolean"
        ? value.isCurrent
        : null;

  if (
    id === null ||
    origin === null ||
    !CAREER_ORIGINS.includes(origin as CareerOrigin) ||
    typeof value.isDemo !== "boolean" ||
    typeof value.included !== "boolean" ||
    isCurrent === null ||
    importedFields === false ||
    portfolioPhotos === null ||
    resumePhotoId === false ||
    culinarySpecialties === null ||
    culinarySpecialties.length === 0 ||
    culinarySpecialties.some(
      (specialty) =>
        !CULINARY_SPECIALTIES.includes(specialty as CulinarySpecialty),
    ) ||
    Object.values(strings).some((field) => field === null) ||
    Object.values(lists).some((list) => list === null) ||
    !hasValidRestaurantMetadata(
      strings.restaurantLocation as string,
      lists.restaurantHighlights as string[],
    ) ||
    !hasValidCareerPhotoReferences(portfolioPhotos, resumePhotoId)
  ) {
    return null;
  }

  const normalizedCulinarySpecialties = [
    ...new Set(culinarySpecialties),
  ] as CulinarySpecialty[];

  return {
    id,
    origin: origin as CareerOrigin,
    isDemo: value.isDemo,
    included: value.included,
    isCurrent,
    importedFields,
    legalEmployer: strings.legalEmployer as string,
    qualificationStart: strings.qualificationStart as string,
    qualificationEnd: strings.qualificationEnd as string,
    restaurantName: strings.restaurantName as string,
    restaurantLocation: strings.restaurantLocation as string,
    restaurantHighlights: lists.restaurantHighlights as string[],
    employmentStart: strings.employmentStart as string,
    employmentEnd: strings.employmentEnd as string,
    role: strings.role as string,
    culinarySpecialties: normalizedCulinarySpecialties,
    stations: lists.stations as string[],
    responsibilities: lists.responsibilities as string[],
    skills: lists.skills as string[],
    equipment: lists.equipment as string[],
    representativeExperience: strings.representativeExperience as string,
    portfolioPhotos,
    resumePhotoId,
  };
}

function readIdentity(value: unknown, draftVersion: number): ResumeIdentity | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = readString(value.name);
  const headline = readString(value.headline);
  const email = readString(value.email);
  const phone = readString(value.phone);
  const summary = readString(value.summary);
  const profilePhotoId =
    draftVersion < RESUME_DRAFT_VERSION
      ? null
      : readNullableString(value.profilePhotoId);

  if (
    name === null ||
    headline === null ||
    email === null ||
    phone === null ||
    summary === null ||
    profilePhotoId === false ||
    (typeof profilePhotoId === "string" && profilePhotoId.trim().length === 0)
  ) {
    return null;
  }

  return { name, headline, email, phone, summary, profilePhotoId };
}

/**
 * Fails closed: an absent, unreadable, out-of-version or malformed draft is
 * discarded rather than partially restored, because a half-restored resume is
 * harder for the person to notice than an empty one.
 */
export function parseResumeDraft(raw: string | null): ResumeDraft | null {
  if (!raw) {
    return null;
  }

  let value: unknown;

  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    !isRecord(value) ||
    !SUPPORTED_RESUME_DRAFT_VERSIONS.includes(
      value.version as (typeof SUPPORTED_RESUME_DRAFT_VERSIONS)[number],
    )
  ) {
    return null;
  }

  if (!Array.isArray(value.careers)) {
    return null;
  }

  const draftVersion = value.version as number;
  const careers: CareerEntry[] = [];

  for (const entry of value.careers) {
    const career = readCareerEntry(entry, draftVersion);

    if (career === null) {
      return null;
    }

    careers.push(career);
  }

  if (careers.filter((career) => career.isCurrent).length > 1) {
    return null;
  }

  const identity = readIdentity(value.identity, draftVersion);
  const talentPoolChoice = readString(value.talentPoolChoice);
  // A draft written before the summary toggle existed carries no field, and
  // it restores with the band shown, which is what the toggle defaults to.
  const showCareerSummary =
    value.showCareerSummary === undefined ? true : value.showCareerSummary;

  if (
    identity === null ||
    typeof value.isDemoDraft !== "boolean" ||
    typeof showCareerSummary !== "boolean" ||
    talentPoolChoice === null ||
    !TALENT_POOL_CHOICES.includes(talentPoolChoice as TalentPoolChoice)
  ) {
    return null;
  }

  return {
    careers,
    identity,
    isDemoDraft: value.isDemoDraft,
    talentPoolChoice: talentPoolChoice as TalentPoolChoice,
    showCareerSummary,
  };
}

export function formatMonthRange(start: string, end: string) {
  if (!start) {
    return "근무 기간 미입력";
  }

  return `${formatMonth(start)} - ${end ? formatMonth(end) : "현재"}`;
}

export type CareerSummary = {
  totalMonths: number;
  specialties: string[];
  stations: string[];
  skills: string[];
  equipment: string[];
};

export const SUMMARY_LIMITS = {
  stations: 8,
  skills: 6,
  equipment: 6,
} as const;

function toMonthIndex(month: string): number {
  const [year, monthOfYear] = month.split("-").map(Number);
  return year * 12 + (monthOfYear - 1);
}

/**
 * Counts the months covered by at least one interval. Two careers that
 * overlap share those months, so a plain sum would credit them twice.
 */
function countUnionMonths(
  intervals: ReadonlyArray<readonly [number, number]>,
): number {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let open: [number, number] | null = null;

  for (const [start, end] of sorted) {
    if (open === null) {
      open = [start, end];
      continue;
    }

    if (start <= open[1] + 1) {
      open[1] = Math.max(open[1], end);
      continue;
    }

    total += open[1] - open[0] + 1;
    open = [start, end];
  }

  if (open !== null) {
    total += open[1] - open[0] + 1;
  }

  return total;
}

/**
 * Orders the union of one bounded choice across careers by how many careers
 * carry it, then by where it first appears when careers are read from the
 * most recent to the oldest. Within a career the person's own order holds.
 */
function rankChoices(
  careersByRecency: readonly CareerEntry[],
  pick: (career: CareerEntry) => readonly string[],
  limit: number,
): string[] {
  const counts = new Map<string, number>();
  const firstSeen = new Map<string, number>();
  let position = 0;

  for (const career of careersByRecency) {
    const seenInCareer = new Set<string>();

    for (const item of pick(career)) {
      if (seenInCareer.has(item)) {
        continue;
      }

      seenInCareer.add(item);
      counts.set(item, (counts.get(item) ?? 0) + 1);

      if (!firstSeen.has(item)) {
        firstSeen.set(item, position);
      }

      position += 1;
    }
  }

  return [...counts.keys()]
    .sort(
      (a, b) =>
        counts.get(b)! - counts.get(a)! ||
        firstSeen.get(a)! - firstSeen.get(b)!,
    )
    .slice(0, limit);
}

export function summarizeIncludedCareers(
  entries: readonly CareerEntry[],
  options: { today: string },
): CareerSummary {
  const included = entries.filter((entry) => entry.included);
  const intervals: Array<readonly [number, number]> = [];

  for (const entry of included) {
    if (!MONTH_PATTERN.test(entry.employmentStart)) {
      continue;
    }

    const end = entry.isCurrent ? options.today : entry.employmentEnd;

    if (!MONTH_PATTERN.test(end)) {
      continue;
    }

    const startIndex = toMonthIndex(entry.employmentStart);
    const endIndex = toMonthIndex(end);

    if (endIndex < startIndex) {
      continue;
    }

    intervals.push([startIndex, endIndex]);
  }

  // `sort` is stable, so careers that share a start month keep the order of
  // the `entries` array.
  const byRecency = [...included].sort((a, b) =>
    b.employmentStart.localeCompare(a.employmentStart),
  );
  const specialtyValues = new Set(
    included.flatMap((entry) => entry.culinarySpecialties),
  );

  return {
    totalMonths: countUnionMonths(intervals),
    specialties: CULINARY_SPECIALTY_OPTIONS.filter((option) =>
      specialtyValues.has(option.value),
    ).map((option) => option.label),
    stations: rankChoices(
      byRecency,
      (career) => career.stations,
      SUMMARY_LIMITS.stations,
    ),
    skills: rankChoices(
      byRecency,
      (career) => career.skills,
      SUMMARY_LIMITS.skills,
    ),
    equipment: rankChoices(
      byRecency,
      (career) => career.equipment,
      SUMMARY_LIMITS.equipment,
    ),
  };
}

export function formatDuration(totalMonths: number): string {
  if (totalMonths <= 0) {
    return "";
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months}개월`;
  }

  if (months === 0) {
    return `${years}년`;
  }

  return `${years}년 ${months}개월`;
}

/**
 * The sheet marks an employer name that still reads exactly as the public
 * record supplied it. Step 2 does not let the person edit those fields on a
 * document record, so the comparison is defensive rather than reachable.
 */
export function hasPublicRecordBadge(entry: CareerEntry): boolean {
  if (entry.origin !== "document" || entry.importedFields === null) {
    return false;
  }

  return (
    entry.legalEmployer === entry.importedFields.legalEmployer &&
    entry.qualificationStart === entry.importedFields.qualificationStart &&
    entry.qualificationEnd === entry.importedFields.qualificationEnd
  );
}

/**
 * Every string the printed sheet adds on its own. The verification script
 * checks the PDFs against these, so they live here rather than in the
 * component, which Node cannot import.
 */
export const RESUME_SHEET_COPY = {
  summaryTitle: "한눈에 보기",
  summaryCaption: "포함된 경력에서 정리함",
  durationPrefix: "주방 경력",
  stationsLabel: "맡을 수 있는 스테이션",
  skillsLabel: "기술",
  equipmentLabel: "장비",
  dutiesLabel: "주요 업무",
  entryStationsLabel: "스테이션",
  entryKitchenLabel: "기술·장비",
  badgeLabel: "공공기록",
  badgeTitle: "사업장명을 공공기록에서 불러옴",
  legendWithBadge:
    "✓ 표시가 있는 사업장명은 공공기록에서 불러왔습니다. 레스토랑명·근무 기간·직책은 본인이 확인했고, 그 외 내용은 본인이 작성했습니다.",
  legendWithoutBadge: "모든 내용은 본인이 작성했습니다.",
} as const;
