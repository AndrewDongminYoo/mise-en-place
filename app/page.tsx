"use client";

/* eslint-disable @next/next/no-img-element -- Local Blob URLs cannot use server image optimization. */

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
import { flushSync } from "react-dom";

import {
  MAX_NHIS_PDF_BYTES,
  importNhisQualificationPdf,
} from "./nhis-parser.mts";

import {
  clearPhotoAssets,
  deleteLocalDraftAndPhotos,
  deleteOrphanedPhotoAssets,
  deletePhotoAsset,
  getPhotoAssets,
  savePhotoAsset,
  type LocalPhotoAsset,
} from "./local-photo-store.mts";

import { normalizePhoto } from "./photo-normalizer.mts";

import { ProvenanceTag } from "./provenance-tag";

import { ResumeSheet } from "./resume-sheet";

import {
  CULINARY_SPECIALTY_OPTIONS,
  PROVENANCE_LABELS,
  RESPONSIBILITY_OPTIONS,
  RESUME_DRAFT_STORAGE_KEY,
  ROLE_SUGGESTIONS,
  addCustomChoice,
  appendCareerPhoto,
  collectReferencedPhotoIds,
  createBlankCareerEntry,
  createDemoCareerEntries,
  createImportedCareerEntries,
  formatMonthRange,
  getCareerErrors,
  getCareerPhotoDescriptionError,
  getCulinaryChoiceGroups,
  getEnrichmentErrors,
  parseResumeDraft,
  removeCareerPhotoReference,
  removeMissingPhotoReferences,
  selectCareerResumePhoto,
  serializeResumeDraft,
  summarizeIncludedCareers,
  toReviewIdentity,
  toggleBoundedChoice,
  toggleCulinarySpecialty,
  type CareerEntry,
  type CulinaryChoiceGroup,
  type CulinaryChoiceKind,
  type CulinarySpecialty,
  type ResumeIdentity,
  type ResumeDraft,
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
      "공공기록은 원본 근거로 따로 보존하고, 레스토랑명과 실제 근무 기간은 가져온 값에서 필요한 부분만 고칩니다.",
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
  profilePhotoId: null,
};

