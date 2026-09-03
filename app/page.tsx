"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  MAX_NHIS_PDF_BYTES,
  importNhisQualificationPdf,
} from "./nhis-parser.mts";

import {
  EQUIPMENT_OPTIONS,
  PROVENANCE_LABELS,
  RESPONSIBILITY_OPTIONS,
  RESUME_DRAFT_STORAGE_KEY,
  ROLE_SUGGESTIONS,
  SKILL_OPTIONS,
  STATION_OPTIONS,
  createBlankCareerEntry,
  createDemoCareerEntries,
  createImportedCareerEntries,
  formatMonthRange,
  getCareerErrors,
  getEmployerLabel,
  getEnrichmentErrors,
  getImportedCareerFieldProvenance,
  parseResumeDraft,
  serializeResumeDraft,
  toggleBoundedChoice,
  type CareerEntry,
  type ResumeIdentity,
  type TalentPoolChoice,
} from "./resume-model.mts";

const STEPS = [
  { title: "경력 자료", short: "불러오기" },
  { title: "근무 이력", short: "확인하기" },
  { title: "요리 경력", short: "보완하기" },
  { title: "전문 이력서", short: "완성하기" },
] as const;

const STEP_COPY = [
  {
    eyebrow: "STEP 01 · CAREER SOURCE",
    title: "경력을 요리의 언어로 정리하세요",
    description:
      "근무 이력의 골격부터 시작하면 오래된 날짜를 다시 기억해 낼 필요가 없습니다. 실제 역할과 기술은 다음 단계에서 직접 확인합니다.",
  },
  {
    eyebrow: "STEP 02 · EMPLOYMENT SKELETON",
    title: "근무 이력의 골격을 확인하세요",
    description:
      "법인명과 실제 레스토랑명, 건강보험 자격일과 실제 근무일을 섞지 않고 각각 남깁니다.",
  },
  {
    eyebrow: "STEP 03 · CULINARY PRACTICE",
    title: "그 주방에서 맡았던 일을 더하세요",
    description:
      "직책보다 구체적인 스테이션, 주요 업무, 기술과 장비 경험을 선택하고 대표 경험을 직접 작성합니다.",
  },
  {
    eyebrow: "STEP 04 · RESUME PROOF",
    title: "이력서를 마지막으로 확인하세요",
    description:
      "출처가 다른 정보를 구분해서 확인하고, 한 가지 정돈된 양식으로 인쇄하거나 PDF로 저장합니다.",
  },
] as const;

const EMPTY_IDENTITY: ResumeIdentity = {
  name: "",
  headline: "",
  email: "",
  phone: "",
  summary: "",
};

const DEMO_IDENTITY: ResumeIdentity = {
  name: "유동민",
  headline: "Chef de Partie",
  email: "chef@example.com",
  phone: "010-0000-0000",
  summary:
    "이탈리안 다이닝 주방에서 핫·파스타 스테이션을 운영했으며, 계절 메뉴 테스트와 레시피 표준화에 참여했습니다.",
};

const TALENT_POOL_OPTIONS: Array<{
  value: TalentPoolChoice;
  title: string;
  description: string;
}> = [
  {
    value: "resume-only",
    title: "이력서만 저장",
    description: "채용 연락을 받지 않습니다. 기본 선택입니다.",
  },
  {
    value: "selected-only",
    title: "관심 있는 채용이 있을 때만 연락받기",
    description: "지원 의사를 밝힌 채용에 대해서만 연락받습니다.",
  },
  {
    value: "private-pool",
    title: "검증된 레스토랑에 비공개 프로필 공개",
    description: "검증을 통과한 레스토랑의 채용 제안을 받을 수 있습니다.",
  },
];

type ChoiceGroupProps = {
  legend: string;
  options: readonly string[];
  selected: readonly string[];
  onToggle: (option: string) => void;
  limit?: number;
  hint?: ReactNode;
};

