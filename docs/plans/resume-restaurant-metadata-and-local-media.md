# Restaurant Metadata and Local Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 레스토랑 위치·주요 이력과 브라우저 로컬 사진을 안전하게 저장하고, 사용자가 경력별 대표사진을 선택하여 기존 이력서 PDF에 넣을 수 있게 합니다.

**Architecture:** 구조화된 초안과 사진 참조는 기존 `localStorage` 초안에 저장하고, 정규화된 이미지 Blob은 `mise-en-place-media` IndexedDB의 `photos` 객체 저장소에 저장합니다. 순수 데이터 규칙과 마이그레이션은 `resume-model.mts`, 이미지 처리와 저장소 접근은 새 모듈, 화면 상태와 출력 조합은 `page.tsx`가 담당합니다.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, TypeScript, Tailwind CSS 4, browser Canvas, IndexedDB, Node test runner, pnpm 11.22.0

**Spec:** `docs/specs/resume-restaurant-metadata-and-local-media.md`

## Global Constraints

- 원본 사진은 저장하지 않고, 브라우저에서 JPEG로 정규화한 자산만 IndexedDB에 저장합니다.
- 입력 파일은 20 MB 이하이고, 저장 자산은 긴 변 1,600 px 이하와 2 MB 이하를 모두 만족해야 합니다.
- 프로필 사진은 최대 1개이고, 경력별 작업 사진은 최대 6개입니다.
- 모든 작업 사진 설명은 1자 이상 120자 이하이어야 합니다.
- 경력별 PDF 대표사진은 최대 1개이고 초기값은 `null`입니다.
- 사진 추가, 저장, 복원, 출력은 네트워크 요청을 발생시키면 안 됩니다.
- 리뷰용 사본에서는 프로필 사진을 제외하고, 사용자가 선택한 경력별 대표사진은 유지합니다.
- 개인 메뉴 사진, 공개 포트폴리오, 계정 동기화, 서버 업로드는 구현하지 않습니다.
- 새 의존성을 추가하지 않고 브라우저 기본 API와 현재 테스트 도구를 사용합니다.
- `public/culinaryagents.json`은 이 작업의 입력이나 커밋 대상이 아닙니다.

---

## File Map

- Modify: `app/resume-model.mts` — 레스토랑 메타정보, 사진 참조, 버전 3 초안, 순수 검증 규칙을 정의합니다.
- Modify: `app/resume-model.test.mts` — 버전 1·2 마이그레이션과 버전 3 불변 조건을 검증합니다.
- Create: `app/local-photo-store.mts` — IndexedDB 열기, 조회, 저장, 삭제, 전체 삭제, 고아 정리를 담당합니다.
- Create: `app/local-photo-store.test.mts` — 저장소 결정 로직과 실패 보상에 사용할 순수 헬퍼를 검증합니다.
- Create: `app/photo-normalizer.mts` — 파일 정책, 이미지 디코딩, Canvas 축소, JPEG 인코딩을 담당합니다.
- Create: `app/photo-normalizer.test.mts` — 파일 정책과 축소 계산을 검증합니다.
- Modify: `app/page.tsx` — 사진 상태, 복원·삭제 조정, STEP 02·03 입력, STEP 04 미리보기와 출력 준비를 연결합니다.
- Modify: `app/globals.css` — 사진 입력 카드, 미리보기, 인쇄 레이아웃을 추가합니다.
- Modify: `docs/plans/resume-builder-validation.md` — Track A 사전 점검에 로컬 사진과 네트워크 경계를 추가합니다.

## Task 1: Extend the Resume Model and Draft Migration

**Files:**

- Modify: `app/resume-model.mts`
- Modify: `app/resume-model.test.mts`

**Interfaces:**

- Produces: `CareerPhotoReference`, `getPhotoReferenceErrors()`, 버전 3 `ResumeDraft` 직렬화·파싱.
- Produces: `CareerEntry.restaurantLocation`, `CareerEntry.restaurantHighlights`, `CareerEntry.portfolioPhotos`, `CareerEntry.resumePhotoId`, `ResumeIdentity.profilePhotoId`.
- Consumes: 현재 버전 1·2 초안 파서와 `toReviewIdentity()` 동작.

