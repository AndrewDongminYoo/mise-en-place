"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import {
  PROVENANCE_LABELS,
  RESPONSIBILITY_OPTIONS,
  ROLE_SUGGESTIONS,
  SKILL_OPTIONS,
  STATION_OPTIONS,
  createBlankCareerEntry,
  createDemoCareerEntries,
  formatMonthRange,
  getCareerErrors,
  getEmployerLabel,
  getEnrichmentErrors,
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
  children,
  required,
}: {
  label: string;
  hint?: string;
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
  } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(currentStep);

  useEffect(() => {
    if (previousStep.current === currentStep) {
      return;
    }

    previousStep.current = currentStep;
    headingRef.current?.focus();
  }, [currentStep]);

  const currentCopy = STEP_COPY[currentStep - 1];
  const includedCareers = careers.filter((career) => career.included);
  const hasDraft = careers.length > 0;
  const isManualOnlyDraft =
    currentStep === 2 && careers.every((career) => career.origin === "manual");

  function moveToStep(step: number) {
    setErrors([]);
    setCurrentStep(step);
  }

  function startManualEntry() {
    if (
      hasDraft &&
      !window.confirm(
        "새 이력서로 시작하시겠습니까? 현재 탭에서 작성한 내용은 사라집니다.",
      )
    ) {
      return;
    }

    setCareers([createBlankCareerEntry("manual")]);
    setIdentity(EMPTY_IDENTITY);
    setIsDemoDraft(false);
    setTalentPoolChoice("resume-only");
    moveToStep(2);
  }

  function startDemo() {
    if (
      hasDraft &&
      !window.confirm(
        "예시 이력서로 바꾸시겠습니까? 현재 탭에서 작성한 내용은 사라집니다.",
      )
    ) {
      return;
    }

    setCareers(createDemoCareerEntries());
    setIdentity(DEMO_IDENTITY);
    setIsDemoDraft(true);
    setTalentPoolChoice("resume-only");
    moveToStep(2);
  }

  function continueDraft() {
    moveToStep(2);
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0];

    if (!selectedFile) {
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");
    const fileDescription =
      selectedFile.name + " · " + formatFileSize(selectedFile.size);

    event.currentTarget.value = "";

    if (!isPdf) {
      setFileNotice({
        tone: "error",
        message:
          "PDF 파일만 선택할 수 있습니다. 파일은 읽거나 전송하지 않았습니다.",
      });
      return;
    }

    setFileNotice({
      tone: "neutral",
      message:
        fileDescription +
        "을 선택했습니다. 이번 프로토타입은 문서 내용을 읽지 않으므로, 원본을 보관하지 않고 직접 입력으로 이어갑니다.",
    });
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
    field: "stations" | "responsibilities" | "skills",
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
              입력한 내용은 새로고침하면 사라집니다.
              <br />
              아직 서버 저장 기능이 없습니다.
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
                  <p className="panel-kicker">가장 빠른 시작</p>
                  <h2>건강보험 자격득실확인서 PDF</h2>
                  <p className="panel-copy">
                    텍스트를 읽을 수 있는 지원 양식을 정하기 전까지 자동
                    추출을 흉내 내지 않습니다. 이번 버전은 파일을 읽지 않고
                    직접 입력으로 이어집니다.
                  </p>
                </div>

                <label className="file-picker">
                  <span>PDF 선택하기</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelection}
                  />
                </label>

                {fileNotice ? (
                  <div
                    className={"file-notice file-notice-" + fileNotice.tone}
                    role={fileNotice.tone === "error" ? "alert" : "status"}
                  >
                    {fileNotice.message}
                  </div>
                ) : null}

                {fileNotice?.tone === "neutral" ? (
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
                  {hasDraft ? (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={continueDraft}
                    >
                      작성 이어가기
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : null}
                  <button
                    className={hasDraft ? "secondary-button" : "primary-button"}
                    type="button"
                    onClick={startManualEntry}
                  >
                    {hasDraft ? "새로 작성하기" : "직접 입력하기"}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>

                <button className="demo-button" type="button" onClick={startDemo}>
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
                  <li>서버로 전송하지 않습니다.</li>
                  <li>브라우저 저장소에 남기지 않습니다.</li>
                  <li>AI와 분석 도구에 전달하지 않습니다.</li>
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
                      <div className="tag-row">
                        {career.isDemo ? (
                          <span className="demo-tag">예시 데이터</span>
                        ) : null}
                        {career.origin === "document" ? (
                          <ProvenanceTag kind="imported" />
                        ) : (
                          <ProvenanceTag kind="authored" />
                        )}
                      </div>
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
                        hint={
                          career.origin === "manual"
                            ? "알고 있다면 입력하세요."
                            : "원문을 보존하는 필드입니다."
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
                            <span>문서에서 불러온 정보입니다.</span>
                          </p>
                          <div className="date-grid">
                            <Field label="자격 취득월">
                              <input
                                type="month"
                                value={career.qualificationStart}
                                onChange={(event) =>
                                  updateCareer(career.id, {
                                    qualificationStart:
                                      event.currentTarget.value,
                                  })
                                }
                              />
                            </Field>
                            <Field label="자격 상실월">
                              <input
                                type="month"
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
                    legend="다뤄본 기술과 장비"
                    options={SKILL_OPTIONS}
                    selected={career.skills}
                    onToggle={(option) =>
                      toggleCareerChoice(career.id, "skills", option)
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
                              <small>
                                {getEmployerLabel(career.origin)}:{" "}
                                {career.legalEmployer}
                              </small>
                            ) : null}
                          </div>
                          <div className="resume-provenance">
                            {career.isDemo ? (
                              <span className="demo-tag">예시 데이터</span>
                            ) : null}
                            {career.origin === "document" ? (
                              <ProvenanceTag kind="imported" />
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
                        career.skills.length > 0 ? (
                          <dl className="resume-skills">
                            {career.stations.length > 0 ? (
                              <div>
                                <dt>Station</dt>
                                <dd>{career.stations.join(" · ")}</dd>
                              </div>
                            ) : null}
                            {career.skills.length > 0 ? (
                              <div>
                                <dt>Skills & Equipment</dt>
                                <dd>{career.skills.join(" · ")}</dd>
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
