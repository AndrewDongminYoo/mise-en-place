export type CareerOrigin = "document" | "manual";

export type ImportedCareerFields = {
  legalEmployer: string;
  qualificationStart: string;
  qualificationEnd: string;
};

export type CareerEntry = ImportedCareerFields & {
  id: string;
  origin: CareerOrigin;
  isDemo: boolean;
  included: boolean;
  importedFields: Readonly<ImportedCareerFields> | null;
  restaurantName: string;
  employmentStart: string;
  employmentEnd: string;
  role: string;
  stations: string[];
  responsibilities: string[];
  skills: string[];
  equipment: string[];
  representativeExperience: string;
};

export type ResumeIdentity = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  summary: string;
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

export const STATION_OPTIONS = [
  "Cold",
  "Hot",
  "Grill",
  "Pasta",
  "Pastry",
  "Bakery",
  "Prep",
] as const;

export const RESPONSIBILITY_OPTIONS = [
  "서비스 준비",
  "스테이션 운영",
  "발주·재고",
  "메뉴 개발",
  "주니어 교육",
  "위생 관리",
] as const;

export const SKILL_OPTIONS = [
  "숯불",
  "수비드",
  "발효",
  "제면",
  "생선 손질",
] as const;

export const EQUIPMENT_OPTIONS = [
  "콤비오븐",
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
    importedFields: null,
    legalEmployer: "",
    qualificationStart: "",
    qualificationEnd: "",
    restaurantName: "",
    employmentStart: "",
    employmentEnd: "",
    role: "",
    stations: [],
    responsibilities: [],
    skills: [],
    equipment: [],
    representativeExperience: "",
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
      stations: ["Hot", "Pasta"],
      responsibilities: [
        "서비스 준비",
        "스테이션 운영",
        "메뉴 개발",
      ],
      skills: ["제면", "생선 손질", "수비드"],
      equipment: ["콤비오븐"],
      representativeExperience:
        "파스타 스테이션을 독립 운영하고 계절 메뉴 테스트와 레시피 표준화를 보조했습니다.",
    },
  ];
}

export function createImportedCareerEntries(
  records: readonly ImportedCareerFields[],
): CareerEntry[] {
  return records.map((record) => ({
    ...createBlankCareerEntry("document"),
    ...record,
    importedFields: { ...record },
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

  const errors: string[] = [];

  for (const entry of includedEntries) {
    const restaurantName = entry.restaurantName.trim();

    if (!MONTH_PATTERN.test(entry.employmentStart)) {
      errors.push(`${restaurantName}의 근무 시작월 형식을 확인해 주세요.`);
      continue;
    }

    if (entry.employmentEnd && !MONTH_PATTERN.test(entry.employmentEnd)) {
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

  return errors;
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");

  if (!year || !month) {
    return value;
  }

  return `${year}.${month}`;
}

export const RESUME_DRAFT_STORAGE_KEY = "mise-en-place.resume-draft";

const RESUME_DRAFT_VERSION = 1;

export type ResumeDraft = {
  careers: CareerEntry[];
  identity: ResumeIdentity;
  isDemoDraft: boolean;
  talentPoolChoice: TalentPoolChoice;
};

const TALENT_POOL_CHOICES: readonly TalentPoolChoice[] = [
  "resume-only",
  "selected-only",
  "private-pool",
];

const CAREER_ORIGINS: readonly CareerOrigin[] = ["document", "manual"];

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
      employmentStart: entry.employmentStart,
      employmentEnd: entry.employmentEnd,
      role: entry.role,
      stations: [...entry.stations],
      responsibilities: [...entry.responsibilities],
      skills: [...entry.skills],
      equipment: [...entry.equipment],
      representativeExperience: entry.representativeExperience,
    })),
    identity: {
      name: draft.identity.name,
      headline: draft.identity.headline,
      email: draft.identity.email,
      phone: draft.identity.phone,
      summary: draft.identity.summary,
    },
    isDemoDraft: draft.isDemoDraft,
    talentPoolChoice: draft.talentPoolChoice,
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

function readCareerEntry(value: unknown): CareerEntry | null {
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
    employmentStart: readString(value.employmentStart),
    employmentEnd: readString(value.employmentEnd),
    role: readString(value.role),
    representativeExperience: readString(value.representativeExperience),
  };
  const lists = {
    stations: readStringArray(value.stations),
    responsibilities: readStringArray(value.responsibilities),
    skills: readStringArray(value.skills),
    equipment: readStringArray(value.equipment),
  };
  const importedFields = readImportedFields(value.importedFields);

  if (
    id === null ||
    origin === null ||
    !CAREER_ORIGINS.includes(origin as CareerOrigin) ||
    typeof value.isDemo !== "boolean" ||
    typeof value.included !== "boolean" ||
    importedFields === false ||
    Object.values(strings).some((field) => field === null) ||
    Object.values(lists).some((list) => list === null)
  ) {
    return null;
  }

  return {
    id,
    origin: origin as CareerOrigin,
    isDemo: value.isDemo,
    included: value.included,
    importedFields,
    legalEmployer: strings.legalEmployer as string,
    qualificationStart: strings.qualificationStart as string,
    qualificationEnd: strings.qualificationEnd as string,
    restaurantName: strings.restaurantName as string,
    employmentStart: strings.employmentStart as string,
    employmentEnd: strings.employmentEnd as string,
    role: strings.role as string,
    stations: lists.stations as string[],
    responsibilities: lists.responsibilities as string[],
    skills: lists.skills as string[],
    equipment: lists.equipment as string[],
    representativeExperience: strings.representativeExperience as string,
  };
}

function readIdentity(value: unknown): ResumeIdentity | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = readString(value.name);
  const headline = readString(value.headline);
  const email = readString(value.email);
  const phone = readString(value.phone);
  const summary = readString(value.summary);

  if (
    name === null ||
    headline === null ||
    email === null ||
    phone === null ||
    summary === null
  ) {
    return null;
  }

  return { name, headline, email, phone, summary };
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

  if (!isRecord(value) || value.version !== RESUME_DRAFT_VERSION) {
    return null;
  }

  if (!Array.isArray(value.careers)) {
    return null;
  }

  const careers: CareerEntry[] = [];

  for (const entry of value.careers) {
    const career = readCareerEntry(entry);

    if (career === null) {
      return null;
    }

    careers.push(career);
  }

  const identity = readIdentity(value.identity);
  const talentPoolChoice = readString(value.talentPoolChoice);

  if (
    identity === null ||
    typeof value.isDemoDraft !== "boolean" ||
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
  };
}

export function formatMonthRange(start: string, end: string) {
  if (!start) {
    return "근무 기간 미입력";
  }

  return `${formatMonth(start)} - ${end ? formatMonth(end) : "현재"}`;
}