- [x] **Step 1: Write failing model and migration tests**

  `app/resume-model.test.mts`에 다음 공용 시험 자료 생성 함수를 먼저 추가합니다.

  ```typescript
  const makeIdentity = (
    overrides: Partial<ResumeIdentity> = {},
  ): ResumeIdentity => ({
    name: "홍길동",
    headline: "Chef de Partie",
    email: "chef@example.com",
    phone: "010-0000-0000",
    summary: "서비스 주방 경력을 소개합니다.",
    profilePhotoId: null,
    ...overrides,
  });

  const makeCareer = (
    overrides: Partial<CareerEntry> = {},
  ): CareerEntry => ({
    ...createBlankCareerEntry(),
    restaurantName: "테스트 키친",
    employmentStart: "2024-01",
    employmentEnd: "2024-12",
    role: "Chef de Partie",
    responsibilities: ["스테이션 운영"],
    ...overrides,
  });

  const makeDraft = (
    overrides: Partial<ResumeDraft> = {},
  ): ResumeDraft => ({
    careers: [makeCareer()],
    identity: makeIdentity(),
    isDemoDraft: false,
    talentPoolChoice: "resume-only",
    ...overrides,
  });
  ```

  이어서 다음 사례를 추가합니다.

  ```typescript
  test("migrates version 2 drafts without local media", () => {
    const legacy = JSON.parse(serializeResumeDraft(makeDraft()));
    legacy.version = 2;
    delete legacy.identity.profilePhotoId;
    delete legacy.careers[0].restaurantLocation;
    delete legacy.careers[0].restaurantHighlights;
    delete legacy.careers[0].portfolioPhotos;
    delete legacy.careers[0].resumePhotoId;

    const draft = parseResumeDraft(JSON.stringify(legacy));

    assert.deepEqual(draft?.identity.profilePhotoId, null);
    assert.deepEqual(draft?.careers[0].restaurantLocation, "");
    assert.deepEqual(draft?.careers[0].restaurantHighlights, []);
    assert.deepEqual(draft?.careers[0].portfolioPhotos, []);
    assert.deepEqual(draft?.careers[0].resumePhotoId, null);
  });

  test("rejects a representative photo outside its career", () => {
    const payload = JSON.parse(
      serializeResumeDraft(
        makeDraft({
          careers: [
            makeCareer({
              portfolioPhotos: [
                {
                  assetId: "photo-a",
                  description: "광어 세비체 · 소스와 플레이팅",
                },
              ],
            }),
          ],
        }),
      ),
    );
    payload.careers[0].resumePhotoId = "photo-b";

    assert.equal(parseResumeDraft(JSON.stringify(payload)), null);
  });

  test("requires every career photo description", () => {
    const errors = getPhotoReferenceErrors([
      makeCareer({
        restaurantName: "테스트 키친",
        portfolioPhotos: [{ assetId: "photo-a", description: " " }],
      }),
    ]);

    assert.deepEqual(errors, ["테스트 키친의 첫 번째 작업 사진에 메뉴명과 본인이 맡은 부분을 입력해 주세요."]);
  });

  test("removes the profile photo from a review identity", () => {
    const reviewIdentity = toReviewIdentity(
      makeIdentity({ profilePhotoId: "profile-a" }),
    );

    assert.equal(reviewIdentity.profilePhotoId, null);
  });
  ```

- [x] **Step 2: Run the focused tests and confirm the expected failure**

  Run: `pnpm test -- app/resume-model.test.mts`

  Expected: FAIL because the new fields and `getPhotoReferenceErrors()` do not exist.