const DEMO_IDENTITY: ResumeIdentity = {
  name: "유동민",
  headline: "Chef de Partie",
  email: "chef@example.com",
  phone: "010-0000-0000",
  summary:
    "이탈리안 다이닝 주방에서 핫·파스타 스테이션을 운영했으며, 계절 메뉴 테스트와 레시피 표준화에 참여했습니다.",
  profilePhotoId: null,
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

const PHOTO_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

type DisplayPhotoAsset = LocalPhotoAsset & {
  objectUrl: string;
};

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

function SpecialtyChoiceGroup({
  selected,
  onToggle,
}: {
  selected: readonly CulinarySpecialty[];
  onToggle: (value: CulinarySpecialty) => void;
}) {
  return (
    <fieldset className="choice-field">
      <legend>경력 분야</legend>
      <span className="choice-hint field-hint">
        관련된 분야를 모두 선택할 수 있습니다. 한 분야는 남겨 둡니다.
      </span>
      <div className="specialty-grid">
        {CULINARY_SPECIALTY_OPTIONS.map((option) => {
          const checked = selected.includes(option.value);

          return (
            <label
              className={
                "specialty-option" + (checked ? " is-selected" : "")
              }
              key={option.value}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function GroupedChoiceGroup({
  legend,
  groups,
  selected,
  onToggle,
  onAdd,
  customPlaceholder,
  hint,
}: {
  legend: string;
  groups: readonly CulinaryChoiceGroup[];
  selected: readonly string[];
  onToggle: (option: string) => void;
  onAdd: (option: string) => void;
  customPlaceholder: string;
  hint: string;
}) {
  const suggested = new Set(groups.flatMap((group) => group.options));
  const additional = selected.filter((option) => !suggested.has(option));

  function submitCustomChoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("customChoice");

    if (!(input instanceof HTMLInputElement) || !input.value.trim()) {
      return;
    }

    onAdd(input.value);
    form.reset();
  }

  return (
    <fieldset className="choice-field">
      <legend>{legend}</legend>
      <span className="choice-hint field-hint">{hint}</span>
      <div className="taxonomy-groups">
        {groups.map((group) => (
          <section className="taxonomy-group" key={group.label}>
            <h3>{group.label}</h3>
            <div className="choice-grid">
              {group.options.map((option) => {
                const checked = selected.includes(option);

                return (
                  <label
                    className={
                      "choice-chip" + (checked ? " is-selected" : "")
                    }
                    key={option}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(option)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        {additional.length > 0 ? (
          <section className="taxonomy-group taxonomy-additional">
            <h3>직접 입력·기존 선택</h3>
            <div className="choice-grid">
              {additional.map((option) => (
                <label className="choice-chip is-selected" key={option}>
                  <input
                    type="checkbox"
                    checked
                    onChange={() => onToggle(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <form className="custom-choice-form" onSubmit={submitCustomChoice}>
        <input
          type="text"
          name="customChoice"
          maxLength={40}
          placeholder={customPlaceholder}
          aria-label={customPlaceholder}
        />
        <button className="secondary-button" type="submit">
          직접 입력 추가
        </button>
      </form>
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

function writeStoredDraft(draft: ResumeDraft): boolean {
  try {
    window.localStorage.setItem(
      RESUME_DRAFT_STORAGE_KEY,
      serializeResumeDraft(draft),
    );
    notifyStoredDraftChanged();
    return true;
  } catch {
    return false;
  }
}

async function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete) {
    if (image.naturalWidth > 0) {
      return;
    }

    throw new Error("사진을 불러오지 못했습니다.");
  }

  if (typeof image.decode === "function") {
    await image.decode();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error("사진을 불러오지 못했습니다.")),
      { once: true },
    );
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function toDisplayPhotoAsset(asset: LocalPhotoAsset): DisplayPhotoAsset {
  return { ...asset, objectUrl: URL.createObjectURL(asset.blob) };
}

function revokeDisplayPhotoAssets(
  assets: ReadonlyMap<string, DisplayPhotoAsset>,
) {
  assets.forEach((asset) => URL.revokeObjectURL(asset.objectUrl));
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [careers, setCareers] = useState<CareerEntry[]>([]);
  const [identity, setIdentity] = useState<ResumeIdentity>(EMPTY_IDENTITY);
  const [isDemoDraft, setIsDemoDraft] = useState(false);
  const [talentPoolChoice, setTalentPoolChoice] =
    useState<TalentPoolChoice>("resume-only");
  const [showCareerSummary, setShowCareerSummary] = useState(true);
  // The summary band ends a current career at this month. A lazy initializer
  // reads the clock once, which keeps the render itself pure.
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [fileNotice, setFileNotice] = useState<{
    tone: "neutral" | "error";
    message: string;
    manualFallback?: boolean;
  } | null>(null);
  const [hasSelectedPdf, setHasSelectedPdf] = useState(false);
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [hasConfirmedCareers, setHasConfirmedCareers] = useState(false);
  const [isReviewExport, setIsReviewExport] = useState(false);
  const [photoAssets, setPhotoAssets] = useState<
    Map<string, DisplayPhotoAsset>
  >(
    () => new Map(),
  );
  const [photoOperation, setPhotoOperation] = useState<string | null>(null);
  const [hasPendingPhotoClear, setHasPendingPhotoClear] = useState(false);
  const storedDraftRaw = useSyncExternalStore(
    subscribeToStoredDraft,
    readStoredDraft,
    () => null,
  );
  const storedDraft = useMemo(
    () => parseResumeDraft(storedDraftRaw),
    [storedDraftRaw],
  );
  const currentDraft = useMemo<ResumeDraft>(
    () => ({
      careers,
      identity,
      isDemoDraft,
      talentPoolChoice,
      showCareerSummary,
    }),
    [careers, identity, isDemoDraft, talentPoolChoice, showCareerSummary],
  );
  const currentDraftRaw = useMemo(
    () => serializeResumeDraft(currentDraft),
    [currentDraft],
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const selectedPdfRef = useRef<File | null>(null);
  const previousStep = useRef(currentStep);
  const resumeSheetRef = useRef<HTMLElement>(null);
  const initializedPhotoStore = useRef(false);
  const photoAssetsRef = useRef(photoAssets);
  const careersRef = useRef(careers);
  const identityRef = useRef(identity);

  useEffect(() => {
    careersRef.current = careers;
    identityRef.current = identity;
  }, [careers, identity]);

  useEffect(() => {
    if (previousStep.current === currentStep) {
      return;
    }

    previousStep.current = currentStep;
    headingRef.current?.focus();
  }, [currentStep]);

  useEffect(() => {
    if (errors.length === 0) {
      return;
    }

    errorSummaryRef.current?.focus();
  }, [errors]);

  useEffect(() => {
    if (!hasConfirmedCareers || careers.length === 0) {
      return;
    }

    if (!writeStoredDraft(currentDraft)) {
      // Storage can be unavailable in a private window or with site data
      // blocked. Nothing is notified, so whatever was already on the device
      // stays the snapshot, which is why `draftIsStored` below compares that
      // snapshot against this draft instead of only checking it exists.
    }
  }, [hasConfirmedCareers, careers.length, currentDraft]);

  useEffect(() => {
    if (initializedPhotoStore.current) {
      return;
    }

    initializedPhotoStore.current = true;
    const savedDraft = parseResumeDraft(readStoredDraft());
    const referencedIds = savedDraft
      ? collectReferencedPhotoIds(savedDraft)
      : [];

    void deleteOrphanedPhotoAssets(referencedIds).catch(() => {
      setErrors([
        "이 기기에 남은 사진을 정리하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
      ]);
    });
  }, []);

  useEffect(
    () => () => {
      selectedPdfRef.current = null;

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (passwordInputRef.current) {
        passwordInputRef.current.value = "";
      }

      revokeDisplayPhotoAssets(photoAssetsRef.current);
    },
    [],
  );

  // Compare what is on the device against this draft, not merely that
  // something is stored. A failed write leaves an earlier draft in place, so
  // an existence check would keep promising a reload is safe while the newest
  // work is exactly the part that was never saved.
  const draftIsStored =
    hasConfirmedCareers && storedDraftRaw === currentDraftRaw;
  // The review copy renders from a stripped identity rather than from an
  // edited draft, so the person keeps their own name while the sheet that
  // leaves the device carries none.
  const sheetIdentity = isReviewExport
    ? toReviewIdentity(identity)
    : identity;
  const currentCopy = STEP_COPY[currentStep - 1];
  const includedCareers = useMemo(
    () => careers.filter((career) => career.included),
    [careers],
  );
  const photoUrls = useMemo(
    () =>
      new Map(
        [...photoAssets].map(([id, asset]) => [id, asset.objectUrl] as const),
      ),
    [photoAssets],
  );
  const careerSummary = useMemo(
    () => summarizeIncludedCareers(includedCareers, { today: currentMonth }),
    [includedCareers, currentMonth],
  );
  const hasDraft = careers.length > 0;
  const isManualOnlyDraft =
    currentStep === 2 && careers.every((career) => career.origin === "manual");

  function replaceDisplayedPhotoAssets(
    nextAssets: Map<string, DisplayPhotoAsset>,
  ) {
    photoAssetsRef.current = nextAssets;
    setPhotoAssets(nextAssets);
  }

  function releaseDisplayedPhotoAssets() {
    revokeDisplayPhotoAssets(photoAssetsRef.current);
    replaceDisplayedPhotoAssets(new Map());
  }

  function moveToStep(step: number) {
    setErrors([]);
    // The review copy is a mode that lasts one print. `afterprint` ends it,
    // but a browser that never fires the event would leave the sheet stripped
    // for the next print too, so leaving the step ends it as well.
    setIsReviewExport(false);
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

  /**
   * Prints the resume the person keeps, with their name and contact details.
   *
   * Asserts the mode rather than assuming it, so a review copy whose
   * `afterprint` never arrived cannot make this button print a stripped sheet.
   */
  async function prepareResumeImagesForPrint(): Promise<boolean> {
    const images = resumeSheetRef.current?.querySelectorAll("img") ?? [];

    try {
      await Promise.all([...images].map((image) => waitForImage(image)));
      return true;
    } catch {
      setErrors([
        "사진을 불러오지 못해 PDF를 만들 수 없습니다. 해당 사진을 다시 선택해 주세요.",
      ]);
      return false;
    }
  }

  async function printResume() {
    flushSync(() => setIsReviewExport(false));

    if (!(await prepareResumeImagesForPrint())) {
      return;
    }

    window.print();
  }

  /**
   * Prints the resume without the fields that name the person.
   *
   * The omission has to be on screen before the print snapshot is taken, and
   * React batches an event handler's updates, so the state change is flushed
   * rather than left to the next render. `afterprint` puts the name back,
   * which also covers the browsers where `window.print` returns immediately
   * instead of blocking until the dialog closes.
   */
  async function printReviewCopy() {
    function restore() {
      window.removeEventListener("afterprint", restore);
      flushSync(() => setIsReviewExport(false));
    }

    window.addEventListener("afterprint", restore);
    flushSync(() => setIsReviewExport(true));

    if (!(await prepareResumeImagesForPrint())) {
      window.removeEventListener("afterprint", restore);
      flushSync(() => setIsReviewExport(false));
      return;
    }

    window.print();
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
    setShowCareerSummary(true);
    releaseDisplayedPhotoAssets();
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

  async function restoreStoredDraft() {
    if (isImportingPdf || storedDraft === null) {
      return;
    }

    setPhotoOperation("restore");

    try {
      const referencedIds = collectReferencedPhotoIds(storedDraft);
      const restoredAssets = await getPhotoAssets(referencedIds);
      const missingIds = referencedIds.filter(
        (id) => !restoredAssets.has(id),
      );
      const restoredDraft = removeMissingPhotoReferences(
        storedDraft,
        missingIds,
      );

      clearDocumentInputs();
      setFileNotice(null);
      setCareers(restoredDraft.careers);
      setIdentity(restoredDraft.identity);
      setIsDemoDraft(restoredDraft.isDemoDraft);
      setTalentPoolChoice(restoredDraft.talentPoolChoice);
      setShowCareerSummary(restoredDraft.showCareerSummary);
      revokeDisplayPhotoAssets(photoAssetsRef.current);
      replaceDisplayedPhotoAssets(
        new Map(
          [...restoredAssets].map(([id, asset]) => [
            id,
            toDisplayPhotoAsset(asset),
          ]),
        ),
      );
      setHasConfirmedCareers(true);
      moveToStep(2);

      if (missingIds.length > 0) {
        writeStoredDraft(restoredDraft);
        setErrors([
          "사진 일부를 이 브라우저에서 찾지 못해 제외했습니다.",
        ]);
      }

      await deleteOrphanedPhotoAssets(
        collectReferencedPhotoIds(restoredDraft),
      );
    } catch {
      setErrors([
        "저장된 사진을 복원하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
      ]);
    } finally {
      setPhotoOperation(null);
    }
  }

  async function discardStoredDraft() {
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

    setPhotoOperation("discard");
    let draftRemoved = false;

    try {
      await deleteLocalDraftAndPhotos(
        () => {
          window.localStorage.removeItem(RESUME_DRAFT_STORAGE_KEY);
          draftRemoved = true;
        },
        () => clearPhotoAssets(),
      );
      setHasPendingPhotoClear(false);
      notifyStoredDraftChanged();
    } catch {
      setHasPendingPhotoClear(draftRemoved);
      setErrors([
        "초안과 사진을 모두 삭제하지 못했습니다. 다시 시도해 주세요.",
      ]);
      setPhotoOperation(null);
      return;
    }

    // Deletes what is on the device and nothing else. The confirmation asked
    // only about the stored copy, so a draft the person is in the middle of
    // writing stays on screen. Dropping the flag is what stops the save effect
    // from writing it straight back.
    const clearedDraft = removeMissingPhotoReferences(
      currentDraft,
      collectReferencedPhotoIds(currentDraft),
    );
    setCareers(clearedDraft.careers);
    setIdentity(clearedDraft.identity);
    releaseDisplayedPhotoAssets();
    setHasConfirmedCareers(false);
    setPhotoOperation(null);
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

  function updateEmploymentStatus(id: string, isCurrent: boolean) {
    setCareers((current) =>
      current.map((career) => {
        if (career.id === id) {
          return {
            ...career,
            isCurrent,
            employmentEnd: isCurrent ? "" : career.employmentEnd,
          };
        }

        return isCurrent && career.isCurrent
          ? { ...career, isCurrent: false }
          : career;
      }),
    );
  }

  function updateIdentity(patch: Partial<ResumeIdentity>) {
    setIdentity((current) => ({ ...current, ...patch }));
  }

  function persistPhotoDraft(
    nextCareers: CareerEntry[],
    nextIdentity: ResumeIdentity,
  ): boolean {
    return writeStoredDraft({
      careers: nextCareers,
      identity: nextIdentity,
      isDemoDraft,
      talentPoolChoice,
      showCareerSummary,
    });
  }

  async function handleProfilePhotoSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";

    if (!file || photoOperation) {
      return;
    }

    setPhotoOperation("profile");
    setErrors([]);
    let savedAsset: LocalPhotoAsset | null = null;

    try {
      const normalized = await normalizePhoto(file);
      savedAsset = await savePhotoAsset(normalized);
      const latestCareers = careersRef.current;
      const latestIdentity = identityRef.current;
      const previousId = latestIdentity.profilePhotoId;
      const nextIdentity = {
        ...latestIdentity,
        profilePhotoId: savedAsset.id,
      };

      if (!persistPhotoDraft(latestCareers, nextIdentity)) {
        await deletePhotoAsset(savedAsset.id).catch(() => undefined);
        throw new Error(
          "사진을 초안에 연결하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
        );
      }

      setIdentity(nextIdentity);
      const nextAssets = new Map(photoAssetsRef.current);

      if (previousId) {
        const previousAsset = nextAssets.get(previousId);
        if (previousAsset) {
          URL.revokeObjectURL(previousAsset.objectUrl);
        }
        nextAssets.delete(previousId);
      }

      nextAssets.set(savedAsset.id, toDisplayPhotoAsset(savedAsset));
      replaceDisplayedPhotoAssets(nextAssets);

      if (previousId) {
        await deletePhotoAsset(previousId).catch(() => undefined);
      }
    } catch (error) {
      setErrors([
        getErrorMessage(error, "프로필 사진을 추가하지 못했습니다."),
      ]);
    } finally {
      setPhotoOperation(null);
    }
  }

  async function handleCareerPhotoSelection(
    careerId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";

    if (!file || photoOperation) {
      return;
    }

    const career = careersRef.current.find((item) => item.id === careerId);

    if (!career) {
      return;
    }

    setPhotoOperation(`career-${careerId}`);
    setErrors([]);
    let savedAsset: LocalPhotoAsset | null = null;

    try {
      const normalized = await normalizePhoto(file);
      savedAsset = await savePhotoAsset(normalized);
      const latestCareers = careersRef.current;
      const latestCareer = latestCareers.find((item) => item.id === careerId);

      if (!latestCareer) {
        await deletePhotoAsset(savedAsset.id).catch(() => undefined);
        savedAsset = null;
        throw new Error("사진을 연결할 경력을 찾지 못했습니다.");
      }

      const nextCareer = appendCareerPhoto(latestCareer, {
        assetId: savedAsset.id,
        description: "",
      });
      const nextCareers = latestCareers.map((item) =>
        item.id === careerId ? nextCareer : item,
      );

      if (!persistPhotoDraft(nextCareers, identityRef.current)) {
        await deletePhotoAsset(savedAsset.id).catch(() => undefined);
        throw new Error(
          "사진을 초안에 연결하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
        );
      }

      setCareers(nextCareers);
      const nextAssets = new Map(photoAssetsRef.current);
      nextAssets.set(savedAsset.id, toDisplayPhotoAsset(savedAsset));
      replaceDisplayedPhotoAssets(nextAssets);
    } catch (error) {
      setErrors([
        getErrorMessage(error, "작업 사진을 추가하지 못했습니다."),
      ]);
    } finally {
      setPhotoOperation(null);
    }
  }

  async function removeProfilePhoto() {
    const assetId = identity.profilePhotoId;

    if (!assetId || photoOperation) {
      return;
    }

    const nextIdentity = { ...identity, profilePhotoId: null };

    if (!persistPhotoDraft(careers, nextIdentity)) {
      setErrors([
        "프로필 사진 변경을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
      ]);
      return;
    }

    setPhotoOperation("profile");
    setIdentity(nextIdentity);
    const nextAssets = new Map(photoAssetsRef.current);
    const removedAsset = nextAssets.get(assetId);
    if (removedAsset) {
      URL.revokeObjectURL(removedAsset.objectUrl);
    }
    nextAssets.delete(assetId);
    replaceDisplayedPhotoAssets(nextAssets);

    try {
      await deletePhotoAsset(assetId);
    } catch {
      setErrors([
        "사진 참조는 제거했지만 저장된 파일을 정리하지 못했습니다. 다시 열면 정리를 시도합니다.",
      ]);
    } finally {
      setPhotoOperation(null);
    }
  }

  async function removeCareerPhoto(careerId: string, assetId: string) {
    if (photoOperation) {
      return;
    }

    const career = careers.find((item) => item.id === careerId);

    if (!career) {
      return;
    }

    const nextCareer = removeCareerPhotoReference(career, assetId);
    const nextCareers = careers.map((item) =>
      item.id === careerId ? nextCareer : item,
    );

    if (!persistPhotoDraft(nextCareers, identity)) {
      setErrors([
        "작업 사진 변경을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.",
      ]);
      return;
    }

    setPhotoOperation(`career-${careerId}`);
    setCareers(nextCareers);
    const nextAssets = new Map(photoAssetsRef.current);
    const removedAsset = nextAssets.get(assetId);
    if (removedAsset) {
      URL.revokeObjectURL(removedAsset.objectUrl);
    }
    nextAssets.delete(assetId);
    replaceDisplayedPhotoAssets(nextAssets);

    try {
      await deletePhotoAsset(assetId);
    } catch {
      setErrors([
        "사진 참조는 제거했지만 저장된 파일을 정리하지 못했습니다. 다시 열면 정리를 시도합니다.",
      ]);
    } finally {
      setPhotoOperation(null);
    }
  }

  function updateCareerPhotoDescription(
    careerId: string,
    assetId: string,
    description: string,
  ) {
    const career = careers.find((item) => item.id === careerId);

    if (!career) {
      return;
    }

    updateCareer(careerId, {
      portfolioPhotos: career.portfolioPhotos.map((photo) =>
        photo.assetId === assetId ? { ...photo, description } : photo,
      ),
    });
  }

  function addRestaurantHighlight(careerId: string) {
    const career = careers.find((item) => item.id === careerId);

    if (!career || career.restaurantHighlights.length >= 5) {
      return;
    }

    updateCareer(careerId, {
      restaurantHighlights: [...career.restaurantHighlights, ""],
    });
  }

  function updateRestaurantHighlight(
    careerId: string,
    index: number,
    value: string,
  ) {
    const career = careers.find((item) => item.id === careerId);

    if (!career) {
      return;
    }

    updateCareer(careerId, {
      restaurantHighlights: career.restaurantHighlights.map(
        (highlight, itemIndex) => (itemIndex === index ? value : highlight),
      ),
    });
  }

  function removeRestaurantHighlight(careerId: string, index: number) {
    const career = careers.find((item) => item.id === careerId);

    if (!career) {
      return;
    }

    updateCareer(careerId, {
      restaurantHighlights: career.restaurantHighlights.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    });
  }

  function addCareer() {
    setCareers((current) => [...current, createBlankCareerEntry("manual")]);
  }

  function confirmCareers() {
    const nextErrors = getCareerErrors(careers);
    setErrors(nextErrors);

    if (nextErrors.length === 0) {
      if (writeStoredDraft(currentDraft)) {
        void deleteOrphanedPhotoAssets(
          collectReferencedPhotoIds(currentDraft),
        );
      }
      setHasConfirmedCareers(true);
      moveToStep(3);
    }
  }

  function previewResume() {
    const missingPhotoIds = collectReferencedPhotoIds(currentDraft).filter(
      (id) => !photoAssets.has(id),
    );
    const nextErrors = [
      ...getEnrichmentErrors(identity, careers),
      ...(missingPhotoIds.length > 0
        ? [
            "사진 일부를 이 브라우저에서 찾지 못했습니다. 해당 사진을 삭제하거나 다시 선택해 주세요.",
          ]
        : []),
    ];
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

  function toggleCareerSpecialty(id: string, value: CulinarySpecialty) {
    const career = careers.find((item) => item.id === id);

    if (!career) {
      return;
    }

    updateCareer(id, {
      culinarySpecialties: toggleCulinarySpecialty(
        career.culinarySpecialties,
        value,
      ),
    });
  }

  function addCareerChoice(
    id: string,
    field: CulinaryChoiceKind,
    value: string,
  ) {
    const career = careers.find((item) => item.id === id);

    if (!career) {
      return;
    }

    updateCareer(id, {
      [field]: addCustomChoice(career[field], value),
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
              {draftIsStored
                ? "확인하신 근무 이력은 이 브라우저에 저장되어 새로고침해도 남습니다."
                : "아직 저장되지 않았습니다. 지금 새로고침하면 입력한 내용은 사라집니다."}
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
            <div
              className="error-summary no-print"
              ref={errorSummaryRef}
              role="alert"
              tabIndex={-1}
            >
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
                  {storedDraft || hasPendingPhotoClear ? (
                    <button
                      className="text-button"
                      type="button"
                      onClick={discardStoredDraft}
                      disabled={isImportingPdf}
                    >
                      {hasPendingPhotoClear
                        ? "남은 사진 다시 지우기"
                        : "이 기기에서 지우기"}
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
                    {career.importedFields ? (
                      <section
                        className="imported-reference"
                        aria-label="가져온 공공기록"
                      >
                        <header>
                          <strong>가져온 공공기록</strong>
                          <ProvenanceTag kind="imported" />
                        </header>
                        <dl>
                          <div>
                            <dt>원문 사업장명</dt>
                            <dd>{career.importedFields.legalEmployer}</dd>
                          </div>
                          <div>
                            <dt>건강보험 자격기간 (원문)</dt>
                            <dd>
                              {career.importedFields.qualificationStart} ~{" "}
                              {career.importedFields.qualificationEnd ||
                                "상실일 없음"}
                            </dd>
                          </div>
                        </dl>
                        <p>
                          이 값은 수정되지 않습니다. 아래 입력란을 고쳐도 원문
                          근거는 그대로 보존됩니다.
                        </p>
                      </section>
                    ) : null}

                    <div
                      className={
                        "field-grid" +
                        (career.origin === "document"
                          ? " field-grid-single"
                          : "")
                      }
                    >
                      {career.origin === "manual" ? (
                        <Field label="법인명" hint="알고 있다면 입력하세요.">
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
                      ) : null}

                      <Field
                        label="실제 레스토랑명"
                        hint={
                          career.importedFields
                            ? career.restaurantName ===
                              career.importedFields.legalEmployer
                              ? "원문 사업장명으로 미리 채웠습니다. 실제 레스토랑명이 다르면 고쳐 주세요."
                              : "원문 사업장명과 다르게 적어도 위의 원문 근거는 그대로 남습니다."
                            : undefined
                        }
                        required
                      >
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

                    <div className="restaurant-metadata">
                      <Field
                        label="상세 위치"
                        hint="동명이 있는 레스토랑을 구분할 수 있도록 지점이나 동네까지 적어 주세요."
                        provenance="authored"
                      >
                        <input
                          type="text"
                          maxLength={100}
                          value={career.restaurantLocation}
                          onChange={(event) =>
                            updateCareer(career.id, {
                              restaurantLocation: event.currentTarget.value,
                            })
                          }
                          placeholder="예: 서울 용산구 한남동"
                        />
                      </Field>

                      <section className="restaurant-highlights">
                        <header>
                          <div>
                            <span className="field-label">주요 이력</span>
                            <span className="field-hint">
                              수상·선정 명칭과 당시 적용 시기를 함께 적어 주세요.
                            </span>
                          </div>
                          <ProvenanceTag kind="authored" />
                        </header>

                        {career.restaurantHighlights.length > 0 ? (
                          <div className="restaurant-highlight-list">
                            {career.restaurantHighlights.map(
                              (highlight, highlightIndex) => (
                                <div
                                  className="restaurant-highlight-row"
                                  key={`${career.id}-highlight-${highlightIndex}`}
                                >
                                  <input
                                    type="text"
                                    maxLength={80}
                                    value={highlight}
                                    aria-label={`주요 이력 ${highlightIndex + 1}`}
                                    onChange={(event) =>
                                      updateRestaurantHighlight(
                                        career.id,
                                        highlightIndex,
                                        event.currentTarget.value,
                                      )
                                    }
                                    placeholder="예: 미쉐린 1스타 (2019–2021)"
                                  />
                                  <button
                                    className="text-button"
                                    type="button"
                                    onClick={() =>
                                      removeRestaurantHighlight(
                                        career.id,
                                        highlightIndex,
                                      )
                                    }
                                    aria-label={`${highlightIndex + 1}번째 주요 이력 삭제`}
                                  >
                                    삭제
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="empty-field-note">
                            필요한 경우에만 추가합니다. 제품은 이 내용을 검증된
                            사실로 표시하지 않습니다.
                          </p>
                        )}

                        <button
                          className="secondary-button compact-button"
                          type="button"
                          onClick={() => addRestaurantHighlight(career.id)}
                          disabled={career.restaurantHighlights.length >= 5}
                        >
                          주요 이력 추가 ({career.restaurantHighlights.length}/5)
                        </button>
                      </section>
                    </div>

                    <div className="date-section date-section-single">
                      <div>
                        <p className="date-section-title">
                          실제 근무 기간 (연·월)
                          <span>
                            {career.origin === "document"
                              ? "가져온 자격일의 연·월에서 시작했습니다. 실제 근무 기간에 맞게 고쳐 주세요."
                              : "본인이 확인하는 정보입니다."}
                          </span>
                        </p>
                        <div className="employment-status">
                          <span
                            className="field-label"
                            id={`employment-status-${career.id}`}
                          >
                            근무 상태
                          </span>
                          <div
                            className="employment-status-options"
                            role="radiogroup"
                            aria-labelledby={`employment-status-${career.id}`}
                          >
                            <label>
                              <input
                                type="radio"
                                name={`employment-status-${career.id}`}
                                checked={!career.isCurrent}
                                onChange={() =>
                                  updateEmploymentStatus(career.id, false)
                                }
                              />
                              <span>근무 종료</span>
                            </label>
                            <label>
                              <input
                                type="radio"
                                name={`employment-status-${career.id}`}
                                checked={career.isCurrent}
                                onChange={() =>
                                  updateEmploymentStatus(career.id, true)
                                }
                              />
                              <span>재직 중</span>
                            </label>
                          </div>
                          <span className="field-hint">
                            재직 중인 경력은 한 개만 선택할 수 있습니다.
                          </span>
                        </div>
                        <div className="date-grid">
                          <Field label="근무 시작월" required>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={7}
                              pattern="[0-9]{4}-(0[1-9]|1[0-2])"
                              placeholder="예: 2015-11"
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
                            hint={
                              career.isCurrent
                                ? "재직 중으로 선택되어 종료월을 입력하지 않습니다."
                                : "YYYY-MM 형식으로 입력해 주세요."
                            }
                            required={!career.isCurrent}
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={7}
                              pattern="[0-9]{4}-(0[1-9]|1[0-2])"
                              placeholder={
                                career.isCurrent ? "재직 중" : "예: 2016-10"
                              }
                              value={career.employmentEnd}
                              disabled={career.isCurrent}
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
                <p className="file-notice draft-storage-notice">
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
                <section
                  className="profile-photo-editor"
                  aria-busy={photoOperation === "profile"}
                >
                  <div className="photo-section-heading">
                    <div>
                      <h3>프로필 사진</h3>
                      <p>
                        한 장만 저장합니다. 일반 PDF에는 표시하고 리뷰용
                        사본에서는 자동으로 제외합니다.
                      </p>
                    </div>
                    <ProvenanceTag kind="authored" />
                  </div>

                  {identity.profilePhotoId ? (
                    <div className="profile-photo-current">
                      {photoAssets.get(identity.profilePhotoId) ? (
                        <img
                          src={
                            photoAssets.get(identity.profilePhotoId)!.objectUrl
                          }
                          alt={`${identity.name || "사용자"} 프로필 사진`}
                        />
                      ) : (
                        <span className="photo-loading">사진 불러오는 중</span>
                      )}
                      <div className="photo-inline-actions">
                        <label className="secondary-button compact-button photo-file-button">
                          사진 교체
                          <input
                            type="file"
                            accept={PHOTO_ACCEPT}
                            disabled={photoOperation !== null}
                            onChange={handleProfilePhotoSelection}
                          />
                        </label>
                        <button
                          className="text-button"
                          type="button"
                          disabled={photoOperation !== null}
                          onClick={removeProfilePhoto}
                        >
                          사진 삭제
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="photo-dropzone">
                      <input
                        type="file"
                        accept={PHOTO_ACCEPT}
                        disabled={photoOperation !== null}
                        onChange={handleProfilePhotoSelection}
                      />
                      <strong>
                        {photoOperation === "profile"
                          ? "사진 처리 중"
                          : "프로필 사진 추가"}
                      </strong>
                      <span>JPEG, PNG, WebP, HEIC, HEIF · 최대 20 MB</span>
                    </label>
                  )}
                </section>
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

                  <SpecialtyChoiceGroup
                    selected={career.culinarySpecialties}
                    onToggle={(value) =>
                      toggleCareerSpecialty(career.id, value)
                    }
                  />

                  <GroupedChoiceGroup
                    legend="독립적으로 맡았던 스테이션"
                    groups={getCulinaryChoiceGroups(
                      career.culinarySpecialties,
                      "stations",
                    )}
                    selected={career.stations}
                    onToggle={(option) =>
                      toggleCareerChoice(career.id, "stations", option)
                    }
                    onAdd={(option) =>
                      addCareerChoice(career.id, "stations", option)
                    }
                    customPlaceholder="목록에 없는 스테이션"
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

                  <GroupedChoiceGroup
                    legend="다뤄본 기술"
                    groups={getCulinaryChoiceGroups(
                      career.culinarySpecialties,
                      "skills",
                    )}
                    selected={career.skills}
                    onToggle={(option) =>
                      toggleCareerChoice(career.id, "skills", option)
                    }
                    onAdd={(option) =>
                      addCareerChoice(career.id, "skills", option)
                    }
                    customPlaceholder="목록에 없는 기술"
                    hint="실제로 사용해 본 항목만 선택하세요."
                  />

                  <GroupedChoiceGroup
                    legend="다뤄본 장비·도구"
                    groups={getCulinaryChoiceGroups(
                      career.culinarySpecialties,
                      "equipment",
                    )}
                    selected={career.equipment}
                    onToggle={(option) =>
                      toggleCareerChoice(career.id, "equipment", option)
                    }
                    onAdd={(option) =>
                      addCareerChoice(career.id, "equipment", option)
                    }
                    customPlaceholder="목록에 없는 장비·도구"
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

                  <section
                    className="career-photo-editor"
                    aria-busy={photoOperation === `career-${career.id}`}
                  >
                    <div className="photo-section-heading">
                      <div>
                        <h3>음식·작업 사진</h3>
                        <p>
                          경력마다 최대 6장까지 저장합니다. 각 사진에는 메뉴명과
                          본인이 맡은 부분을 적어 주세요.
                        </p>
                      </div>
                      <ProvenanceTag kind="authored" />
                    </div>

                    <fieldset className="resume-photo-choice">
                      <legend>PDF 대표사진</legend>
                      <label className="resume-photo-none">
                        <input
                          type="radio"
                          name={`resume-photo-${career.id}`}
                          checked={career.resumePhotoId === null}
                          onChange={() =>
                            updateCareer(
                              career.id,
                              selectCareerResumePhoto(career, null),
                            )
                          }
                        />
                        <span>PDF에 사진 넣지 않음</span>
                      </label>

                      {career.portfolioPhotos.length > 0 ? (
                        <div className="career-photo-grid">
                          {career.portfolioPhotos.map((photo, photoIndex) => {
                            const photoUrl = photoAssets.get(
                              photo.assetId,
                            )?.objectUrl;
                            const photoDescriptionError =
                              getCareerPhotoDescriptionError(
                                career,
                                photoIndex,
                              );
                            const showPhotoDescriptionError =
                              photoDescriptionError !== null &&
                              errors.includes(photoDescriptionError);
                            const photoDescriptionErrorId =
                              `photo-description-${photo.assetId}-error`;

                            return (
                              <article
                                className={
                                  "career-photo-card" +
                                  (career.resumePhotoId === photo.assetId
                                    ? " is-resume-photo"
                                    : "")
                                }
                                key={photo.assetId}
                              >
                                <div className="career-photo-preview">
                                  {photoUrl ? (
                                    <img
                                      src={photoUrl}
                                      alt={
                                        photo.description.trim() ||
                                        "설명을 입력하지 않은 작업 사진"
                                      }
                                    />
                                  ) : (
                                    <span className="photo-loading">
                                      사진 불러오는 중
                                    </span>
                                  )}
                                </div>

                                <label
                                  className="photo-description-field"
                                  htmlFor={`photo-description-${photo.assetId}`}
                                >
                                  <span className="field-label">
                                    메뉴명 · 본인이 맡은 부분 *
                                  </span>
                                  <textarea
                                    id={`photo-description-${photo.assetId}`}
                                    rows={3}
                                    maxLength={120}
                                    value={photo.description}
                                    aria-invalid={
                                      showPhotoDescriptionError || undefined
                                    }
                                    aria-describedby={
                                      showPhotoDescriptionError
                                        ? photoDescriptionErrorId
                                        : undefined
                                    }
                                    onChange={(event) =>
                                      updateCareerPhotoDescription(
                                        career.id,
                                        photo.assetId,
                                        event.currentTarget.value,
                                      )
                                    }
                                    placeholder="예: 광어 세비체 · 소스와 플레이팅"
                                  />
                                  <span className="field-hint">
                                    {photo.description.length}/120자
                                  </span>
                                  {showPhotoDescriptionError ? (
                                    <span
                                      className="field-error"
                                      id={photoDescriptionErrorId}
                                    >
                                      {photoDescriptionError}
                                    </span>
                                  ) : null}
                                </label>

                                <div className="career-photo-actions">
                                  <label className="resume-photo-radio">
                                    <input
                                      type="radio"
                                      name={`resume-photo-${career.id}`}
                                      checked={
                                        career.resumePhotoId === photo.assetId
                                      }
                                      onChange={() =>
                                        updateCareer(
                                          career.id,
                                          selectCareerResumePhoto(
                                            career,
                                            photo.assetId,
                                          ),
                                        )
                                      }
                                    />
                                    <span>이 사진을 PDF에 사용</span>
                                  </label>
                                  <button
                                    className="text-button"
                                    type="button"
                                    disabled={photoOperation !== null}
                                    onClick={() =>
                                      removeCareerPhoto(
                                        career.id,
                                        photo.assetId,
                                      )
                                    }
                                    aria-label={`${photoIndex + 1}번째 작업 사진 삭제`}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="empty-field-note">
                          사진을 추가하지 않아도 이력서를 완성할 수 있습니다.
                        </p>
                      )}
                    </fieldset>

                    <label
                      className={
                        "photo-dropzone career-photo-add" +
                        (career.portfolioPhotos.length >= 6
                          ? " is-disabled"
                          : "")
                      }
                    >
                      <input
                        type="file"
                        accept={PHOTO_ACCEPT}
                        disabled={
                          photoOperation !== null ||
                          career.portfolioPhotos.length >= 6
                        }
                        onChange={(event) =>
                          handleCareerPhotoSelection(career.id, event)
                        }
                      />
                      <strong>
                        {photoOperation === `career-${career.id}`
                          ? "사진 처리 중"
                          : "작업 사진 추가"}
                      </strong>
                      <span>
                        {career.portfolioPhotos.length}/6장 · 사진은 이
                        브라우저에만 저장됩니다.
                      </span>
                    </label>
                  </section>
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
                  onClick={printResume}
                >
                  인쇄 · PDF 저장
                  <span aria-hidden="true">↗</span>
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={printReviewCopy}
                >
                  리뷰용 사본 · 이름과 연락처 제외
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
              <p className="review-export-note field-hint no-print">
                리뷰용 사본에서는 이름, 이메일, 전화번호와 프로필 사진이
                빠집니다. 이력서 제목과 경력 요약, 경력 기록과 선택한 작업
                사진은 그대로 남으므로, 요약이나 사진 설명에 이름을 적으셨다면
                보내시기 전에 확인해 주세요. 인쇄 미리보기에서 실제 결과를 먼저
                보실 수 있습니다.
              </p>
              <label className="summary-toggle no-print">
                <input
                  type="checkbox"
                  checked={showCareerSummary}
                  onChange={(event) =>
                    setShowCareerSummary(event.currentTarget.checked)
                  }
                />
                <span>
                  <strong>한눈에 보기를 이력서에 표시</strong>
                  <small>내용을 바꾸려면 3단계에서 경력을 수정하세요.</small>
                </span>
              </label>

              <ResumeSheet
                identity={sheetIdentity}
                careers={includedCareers}
                summary={careerSummary}
                showSummary={showCareerSummary}
                photoUrls={photoUrls}
                isDemo={isDemoDraft}
                ref={resumeSheetRef}
              />

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