function ChoiceGroup({
  legend,
  options,
  selected,
  onToggle,
  limit,
  hint,
}: ChoiceGroupProps) {
  return (
    <fieldset className="choice-field">
      <legend>{legend}</legend>
      {hint ? <span className="choice-hint field-hint">{hint}</span> : null}
      <div className="choice-grid">
        {options.map((option) => {
          const checked = selected.includes(option);
          const disabled =
            !checked && limit !== undefined && selected.length >= limit;
          const className = [
            "choice-chip",
            checked ? "is-selected" : "",
            disabled ? "is-disabled" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <label className={className} key={option}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(option)}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  provenance,
  children,
  required,
}: {
  label: string;
  hint?: string;
  provenance?: keyof typeof PROVENANCE_LABELS;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {children}
      {provenance ? (
        <span className="field-provenance">
          <ProvenanceTag kind={provenance} />
        </span>
      ) : null}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

function ProvenanceTag({
  kind,
}: {
  kind: keyof typeof PROVENANCE_LABELS;
}) {
  return (
    <span className={"provenance-tag provenance-" + kind}>
      {PROVENANCE_LABELS[kind]}
    </span>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return Math.ceil(bytes / 1024) + " KB";
  }

  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const storedDraftListeners = new Set<() => void>();

function readStoredDraft() {
  try {
    return window.localStorage.getItem(RESUME_DRAFT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribeToStoredDraft(onStoreChange: () => void) {
  storedDraftListeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    storedDraftListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function notifyStoredDraftChanged() {
  for (const listener of storedDraftListeners) {
    listener();
  }
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [careers, setCareers] = useState<CareerEntry[]>([]);
  const [identity, setIdentity] = useState<ResumeIdentity>(EMPTY_IDENTITY);
  const [isDemoDraft, setIsDemoDraft] = useState(false);
  const [talentPoolChoice, setTalentPoolChoice] =
    useState<TalentPoolChoice>("resume-only");
  const [errors, setErrors] = useState<string[]>([]);
  const [fileNotice, setFileNotice] = useState<{
    tone: "neutral" | "error";
    message: string;
    manualFallback?: boolean;
  } | null>(null);
  const [hasSelectedPdf, setHasSelectedPdf] = useState(false);
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [hasConfirmedCareers, setHasConfirmedCareers] = useState(false);
  const storedDraftRaw = useSyncExternalStore(
    subscribeToStoredDraft,
    readStoredDraft,
    () => null,
  );
  const storedDraft = useMemo(
    () => parseResumeDraft(storedDraftRaw),
    [storedDraftRaw],
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const selectedPdfRef = useRef<File | null>(null);
  const previousStep = useRef(currentStep);

  useEffect(() => {
    if (previousStep.current === currentStep) {
      return;
    }

    previousStep.current = currentStep;
    headingRef.current?.focus();
  }, [currentStep]);

  useEffect(() => {
    if (!hasConfirmedCareers || careers.length === 0) {
      return;
    }

    try {
      window.localStorage.setItem(
        RESUME_DRAFT_STORAGE_KEY,
        serializeResumeDraft({
          careers,
          identity,
          isDemoDraft,
          talentPoolChoice,
        }),
      );
    } catch {
      // Storage can be unavailable in a private window or with site data
      // blocked. The draft is a convenience, not the product.
    }
  }, [hasConfirmedCareers, careers, identity, isDemoDraft, talentPoolChoice]);

  useEffect(
    () => () => {
      selectedPdfRef.current = null;

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (passwordInputRef.current) {
        passwordInputRef.current.value = "";
      }
    },
    [],
  );

  const currentCopy = STEP_COPY[currentStep - 1];
  const includedCareers = careers.filter((career) => career.included);
  const hasDraft = careers.length > 0;
  const isManualOnlyDraft =
    currentStep === 2 && careers.every((career) => career.origin === "manual");

  function moveToStep(step: number) {
    setErrors([]);
    setCurrentStep(step);
  }

  function clearDocumentInputs() {
    selectedPdfRef.current = null;
    setHasSelectedPdf(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (passwordInputRef.current) {
      passwordInputRef.current.value = "";
    }
  }

  function beginDraft(
    nextCareers: CareerEntry[],
    nextIdentity: ResumeIdentity,
    nextIsDemo: boolean,
  ) {
    setCareers(nextCareers);
    setIdentity(nextIdentity);
    setIsDemoDraft(nextIsDemo);
    setTalentPoolChoice("resume-only");
    setHasConfirmedCareers(false);
    moveToStep(2);
  }

  function startManualEntry() {
    if (isImportingPdf) {
      return;
    }

    if (
      hasDraft &&
      !window.confirm(
        "새 이력서로 시작하시겠습니까? 현재 탭에서 작성한 내용은 사라집니다.",
      )
    ) {
      return;
    }

    clearDocumentInputs();
    setFileNotice(null);
    beginDraft([createBlankCareerEntry("manual")], EMPTY_IDENTITY, false);
  }

  function startDemo() {
    if (isImportingPdf) {
      return;
    }

    if (
      hasDraft &&
      !window.confirm(
        "예시 이력서로 바꾸시겠습니까? 현재 탭에서 작성한 내용은 사라집니다.",
      )
    ) {
      return;
    }

    clearDocumentInputs();
    setFileNotice(null);
    beginDraft(createDemoCareerEntries(), DEMO_IDENTITY, true);
  }

  function restoreStoredDraft() {
    if (isImportingPdf || storedDraft === null) {
      return;
    }

    clearDocumentInputs();
    setFileNotice(null);
    setCareers(storedDraft.careers);
    setIdentity(storedDraft.identity);
    setIsDemoDraft(storedDraft.isDemoDraft);
    setTalentPoolChoice(storedDraft.talentPoolChoice);
    setHasConfirmedCareers(true);
    moveToStep(2);
  }

  function discardStoredDraft() {
    if (isImportingPdf) {
      return;
    }

    if (
      !window.confirm(
        "이 기기에 저장된 작성 중인 내용을 지우시겠습니까? 되돌릴 수 없습니다.",
      )
    ) {
      return;
    }

    try {
      window.localStorage.removeItem(RESUME_DRAFT_STORAGE_KEY);
      notifyStoredDraftChanged();
    } catch {
      // Nothing to recover from; the state reset below is what the person sees.
    }

    clearDocumentInputs();
    setFileNotice(null);
    setCareers([]);
    setIdentity(EMPTY_IDENTITY);
    setIsDemoDraft(false);
    setTalentPoolChoice("resume-only");
    setHasConfirmedCareers(false);
    moveToStep(1);
  }

  function continueDraft() {
    if (isImportingPdf) {
      return;
    }

    clearDocumentInputs();
    setFileNotice(null);
    moveToStep(2);
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (passwordInputRef.current) {
      passwordInputRef.current.value = "";
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (
      !isPdf ||
      selectedFile.size === 0 ||
      selectedFile.size > MAX_NHIS_PDF_BYTES
    ) {
      selectedPdfRef.current = null;
      setHasSelectedPdf(false);
      event.currentTarget.value = "";
      setFileNotice({
        tone: "error",
        message:
          "10MB 이하의 PDF 파일만 선택할 수 있습니다. 파일은 읽거나 전송하지 않았습니다.",
      });
      return;
    }

    selectedPdfRef.current = selectedFile;
    setHasSelectedPdf(true);
    setFileNotice({
      tone: "neutral",
      message:
        formatFileSize(selectedFile.size) +
        " PDF를 선택했습니다. 아직 파일을 읽거나 전송하지 않았습니다.",
    });
    passwordInputRef.current?.focus();
  }

  async function handlePdfImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isImportingPdf) {
      return;
    }

    const selectedFile = selectedPdfRef.current;
    const password = passwordInputRef.current?.value ?? "";

    if (!selectedFile) {
      setFileNotice({
        tone: "error",
        message: "먼저 PDF 파일을 선택해 주세요.",
      });
      return;
    }

    if (!password) {
      setFileNotice({
        tone: "error",
        message: "PDF 비밀번호를 입력해 주세요.",
      });
      passwordInputRef.current?.focus();
      return;
    }

    if (
      hasDraft &&
      !window.confirm(
        "문서에서 새 이력서를 불러오시겠습니까? 현재 탭에서 작성한 내용은 사라집니다.",
      )
    ) {
      return;
    }

    setIsImportingPdf(true);
    setFileNotice({
      tone: "neutral",
      message: "이 브라우저에서 문서의 근무 이력만 확인하고 있습니다.",
    });

    const result = await importNhisQualificationPdf(selectedFile, password);

    if (passwordInputRef.current) {
      passwordInputRef.current.value = "";
    }

    setIsImportingPdf(false);

    if (result.status === "password-error") {
      setFileNotice({
        tone: "error",
        message: "PDF 비밀번호가 맞지 않습니다. 다시 입력해 주세요.",
      });
      passwordInputRef.current?.focus();
      return;
    }

    clearDocumentInputs();

    if (result.status === "manual-fallback") {
      setFileNotice({
        tone: "error",
        message:
          result.reason === "unsupported-layout"
            ? "현재 진단 중인 국민건강보험공단 직접 발급 양식과 다릅니다. 문서는 저장하지 않았으며 직접 입력으로 계속할 수 있습니다."
            : "이 PDF를 안전하게 읽을 수 없습니다. 문서는 저장하지 않았으며 직접 입력으로 계속할 수 있습니다.",
        manualFallback: true,
      });
      return;
    }

    setFileNotice(null);
    beginDraft(createImportedCareerEntries(result.records), EMPTY_IDENTITY, false);
  }

  function updateCareer(id: string, patch: Partial<CareerEntry>) {
    setCareers((current) =>
      current.map((career) =>
        career.id === id ? { ...career, ...patch } : career,
      ),
    );
  }

  function updateIdentity(patch: Partial<ResumeIdentity>) {
    setIdentity((current) => ({ ...current, ...patch }));
  }

  function addCareer() {
    setCareers((current) => [...current, createBlankCareerEntry("manual")]);
  }

  function confirmCareers() {
    const nextErrors = getCareerErrors(careers);
    setErrors(nextErrors);

    if (nextErrors.length === 0) {
      setHasConfirmedCareers(true);
      moveToStep(3);
    }
  }

  function previewResume() {
    const nextErrors = getEnrichmentErrors(identity, careers);
    setErrors(nextErrors);

    if (nextErrors.length === 0) {
      moveToStep(4);
    }
  }

  function toggleCareerChoice(
    id: string,
    field: "stations" | "responsibilities" | "skills" | "equipment",
    value: string,
    limit?: number,
  ) {
    const career = careers.find((item) => item.id === id);

    if (!career) {
      return;
    }

    updateCareer(id, {
      [field]: toggleBoundedChoice(career[field], value, limit),
    });
  }

  return (
    <div className="app-shell">
      <header className="app-header no-print">
        <a className="brand-lockup" href="#main-content" aria-label="본문으로 이동">
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          <span>
            <strong>Mise en Place</strong>
            <small>Chef career studio</small>
          </span>
        </a>
        <div className="local-status">
          <span className="status-dot" aria-hidden="true" />
          브라우저 안에서만 작성 중
        </div>
      </header>

      <main className="builder-layout" id="main-content">
        <aside className="workflow-rail no-print" aria-label="이력서 작성 단계">
          <div>
            <p className="rail-kicker">YOUR WORKBENCH</p>
            <p className="rail-title">한 번에 한 단계씩 정리합니다.</p>
          </div>

          <ol className="step-list">
            {STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const state =
                stepNumber === currentStep
                  ? "current"
                  : stepNumber < currentStep
                    ? "complete"
                    : "upcoming";

              return (
                <li
                  className={"step-item step-" + state}
                  key={step.title}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  <span className="step-number" aria-hidden="true">
                    {String(stepNumber).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{step.title}</strong>
                    <small>{step.short}</small>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="rail-note">
            <span aria-hidden="true">⌁</span>
            <p>
              {hasConfirmedCareers
                ? "확인하신 근무 이력은 이 브라우저에 저장되어 새로고침해도 남습니다."
                : "확인 전 입력한 내용은 새로고침하면 사라집니다."}
              <br />
              서버에는 저장되지 않습니다.
            </p>
          </div>
        </aside>

        <section
          className={"workspace workspace-step-" + currentStep}
          aria-labelledby="step-heading"
        >
          <header className="workspace-heading no-print">
            <p className="eyebrow">{currentCopy.eyebrow}</p>
            <h1 id="step-heading" ref={headingRef} tabIndex={-1}>
              {currentCopy.title}
            </h1>
            {isDemoDraft ? <span className="demo-tag">예시 이력서</span> : null}
            <p>
              {isManualOnlyDraft
                ? "실제 레스토랑명과 근무 기간을 먼저 확인하고, 법인명은 알고 있을 때만 입력합니다."
                : currentCopy.description}
            </p>
          </header>

          {errors.length > 0 ? (
            <div className="error-summary no-print" role="alert">
              <strong>다음 내용을 확인해 주세요.</strong>
              <ul>
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <section className="start-surface no-print">
              <div className="import-panel">
                <div className="panel-index" aria-hidden="true">
                  01
                </div>
                <div>
                  <p className="panel-kicker">검증 중인 빠른 시작</p>
                  <h2>국민건강보험공단 직접 발급 PDF</h2>
                  <p className="panel-copy">
                    공단에서 직접 발급한 텍스트 PDF 한 양식만 진단합니다.
                    정부24 발급본이나 다른 양식은 직접 입력으로 이어집니다.
                  </p>
                </div>

                <form className="pdf-import-form" onSubmit={handlePdfImport}>
                  <label className="file-picker">
                    <span>{hasSelectedPdf ? "PDF 다시 선택하기" : "PDF 선택하기"}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelection}
                      disabled={isImportingPdf}
                    />
                  </label>

                  <label className="pdf-password-field">
                    <span>PDF 비밀번호</span>
                    <input
                      ref={passwordInputRef}
                      type="password"
                      autoComplete="off"
                      maxLength={128}
                      disabled={isImportingPdf}
                    />
                    <small>직접 발급본에 설정된 비밀번호를 입력해 주세요.</small>
                  </label>

                  <button
                    className="import-button"
                    type="submit"
                    disabled={isImportingPdf}
                  >
                    {isImportingPdf
                      ? "이 브라우저에서 확인 중"
                      : "이 브라우저에서 불러오기"}
                  </button>
                </form>

                {fileNotice ? (
                  <div
                    className={"file-notice file-notice-" + fileNotice.tone}
                    role={fileNotice.tone === "error" ? "alert" : "status"}
                  >
                    {fileNotice.message}
                  </div>
                ) : null}

                {fileNotice?.manualFallback ? (
                  <button
                    className="text-button"
                    type="button"
                    onClick={startManualEntry}
                  >
                    {hasDraft
                        ? "새 이력서로 직접 입력하기"
                        : "직접 입력으로 계속하기"}
                    <span aria-hidden="true">→</span>
                  </button>
                ) : null}
              </div>

              <div className="start-actions">
                <div className="manual-callout">
                  <p className="panel-kicker">문서 없이 시작</p>
                  <h2>기억나는 경력부터 직접 적기</h2>
                  <p>
                    법인명을 몰라도 괜찮습니다. 실제 레스토랑명과 근무
                    시작월부터 입력할 수 있습니다.
                  </p>
                  {!hasDraft && storedDraft ? (
                    <p className="file-notice">
                      이 기기에 저장해 둔 작성 중인 내용이 있습니다. 이력서
                      내용은 이 브라우저에만 저장되고 서버로 전송되지 않습니다.
                      가져오신 서류는 저장되지 않습니다.
                    </p>
                  ) : null}
                  {!hasDraft && storedDraft ? (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={restoreStoredDraft}
                      disabled={isImportingPdf}
                    >
                      저장된 내용 이어가기
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : null}
                  {hasDraft ? (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={continueDraft}
                      disabled={isImportingPdf}
                    >
                      작성 이어가기
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : null}
                  <button
                    className={
                      hasDraft || storedDraft
                        ? "secondary-button"
                        : "primary-button"
                    }
                    type="button"
                    onClick={startManualEntry}
                    disabled={isImportingPdf}
                  >
                    {hasDraft || storedDraft ? "새로 작성하기" : "직접 입력하기"}
                    <span aria-hidden="true">→</span>
                  </button>
                  {storedDraft ? (
                    <button
                      className="text-button"
                      type="button"
                      onClick={discardStoredDraft}
                      disabled={isImportingPdf}
                    >
                      이 기기에서 지우기
                    </button>
                  ) : null}
                </div>

                <button
                  className="demo-button"
                  type="button"
                  onClick={startDemo}
                  disabled={isImportingPdf}
                >
                  <span>
                    <strong>예시 데이터로 흐름 보기</strong>
                    <small>실제 경력으로 오해하지 않도록 계속 표시합니다.</small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>

              <div className="privacy-strip">
                <strong>원본 문서 처리 원칙</strong>
                <ul>
                  <li>PDF와 비밀번호는 현재 탭에서만 처리합니다.</li>
                  <li>서버·로그·분석 도구·AI로 전송하지 않습니다.</li>
                  <li>브라우저 저장소에 남기지 않습니다.</li>
                </ul>
              </div>
            </section>
          ) : null}

          {currentStep === 2 ? (
            <section className="form-stack no-print">
              {careers.map((career, index) => (
                <article
                  className={
                    "career-card" + (career.included ? "" : " is-excluded")
                  }
                  key={career.id}
                >
                  <header className="career-card-header">
                    <div>
                      <span className="career-count">
                        CAREER {String(index + 1).padStart(2, "0")}
                      </span>
                      {career.isDemo ? (
                        <div className="tag-row">
                          <span className="demo-tag">예시 데이터</span>
                        </div>
                      ) : null}
                    </div>
                    <label className="include-toggle">
                      <input
                        type="checkbox"
                        checked={career.included}
                        onChange={(event) =>
                          updateCareer(career.id, {
                            included: event.currentTarget.checked,
                          })
                        }
                      />
                      <span>이 경력 사용</span>
                    </label>
                  </header>

                  <fieldset disabled={!career.included}>
                    <legend className="sr-only">
                      {index + 1}번째 근무 이력
                    </legend>
                    <div className="field-grid">
                      <Field
                        label={getEmployerLabel(career.origin)}
                        provenance={getImportedCareerFieldProvenance(
                          career,
                          "legalEmployer",
                        )}
                        hint={
                          career.origin === "manual"
                            ? "알고 있다면 입력하세요."
                            : "수정해도 원문 값은 별도로 보존합니다."
                        }
                      >
                        <input
                          type="text"
                          value={career.legalEmployer}
                          onChange={(event) =>
                            updateCareer(career.id, {
                              legalEmployer: event.currentTarget.value,
                            })
                          }
                          autoComplete="organization"
                        />
                      </Field>

                      <Field label="실제 레스토랑명" required>
                        <input
                          type="text"
                          value={career.restaurantName}
                          onChange={(event) =>
                            updateCareer(career.id, {
                              restaurantName: event.currentTarget.value,
                            })
                          }
                          autoComplete="organization"
                        />
                      </Field>
                    </div>

                    <div
                      className={
                        "date-section" +
                        (career.origin === "manual" ? " date-section-single" : "")
                      }
                    >
                      {career.origin === "document" ? (
                        <div>
                          <p className="date-section-title">
                            건강보험 자격일
                            <span>문서 값과 수정 여부를 구분합니다.</span>
                          </p>
                          <div className="date-grid">
                            <Field
                              label="자격 취득일"
                              provenance={getImportedCareerFieldProvenance(
                                career,
                                "qualificationStart",
                              )}
                            >
                              <input
                                type="date"
                                value={career.qualificationStart}
                                onChange={(event) =>
                                  updateCareer(career.id, {
                                    qualificationStart:
                                      event.currentTarget.value,
                                  })
                                }
                              />
                            </Field>
                            <Field
                              label="자격 상실일"
                              provenance={getImportedCareerFieldProvenance(
                                career,
                                "qualificationEnd",
                              )}
                            >
                              <input
                                type="date"
                                value={career.qualificationEnd}
                                onChange={(event) =>
                                  updateCareer(career.id, {
                                    qualificationEnd: event.currentTarget.value,
                                  })
                                }
                              />
                            </Field>
                          </div>
                        </div>
                      ) : null}

                      <div>
                        <p className="date-section-title">
                          실제 근무 기간
                          <span>본인이 확인하는 정보입니다.</span>
                        </p>
                        <div className="date-grid">
                          <Field label="근무 시작월" required>
                            <input
                              type="month"
                              value={career.employmentStart}
                              onChange={(event) =>
                                updateCareer(career.id, {
                                  employmentStart: event.currentTarget.value,
                                })
                              }
                            />
                          </Field>
                          <Field
                            label="근무 종료월"
                            hint="재직 중이면 비워 두세요."
                          >
                            <input
                              type="month"
                              value={career.employmentEnd}
                              onChange={(event) =>
                                updateCareer(career.id, {
                                  employmentEnd: event.currentTarget.value,
                                })
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </article>
              ))}

              <button className="add-career-button" type="button" onClick={addCareer}>
                <span aria-hidden="true">＋</span>
                근무 이력 추가하기
              </button>

              {hasConfirmedCareers ? null : (
                <p className="file-notice">
                  다음 단계로 넘어가면 확인하신 내용이 이 기기의 브라우저에
                  저장되어, 창을 닫았다 열어도 이어서 쓰실 수 있습니다. 서버로는
                  전송되지 않고, 시작 화면에서 언제든 지우실 수 있습니다.
                </p>
              )}

              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => moveToStep(1)}
                >
                  이전
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={confirmCareers}
                >
                  요리 경력 보완하기
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>
          ) : null}

          {currentStep === 3 ? (
            <section className="form-stack no-print">
              <article className="identity-card">
                <header>
                  <p className="career-count">RESUME HEADER</p>
                  <h2>이력서에서 가장 먼저 보일 정보</h2>
                </header>
                <div className="field-grid">
                  <Field label="이름" required>
                    <input
                      type="text"
                      value={identity.name}
                      onChange={(event) =>
                        updateIdentity({ name: event.currentTarget.value })
                      }
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="이력서 제목" required>
                    <input
                      type="text"
                      list="role-suggestions"
                      value={identity.headline}
                      onChange={(event) =>
                        updateIdentity({ headline: event.currentTarget.value })
                      }
                      placeholder="예: Chef de Partie"
                    />
                  </Field>
                  <Field label="이메일">
                    <input
                      type="email"
                      value={identity.email}
                      onChange={(event) =>
                        updateIdentity({ email: event.currentTarget.value })
                      }
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="연락처">
                    <input
                      type="tel"
                      value={identity.phone}
                      onChange={(event) =>
                        updateIdentity({ phone: event.currentTarget.value })
                      }
                      autoComplete="tel"
                    />
                  </Field>
                </div>
                <Field
                  label="경력 요약"
                  hint="직접 확인할 수 있는 사실만 간단히 적어 주세요."
                >
                  <textarea
                    rows={4}
                    value={identity.summary}
                    onChange={(event) =>
                      updateIdentity({ summary: event.currentTarget.value })
                    }
                    placeholder="예: 이탈리안 다이닝 주방 경력 4년. 핫·파스타 스테이션을 독립 운영했습니다."
                  />
                </Field>
              </article>

              {includedCareers.map((career, index) => (
                <article className="career-editor" key={career.id}>
                  <header className="career-editor-header">
                    <div>
                      <span className="career-count">
                        KITCHEN {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2>{career.restaurantName}</h2>
                      <p>
                        {formatMonthRange(
                          career.employmentStart,
                          career.employmentEnd,
                        )}
                      </p>
                    </div>
                    <ProvenanceTag kind="confirmed" />
                  </header>

                  <Field label="직책" required>
                    <input
                      type="text"
                      list="role-suggestions"
                      value={career.role}
                      onChange={(event) =>
                        updateCareer(career.id, {
                          role: event.currentTarget.value,
                        })
                      }
                      placeholder="목록에서 고르거나 직접 입력하세요."
                    />
                  </Field>

                  <ChoiceGroup
                    legend="독립적으로 맡았던 스테이션"
                    options={STATION_OPTIONS}
                    selected={career.stations}
                    onToggle={(option) =>
                      toggleCareerChoice(career.id, "stations", option)
                    }
                    hint="여러 개 선택할 수 있습니다."
                  />

                  <ChoiceGroup
                    legend="주요 업무"
                    options={RESPONSIBILITY_OPTIONS}
                    selected={career.responsibilities}
                    onToggle={(option) =>
                      toggleCareerChoice(
                        career.id,
                        "responsibilities",
                        option,
                        3,
                      )
                    }
                    limit={3}
                    hint={career.responsibilities.length + "/3 선택"}
                  />

                  <ChoiceGroup
                    legend="다뤄본 기술"
                    options={SKILL_OPTIONS}
                    selected={career.skills}
                    onToggle={(option) =>
                      toggleCareerChoice(career.id, "skills", option)
                    }
                    hint="실제로 사용해 본 항목만 선택하세요."
                  />

                  <ChoiceGroup
                    legend="다뤄본 장비"
                    options={EQUIPMENT_OPTIONS}
                    selected={career.equipment}
                    onToggle={(option) =>
                      toggleCareerChoice(career.id, "equipment", option)
                    }
                    hint="실제로 사용해 본 항목만 선택하세요."
                  />

                  <Field
                    label="대표 경험"
                    hint="성과를 부풀리지 않고 본인이 설명할 수 있는 경험을 적어 주세요."
                  >
                    <textarea
                      rows={4}
                      value={career.representativeExperience}
                      onChange={(event) =>
                        updateCareer(career.id, {
                          representativeExperience:
                            event.currentTarget.value,
                        })
                      }
                      placeholder="예: 디너 서비스에서 파스타 스테이션을 독립 운영하고 계절 메뉴 테스트를 보조했습니다."
                    />
                  </Field>
                </article>
              ))}

              <datalist id="role-suggestions">
                {ROLE_SUGGESTIONS.map((role) => (
                  <option value={role} key={role} />
                ))}
              </datalist>

              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => moveToStep(2)}
                >
                  이전
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={previewResume}
                >
                  이력서 미리보기
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>
          ) : null}

          {currentStep === 4 ? (
            <section className="preview-stack">
              <div className="preview-actions no-print">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => moveToStep(3)}
                >
                  내용 수정하기
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => window.print()}
                >
                  인쇄 · PDF 저장
                  <span aria-hidden="true">↗</span>
                </button>
              </div>

              <article className="resume-sheet" data-print-root>
                <header className="resume-header">
                  <div>
                    <p className="resume-label">
                      CULINARY RESUME{" "}
                      {isDemoDraft ? (
                        <span className="demo-tag">예시 이력서</span>
                      ) : null}
                    </p>
                    <h2>{identity.name}</h2>
                    <p className="resume-headline">{identity.headline}</p>
                  </div>
                  {identity.email || identity.phone ? (
                    <address>
                      {identity.email ? <span>{identity.email}</span> : null}
                      {identity.phone ? <span>{identity.phone}</span> : null}
                    </address>
                  ) : null}
                </header>

                {identity.summary ? (
                  <section className="resume-section resume-summary">
                    <h3>경력 요약</h3>
                    <p>{identity.summary}</p>
                    <ProvenanceTag kind="authored" />
                  </section>
                ) : null}

                <section className="resume-section">
                  <h3>경력</h3>
                  <div className="resume-careers">
                    {includedCareers.map((career) => (
                      <article className="resume-career" key={career.id}>
                        <header>
                          <div>
                            <h4>{career.restaurantName}</h4>
                            <p>
                              {career.role} ·{" "}
                              {formatMonthRange(
                                career.employmentStart,
                                career.employmentEnd,
                              )}
                            </p>
                            {career.legalEmployer ? (
                              <small className="resume-employer">
                                <span>
                                  {getEmployerLabel(career.origin)}:{" "}
                                  {career.legalEmployer}
                                </span>
                                {career.origin === "document" ? (
                                  <ProvenanceTag
                                    kind={getImportedCareerFieldProvenance(
                                      career,
                                      "legalEmployer",
                                    )}
                                  />
                                ) : null}
                              </small>
                            ) : null}
                          </div>
                          <div className="resume-provenance">
                            {career.isDemo ? (
                              <span className="demo-tag">예시 데이터</span>
                            ) : null}
                            <ProvenanceTag kind="confirmed" />
                          </div>
                        </header>

                        <ul className="resume-bullets">
                          {career.responsibilities.map((responsibility) => (
                            <li key={responsibility}>{responsibility}</li>
                          ))}
                          {career.representativeExperience ? (
                            <li>{career.representativeExperience}</li>
                          ) : null}
                        </ul>

                        {career.stations.length > 0 ||
                        career.skills.length > 0 ||
                        career.equipment.length > 0 ? (
                          <dl className="resume-skills">
                            {career.stations.length > 0 ? (
                              <div>
                                <dt>Station</dt>
                                <dd>{career.stations.join(" · ")}</dd>
                              </div>
                            ) : null}
                            {career.skills.length > 0 ? (
                              <div>
                                <dt>Skills</dt>
                                <dd>{career.skills.join(" · ")}</dd>
                              </div>
                            ) : null}
                            {career.equipment.length > 0 ? (
                              <div>
                                <dt>Equipment</dt>
                                <dd>{career.equipment.join(" · ")}</dd>
                              </div>
                            ) : null}
                          </dl>
                        ) : null}
                        <ProvenanceTag kind="authored" />
                      </article>
                    ))}
                  </div>
                </section>
              </article>

              <fieldset className="talent-pool-panel no-print">
                <legend>이력서 완성 후 선택</legend>
                <h2>검증된 레스토랑에 프로필을 공개하시겠습니까?</h2>
                <p>
                  이 선택은 이력서 작성과 별개입니다. 현재 프로토타입에서는
                  선택도 서버로 전송하지 않습니다.
                </p>
                <div className="talent-options">
                  {TALENT_POOL_OPTIONS.map((option) => (
                    <label
                      className={
                        "talent-option" +
                        (talentPoolChoice === option.value
                          ? " is-selected"
                          : "")
                      }
                      key={option.value}
                    >
                      <input
                        type="radio"
                        name="talent-pool"
                        value={option.value}
                        checked={talentPoolChoice === option.value}
                        onChange={() => setTalentPoolChoice(option.value)}
                      />
                      <span>
                        <strong>{option.title}</strong>
                        <small>{option.description}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>
          ) : null}
        </section>
      </main>

      <footer className="app-footer no-print">
        <span>Mise en Place · Resume prototype</span>
        <span>원본 문서 비저장 · 기본 비공개</span>
      </footer>
    </div>
  );
}