- [x] **Step 3: Add the version 3 types and defaults**

  `app/resume-model.mts`에 다음 인터페이스를 추가하고 모든 빈 항목, 데모 항목, 가져온 항목 생성 경로에 기본값을 넣습니다.

  ```typescript
  export type CareerPhotoReference = {
    assetId: string;
    description: string;
  };

  export type CareerEntry = ImportedCareerFields & {
    restaurantLocation: string;
    restaurantHighlights: string[];
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
  ```

  `RESUME_DRAFT_VERSION`을 `3`으로 바꾸고 지원 버전을 `1`, `2`, `3`으로 명시합니다.
  버전 1과 2에는 명세의 마이그레이션 기본값을 적용합니다.
  버전 3 파서는 사진 6개 한도, 중복 ID, 설명 길이, 대표사진 소속을 검사합니다.

- [x] **Step 4: Add pure validation helpers**

  다음 시그니처를 구현합니다.

  ```typescript
  export function getPhotoReferenceErrors(
    entries: readonly CareerEntry[],
  ): string[];

  export function removeCareerPhotoReference(
    entry: CareerEntry,
    assetId: string,
  ): CareerEntry;
  ```

  `removeCareerPhotoReference()`는 참조를 제거하고, 삭제한 ID가 `resumePhotoId`와 같으면 `resumePhotoId`를 `null`로 바꿉니다.
  `toReviewIdentity()`는 기존 세 필드와 함께 `profilePhotoId`도 `null`로 만듭니다.

- [x] **Step 5: Run the focused tests**

  Run: `pnpm test -- app/resume-model.test.mts`

  Expected: PASS.

- [ ] **Step 6: Commit the model slice**

  ```bash
  git add app/resume-model.mts app/resume-model.test.mts
  git commit -m "feat(resume): model local portfolio media"
  ```

## Task 2: Add Photo Policy and Browser Normalization

**Files:**

- Create: `app/photo-normalizer.mts`
- Create: `app/photo-normalizer.test.mts`

**Interfaces:**

- Consumes: 브라우저 `File`, `createImageBitmap` 또는 `HTMLImageElement`, Canvas API.
- Produces: `PhotoPolicyError`, `getScaledDimensions()`, `validatePhotoFile()`, `normalizePhoto()`.

- [x] **Step 1: Write failing pure policy tests**

  ```typescript
  test("rejects source files larger than 20 MB", () => {
    const error = validatePhotoFile({
      name: "large.jpg",
      size: 20 * 1024 * 1024 + 1,
      type: "image/jpeg",
    });

    assert.equal(error, "사진은 20 MB 이하인 파일을 선택해 주세요.");
  });

  test("scales the longest edge to 1600 pixels", () => {
    assert.deepEqual(getScaledDimensions(4000, 3000, 1600), {
      width: 1600,
      height: 1200,
    });
  });

  test("never enlarges a smaller photo", () => {
    assert.deepEqual(getScaledDimensions(800, 600, 1600), {
      width: 800,
      height: 600,
    });
  });
  ```

- [x] **Step 2: Run the focused tests and confirm the expected failure**

  Run: `pnpm test -- app/photo-normalizer.test.mts`

  Expected: FAIL because `photo-normalizer.mts` does not exist.

- [x] **Step 3: Implement file validation and dimension calculation**

  다음 상수와 함수를 구현합니다.

  ```typescript
  export const MAX_SOURCE_PHOTO_BYTES = 20 * 1024 * 1024;
  export const MAX_STORED_PHOTO_BYTES = 2 * 1024 * 1024;
  export const MAX_PHOTO_EDGE = 1600;

  export function validatePhotoFile(
    file: Pick<File, "name" | "size" | "type">,
  ): string | null;

  export function getScaledDimensions(
    width: number,
    height: number,
    maxEdge: number,
  ): { width: number; height: number };
  ```

  SVG와 GIF는 명시적으로 거부합니다.
  나머지 파일은 `image/*` MIME 형식을 확인한 뒤 실제 디코딩 결과를 최종 판정으로 사용합니다.

