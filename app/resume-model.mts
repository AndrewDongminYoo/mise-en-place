export type CareerOrigin = "document" | "manual";

export type CareerEntry = {
  id: string;
  origin: CareerOrigin;
  isDemo: boolean;
  included: boolean;
  legalEmployer: string;
  qualificationStart: string;
  qualificationEnd: string;
  restaurantName: string;
  employmentStart: string;
  employmentEnd: string;
  role: string;
  stations: string[];
  responsibilities: string[];
  skills: string[];
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
  "콤비오븐",
] as const;

export const PROVENANCE_LABELS = {
  imported: "공공기록에서 불러옴",
  confirmed: "본인이 확인함",
  authored: "본인이 작성함",
} as const;

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
    representativeExperience: "",
  };
}

export function createDemoCareerEntries(): CareerEntry[] {
  return [
    {
      ...createBlankCareerEntry("document"),
      isDemo: true,
      legalEmployer: "주식회사 엠에프지코리아",
      qualificationStart: "2018-03",
      qualificationEnd: "2019-07",
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
      skills: ["제면", "생선 손질", "수비드", "콤비오븐"],
      representativeExperience:
        "파스타 스테이션을 독립 운영하고 계절 메뉴 테스트와 레시피 표준화를 보조했습니다.",
    },
  ];
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

export function formatMonthRange(start: string, end: string) {
  if (!start) {
    return "근무 기간 미입력";
  }

  return `${formatMonth(start)} - ${end ? formatMonth(end) : "현재"}`;
}