- [x] **Step 4: Implement JPEG normalization**

  다음 반환 타입을 사용합니다.

  ```typescript
  export type NormalizedPhoto = {
    blob: Blob;
    mimeType: "image/jpeg";
    width: number;
    height: number;
    byteLength: number;
  };

  export async function normalizePhoto(file: File): Promise<NormalizedPhoto>;
  ```

  긴 변을 1,600 px 이하로 맞춘 뒤 품질 `0.85`, `0.75`, `0.65` 순서로 JPEG 인코딩합니다.
  여전히 2 MB를 넘으면 가로와 세로를 각각 85%로 줄여 다시 인코딩하되, 긴 변이 960 px에 도달할 때까지만 반복합니다.
  결과가 계속 2 MB를 넘으면 `PhotoPolicyError`를 던집니다.
  성공과 실패 경로 모두 Canvas와 임시 Object URL 참조를 해제합니다.

- [x] **Step 5: Run the focused tests**

  Run: `pnpm test -- app/photo-normalizer.test.mts`

  Expected: PASS for file policy and dimension calculations.
  Canvas 인코딩은 Task 6의 실제 브라우저 점검에서 검증합니다.

- [ ] **Step 6: Commit the normalization slice**

  ```bash
  git add app/photo-normalizer.mts app/photo-normalizer.test.mts
  git commit -m "feat(resume): normalize local photos"
  ```

## Task 3: Add the IndexedDB Photo Store

**Files:**

- Create: `app/local-photo-store.mts`
- Create: `app/local-photo-store.test.mts`

**Interfaces:**

- Consumes: `NormalizedPhoto` from `app/photo-normalizer.mts` and an `IDBFactory` supplied by the browser.
- Produces: `LocalPhotoAsset`, `savePhotoAsset()`, `getPhotoAssets()`, `deletePhotoAsset()`, `clearPhotoAssets()`, `deleteOrphanedPhotoAssets()`.

- [x] **Step 1: Write failing reconciliation tests**

  IndexedDB 자체를 흉내 내는 새 의존성은 추가하지 않습니다.
  대신 저장소가 사용하는 순수 집합 계산을 먼저 검증합니다.

  ```typescript
  test("finds missing references and orphaned assets", () => {
    const result = reconcilePhotoAssetIds(
      ["profile-a", "work-a", "missing-a"],
      ["profile-a", "work-a", "orphan-a"],
    );

    assert.deepEqual(result, {
      missingIds: ["missing-a"],
      orphanedIds: ["orphan-a"],
    });
  });
  ```

- [x] **Step 2: Run the focused tests and confirm the expected failure**

  Run: `pnpm test -- app/local-photo-store.test.mts`

  Expected: FAIL because `reconcilePhotoAssetIds()` does not exist.

- [x] **Step 3: Implement the store contract**

  ```typescript
  export type LocalPhotoAsset = {
    id: string;
    blob: Blob;
    mimeType: "image/jpeg";
    width: number;
    height: number;
    byteLength: number;
    createdAt: string;
  };

  export async function savePhotoAsset(
    photo: NormalizedPhoto,
    indexedDB?: IDBFactory,
  ): Promise<LocalPhotoAsset>;

  export async function getPhotoAssets(
    ids: readonly string[],
    indexedDB?: IDBFactory,
  ): Promise<Map<string, LocalPhotoAsset>>;

  export async function deletePhotoAsset(
    id: string,
    indexedDB?: IDBFactory,
  ): Promise<void>;

  export async function clearPhotoAssets(
    indexedDB?: IDBFactory,
  ): Promise<void>;
  ```

  데이터베이스는 `mise-en-place-media`, 버전은 `1`, 객체 저장소는 `photos`, 키 경로는 `id`를 사용합니다.
  `indexedDB` 기본값은 `globalThis.indexedDB`이고, 브라우저 저장소를 사용할 수 없으면 한국어 오류 메시지와 함께 실패합니다.

- [x] **Step 4: Implement reconciliation and orphan deletion**

  ```typescript
  export function reconcilePhotoAssetIds(
    referencedIds: readonly string[],
    storedIds: readonly string[],
  ): { missingIds: string[]; orphanedIds: string[] };

  export async function deleteOrphanedPhotoAssets(
    referencedIds: readonly string[],
    indexedDB?: IDBFactory,
  ): Promise<{ missingIds: string[]; deletedOrphanIds: string[] }>;
  ```

  반환 배열은 입력 순서를 유지하고 중복을 제거합니다.
  한 자산 삭제가 실패하면 성공한 ID와 실패를 구분할 수 있도록 전체 Promise를 오류로 종료합니다.

- [x] **Step 5: Run the focused tests**

  Run: `pnpm test -- app/local-photo-store.test.mts`

  Expected: PASS for reconciliation behavior.
  실제 IndexedDB 읽기와 쓰기는 Task 6의 실제 브라우저 점검에서 검증합니다.

- [ ] **Step 6: Commit the storage slice**

  ```bash
  git add app/local-photo-store.mts app/local-photo-store.test.mts
  git commit -m "feat(resume): persist photos in indexeddb"
  ```

## Task 4: Add Restaurant Metadata and Photo Inputs

**Files:**

- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**

- Consumes: Task 1의 버전 3 모델과 검증 함수, Task 2의 `normalizePhoto()`, Task 3의 사진 저장소 함수.
- Produces: 위치·주요 이력 입력, 프로필 사진 입력, 경력별 사진 카드, 대표사진 선택 UI.

- [x] **Step 1: Add UI-state behavior tests to the model test file**

  `app/resume-model.test.mts`에 순수 상태 전환 사례를 추가합니다.

  ```typescript
  test("selecting another representative photo replaces the prior selection", () => {
    const career = makeCareer({
      portfolioPhotos: [
        { assetId: "photo-a", description: "파스타 · 소스" },
        { assetId: "photo-b", description: "농어 구이 · 생선 손질" },
      ],
      resumePhotoId: "photo-a",
    });
    const updated = selectCareerResumePhoto(career, "photo-b");

    assert.equal(updated.resumePhotoId, "photo-b");
  });

  test("a seventh career photo is rejected", () => {
    const career = makeCareer({
      portfolioPhotos: Array.from({ length: 6 }, (_, index) => ({
        assetId: `photo-${index}`,
        description: `메뉴 ${index + 1} · 조리와 마감`,
      })),
    });

    assert.throws(
      () =>
        appendCareerPhoto(career, {
          assetId: "photo-7",
          description: "일곱 번째 메뉴 · 조리와 마감",
        }),
      /경력마다 작업 사진을 최대 6개까지 추가할 수 있습니다/,
    );
  });
  ```

- [x] **Step 2: Run the focused tests and confirm the expected failure**

  Run: `pnpm test -- app/resume-model.test.mts`

  Expected: FAIL because `selectCareerResumePhoto()` and `appendCareerPhoto()` do not exist.

- [x] **Step 3: Implement the pure state transitions**

  `app/resume-model.mts`에 다음 함수를 추가합니다.

  ```typescript
  export function appendCareerPhoto(
    entry: CareerEntry,
    photo: CareerPhotoReference,
  ): CareerEntry;

  export function selectCareerResumePhoto(
    entry: CareerEntry,
    assetId: string | null,
  ): CareerEntry;
  ```

  선택 함수는 현재 경력에 없는 ID를 받으면 오류를 던집니다.

- [x] **Step 4: Add STEP 02 restaurant metadata fields**

  `app/page.tsx`의 각 경력 확인 카드에 다음 조작을 추가합니다.

  - `상세 위치` 텍스트 입력은 최대 100자입니다.
  - `주요 이력`은 최대 5개의 텍스트 입력을 추가하고 삭제할 수 있습니다.
  - 안내 예시는 `미쉐린 1스타 (2019–2021)`입니다.
  - 두 필드에는 `본인이 작성함` 출처 표시를 사용합니다.

- [x] **Step 5: Add STEP 03 photo fields and compensating writes**

  프로필 사진 추가 시 `normalizePhoto()`와 `savePhotoAsset()`이 모두 성공한 다음 `profilePhotoId`를 바꿉니다.
  기존 프로필 사진을 교체하면 새 참조 저장이 성공한 뒤 이전 자산을 삭제합니다.
  경력 사진 추가 시 자산 저장 뒤 `appendCareerPhoto()`로 참조를 연결합니다.
  구조화된 초안 저장이 실패하면 새 자산을 즉시 삭제합니다.

  사진 카드에 다음 요소를 구현합니다.

  - 이미지 미리보기.
  - `메뉴명 · 본인이 맡은 부분` 입력.
  - 같은 경력 안에서 하나만 선택되는 `PDF 대표사진` 라디오 입력.
  - 사진 삭제 버튼.
  - 처리 중 상태와 필드별 오류.

- [x] **Step 6: Add bounded styles**

  `app/globals.css`에 사진 그리드, 카드, 미리보기, 설명 입력, 라디오 상태를 추가합니다.
  작은 화면에서는 한 열, 충분한 너비에서는 두 열을 사용합니다.
  사진은 `object-fit: contain`으로 보여주고, 버튼과 입력의 기존 초점 표시를 유지합니다.

- [x] **Step 7: Run tests and static checks**

  Run: `pnpm test -- app/resume-model.test.mts && pnpm lint`

  Expected: PASS with no test or lint errors.

- [ ] **Step 8: Commit the input slice**

  ```bash
  git add app/page.tsx app/globals.css app/resume-model.mts app/resume-model.test.mts
  git commit -m "feat(resume): add local portfolio inputs"
  ```

## Task 5: Restore, Delete, and Render Local Photos

**Files:**

- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `app/resume-model.mts`
- Modify: `app/resume-model.test.mts`

**Interfaces:**

- Consumes: 구조화된 초안의 모든 사진 ID와 Task 3의 조회·정리 함수.
- Produces: `collectReferencedPhotoIds()`, 끊어진 참조 정리, Object URL 수명 관리, 일반·리뷰 미리보기와 인쇄 출력.

- [x] **Step 1: Write failing reference collection tests**

  ```typescript
  test("collects profile and career photo ids once", () => {
    const ids = collectReferencedPhotoIds({
      ...draft,
      identity: { ...draft.identity, profilePhotoId: "profile-a" },
      careers: [
        makeCareer({
          portfolioPhotos: [
            { assetId: "work-a", description: "파스타 · 소스와 마감" },
            { assetId: "work-a", description: "중복 참조" },
          ],
          resumePhotoId: "work-a",
        }),
      ],
    });

    assert.deepEqual(ids, ["profile-a", "work-a"]);
  });
  ```

- [x] **Step 2: Run the focused tests and confirm the expected failure**

  Run: `pnpm test -- app/resume-model.test.mts`

  Expected: FAIL because `collectReferencedPhotoIds()` does not exist.

- [x] **Step 3: Implement reference collection and missing-reference cleanup**

  ```typescript
  export function collectReferencedPhotoIds(draft: ResumeDraft): string[];

  export function removeMissingPhotoReferences(
    draft: ResumeDraft,
    missingIds: readonly string[],
  ): ResumeDraft;
  ```

  누락된 프로필 사진은 `null`로 바꾸고, 누락된 경력 사진은 배열과 `resumePhotoId`에서 함께 제거합니다.

- [x] **Step 4: Restore local assets after explicit draft restore**

  애플리케이션 시작 시 저장된 초안을 화면 상태에 적용하지 않고 파싱하여 유효한 참조 ID를 수집합니다.
  저장된 유효한 초안이 없으면 `clearPhotoAssets()`로 이전 세션의 고아 자산을 삭제합니다.
  기존의 명시적 초안 복원 동작에서는 JSON을 파싱한 뒤 `collectReferencedPhotoIds()`와 `getPhotoAssets()`를 호출합니다.
  누락된 ID는 `removeMissingPhotoReferences()`로 정리하고 `사진 일부를 이 브라우저에서 찾지 못해 제외했습니다.`를 표시합니다.
  복원이 끝나면 `deleteOrphanedPhotoAssets()`를 호출합니다.

- [x] **Step 5: Delete all local assets with the saved draft**

  초안 삭제 확인 뒤 `localStorage` 항목과 `clearPhotoAssets()`를 모두 처리합니다.
  둘 중 하나라도 실패하면 `초안과 사진을 모두 삭제하지 못했습니다. 다시 시도해 주세요.`를 표시하고 삭제 완료 메시지를 보여주지 않습니다.

- [x] **Step 6: Render and release Object URLs**

  IndexedDB에서 읽은 Blob마다 `URL.createObjectURL()`을 한 번만 호출하고 자산 ID로 캐시합니다.
  사진 삭제, 초안 삭제, 다른 초안 복원, 컴포넌트 해제 때 `URL.revokeObjectURL()`을 호출합니다.
  대체 텍스트에는 저장된 설명을 사용합니다.

- [x] **Step 7: Render preview and print variants**

  일반 미리보기와 일반 인쇄 출력에는 프로필 사진을 표시합니다.
  리뷰 모드에서는 `toReviewIdentity()`가 제거한 프로필 사진을 표시하지 않습니다.
  두 출력 모두 각 경력의 `resumePhotoId`에 해당하는 작업 사진만 표시합니다.
  인쇄 직전에는 선택된 모든 이미지의 `decode()` 완료를 기다리고, 실패한 사진이 있으면 `사진을 불러오지 못해 PDF를 만들 수 없습니다. 해당 사진을 다시 선택해 주세요.`를 표시합니다.

- [x] **Step 8: Add print styles**

  경력 대표사진은 경력 본문과 같은 페이지 흐름 안에 배치하고 `break-inside: avoid`를 적용합니다.
  사진 영역은 고정된 최대 너비와 높이를 사용하되 `object-fit: contain`으로 전체 사진을 표시합니다.
  사진이 없는 경력은 기존 레이아웃의 너비와 간격을 유지합니다.

- [x] **Step 9: Run all automated checks**

  Run: `pnpm test && pnpm lint && pnpm build`

  Expected: all commands exit 0.

- [ ] **Step 10: Commit the restore and output slice**

  ```bash
  git add app/page.tsx app/globals.css app/resume-model.mts app/resume-model.test.mts
  git commit -m "feat(resume): render portfolio photos in output"
  ```

## Task 6: Run Browser Acceptance and Privacy Checks

**Files:**

- Modify: `docs/plans/resume-builder-validation.md`

**Interfaces:**

- Consumes: 완성된 개발 빌드와 브라우저 개발자 도구의 Network, Application, Print Preview 화면.
- Produces: Track A 실행 전에 반복할 수 있는 사진 사전 점검 항목.

- [ ] **Step 1: Start the development build**

  Run: `pnpm dev`

  Expected: the local application loads from the loopback development origin without a Next.js origin warning.

- [x] **Step 2: Prove the network guard can fail**

  브라우저 Network 패널의 기록을 지운 뒤 콘솔에서 다음 의도적 요청을 실행합니다.

  ```javascript
  fetch("/photo-network-guard-probe");
  ```

  Expected: the Network panel records the request and the guard result is FAIL.
  이 요청은 시험 요청으로 기록에서 분리한 뒤 다음 단계 전에 Network 기록을 다시 지웁니다.

- [x] **Step 3: Verify upload and restore without network transfer**

  프로필 사진 1개와 한 경력의 작업 사진 6개를 추가하고 모든 설명을 입력합니다.
  일곱 번째 사진 추가 조작이 비활성화되는지 확인합니다.
  초안을 저장하고 페이지를 새로 고친 뒤 명시적으로 복원합니다.

  Expected: 모든 사진과 설명이 복원되고, Network 패널에는 사진 파일, Blob, 설명을 포함한 요청이 0건입니다.

- [x] **Step 4: Verify validation and recovery paths**

  한 사진의 설명을 비우고 STEP 04 이동이 구체적인 오류와 함께 차단되는지 확인합니다.
  지원되지 않는 파일과 20 MB 초과 파일이 기존 입력을 잃지 않고 거부되는지 확인합니다.
  Application 패널에서 참조 중인 자산 하나를 의도적으로 삭제한 뒤 초안을 다시 복원합니다.

  Expected: 나머지 초안은 복원되고 끊어진 사진만 제거되며 경고가 표시됩니다.

- [x] **Step 5: Verify normal and review output**

  두 경력에 서로 다른 대표사진을 하나씩 선택합니다.
  일반 미리보기, 일반 인쇄 미리보기, 리뷰용 인쇄 미리보기를 차례로 확인합니다.

  Expected: 각 경력에는 선택한 사진 한 장만 표시됩니다.
  Expected: 프로필 사진은 일반 미리보기와 일반 인쇄 미리보기에 표시되고 리뷰용 사본에는 표시되지 않습니다.
  Expected: 세로 사진과 가로 사진 모두 잘리지 않으며, 사진이 없는 경력의 기존 정렬이 유지됩니다.

- [x] **Step 6: Verify deletion**

  대표사진을 삭제하여 선택이 해제되는지 확인합니다.
  초안 삭제를 실행하고 Application 패널에서 `mise-en-place.resume-draft`와 `mise-en-place-media/photos`가 모두 비었는지 확인합니다.

  Expected: 구조화된 초안과 모든 로컬 사진이 남지 않습니다.

- [x] **Step 7: Update the Track A validation checklist**

  `docs/plans/resume-builder-validation.md`의 사전 점검에 다음 조건을 추가합니다.

  - 사진을 추가하지 않은 참가자가 기존 흐름을 그대로 완주할 수 있습니다.
  - 사진을 추가한 참가자는 설명과 대표사진 선택을 수정할 수 있습니다.
  - 일반 PDF와 리뷰용 PDF가 명세의 사진 노출 규칙을 따릅니다.
  - 네트워크 감시 검증기는 의도적인 요청에서 먼저 실패한 뒤 실제 흐름에서 외부 전송 0건을 확인합니다.
  - 세션 종료 뒤 참가자 기기에서 저장된 초안과 사진을 삭제할 수 있습니다.

- [x] **Step 8: Verify the documentation diff**

  Run: `git diff --check -- docs/plans/resume-builder-validation.md docs/specs/resume-restaurant-metadata-and-local-media.md docs/plans/resume-restaurant-metadata-and-local-media.md`

  Expected: exit 0 with no whitespace errors.

- [ ] **Step 9: Commit the acceptance checklist**

  ```bash
  git add docs/plans/resume-builder-validation.md docs/specs/resume-restaurant-metadata-and-local-media.md docs/plans/resume-restaurant-metadata-and-local-media.md
  git commit -m "docs(resume): define local portfolio validation"
  ```

## Final Verification

- [x] Run: `pnpm test`
- [x] Run: `pnpm lint`
- [x] Run: `pnpm build`
- [x] Run: `git diff --check`
- [x] Confirm that `git status --short` contains only the intended implementation and documentation paths.
- [x] Confirm in the browser that no photo data leaves the local origin during add, save, restore, preview, print, delete, and review-copy flows.
- [x] Confirm that `public/culinaryagents.json` is absent from the index and the feature diff.

## Spec Coverage Review

- Task 1 covers the schema, validation, draft version, migration, and review identity rule.
- Task 2 covers file limits, decoding, resizing, JPEG normalization, and metadata removal.
- Task 3 covers IndexedDB persistence and orphan reconciliation.
- Task 4 covers restaurant metadata, profile photo, per-career galleries, descriptions, limits, and representative selection.
- Task 5 covers restore, deletion, broken references, Object URL cleanup, preview, review copy, and PDF layout.
- Task 6 covers real-browser persistence, failure paths, network privacy, deletion, and Track A readiness.
- Online publication and personal menu photos have no implementation task because the specification explicitly defers them.
