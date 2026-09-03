# Resume Builder Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task. Do not delegate this plan.

**Goal:** Build a browser-local four-step chef resume prototype that supports manual entry, clearly labeled demo data, culinary-career enrichment, print-to-PDF output, and a separate private talent-pool choice.

**Architecture:** Keep the page as one Client Component because the workflow uses only local React state and browser APIs. Put domain types, validation, and bounded selection logic in one pure TypeScript module so the Node test runner can verify behavior without a UI test dependency. Do not parse or retain PDF content until real document samples define one supported format.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript 5, Tailwind CSS 4 with project-owned global CSS, and the Node 24 test runner.

**Spec:** `docs/specs/initial-product-scope.md`

## Global Constraints

- Keep the original PDF on the device.
- Do not upload, parse, persist, log, or preview the selected PDF in this slice.
- Clear the file input after reading its name and size.
- Use manual entry and clearly labeled demo data as the only ways to create employment records.
- Preserve the original employer name separately from the restaurant display name.
- Distinguish imported, confirmed, and authored fields.
- Keep talent-pool participation separate and private by default.
- Render all user-authored values through React text interpolation.
- Do not use `dangerouslySetInnerHTML`, browser storage, network requests, third-party scripts, or a new dependency.
  The browser-storage half of this constraint governed this plan's tasks, which are complete.
  On 2026-09-03 the operator approved storing the confirmed structured record in `localStorage` so a draft survives a reload; the source document, its extracted text and its password are still never stored.
  `docs/specs/initial-product-scope.md` is unchanged by that, because its prohibition names the source document rather than the confirmed record.
- Do not commit during this task.

## Design Contract

- Purpose: Let one culinary professional complete a useful resume without a marketplace or account.
- Audience: Korean culinary professionals who may complete the workflow on a phone or laptop.
- Success condition: A user can complete all four steps, print one resume, and make a separate talent-pool choice without sending data off the device.
- Viewports: Use one responsive flow from 360 px mobile width through wide desktop layouts.
- Layout: Use a narrow workflow rail beside a focused work surface on desktop. Stack the rail above the work surface on mobile.
- Typography: Use the installed Geist font for interface text and a restrained serif stack for editorial headings and resume display text.
- Color: Use warm paper, dark ink, muted steel, and one kitchen-red accent. Do not add a dark theme in this slice.
- Surfaces: Use flat paper surfaces, thin rules, and limited shadow. Do not use glass effects or generic equal-card grids.
- Motion: Use one restrained step transition and button feedback. Respect `prefers-reduced-motion`.
- Imagery: Do not add images or icons that need external assets. Use small inline SVG marks only when they communicate an action.
- Print: Hide application controls and print only the resume sheet on white paper.

---

### Task 1: Domain Model and Validation

**Files:**

- Create: `app/resume-model.test.mts`
- Create: `app/resume-model.mts`
- Modify: `tsconfig.json`

**Interfaces:**

- Produces: `CareerEntry`, `ResumeIdentity`, `TalentPoolChoice`, `createBlankCareerEntry()`, `createDemoCareerEntries()`, `toggleBoundedChoice()`, `getCareerErrors()`, `getEnrichmentErrors()`, and `formatMonthRange()`.
- Consumes: No application module.

- [x] **Step 1: Allow explicit TypeScript extensions in no-emit imports.**

Add `"allowImportingTsExtensions": true` to `compilerOptions` in `tsconfig.json`.

- [x] **Step 2: Write the failing domain tests.**

Create `app/resume-model.test.mts` with Node tests for these behaviors:

```typescript
test("limits primary responsibilities to three choices", () => {
  const selected = ["서비스 준비", "스테이션 운영", "발주·재고"];

  assert.deepEqual(
    toggleBoundedChoice(selected, "메뉴 개발", 3),
    selected,
  );
});

test("requires one complete included career before confirmation", () => {
  const entry = createBlankCareerEntry("manual");

  assert.deepEqual(getCareerErrors([entry]), [
    "이력서에 사용할 경력을 한 개 이상 완성해 주세요.",
  ]);
});

test("formats an open employment period as current", () => {
  assert.equal(formatMonthRange("2024-03", ""), "2024.03 - 현재");
});
```

- [x] **Step 3: Run the tests and verify the expected failure.**

Run:

```bash
node --experimental-strip-types --test app/resume-model.test.mts
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `app/resume-model.mts`.

- [x] **Step 4: Implement the smallest domain module.**

The module must:

- Create stable client-only record IDs with `crypto.randomUUID()` when available and a timestamp fallback.
- Keep document and manual origins explicit.
- Keep qualification dates separate from person-confirmed employment dates.
- Reject a fourth bounded choice without changing the existing array.
- Require one included career with a restaurant display name and actual start month.
- Require a resume name, headline, role, and one responsibility for each included career before preview.
- Format `YYYY-MM` values as `YYYY.MM` and an empty end month as `현재`.

- [x] **Step 5: Run the domain tests and TypeScript check.**

Run:

```bash
node --experimental-strip-types --test app/resume-model.test.mts
pnpm exec tsc --noEmit
```

Expected: All tests pass and TypeScript reports no errors.

### Task 2: Four-Step Browser Workflow

**Files:**

- Modify: `app/page.tsx`

**Interfaces:**

- Consumes: Every interface from `app/resume-model.mts`.
- Produces: One local-only wizard with four steps and one printable resume preview.

- [x] **Step 1: Record the failing surface check against the scaffold.**

Run the current app and confirm that the page does not contain the product heading `경력을 요리의 언어로 정리하세요`.

- [x] **Step 2: Replace the scaffold with one Client Component.**

The component must implement:

1. A start screen with PDF selection, demo data, and manual entry.
2. Career confirmation with editable original employer, restaurant name, qualification dates, actual dates, inclusion, and additional manual records.
3. Culinary enrichment with name, headline, contact fields, role, stations, up to 3 responsibilities, skills, equipment, and representative experience.
4. A resume preview with provenance labels, print action, edit action, and the separate talent-pool choice.

- [x] **Step 3: Keep the file path local and honest.**

The file handler must:

- Reject non-PDF selections with an accessible inline error.
- Read only the selected file name and byte size.
- Clear `event.currentTarget.value` before returning.
- State that automatic extraction is not active and route the user to manual entry.
- Never retain a `File`, object URL, byte buffer, or extracted text in React state.

- [x] **Step 4: Add accessible state transitions.**

The component must:

- Use native buttons, labels, fieldsets, legends, inputs, textareas, and radio controls.
- Move focus to the current step heading after a successful transition.
- Announce validation errors with `role="alert"`.
- Prevent preview until `getEnrichmentErrors()` returns an empty array.
- Keep the talent-pool choice at `resume-only` until the user changes it.

- [x] **Step 5: Run the domain tests, lint, and TypeScript check.**

Run:

```bash
node --experimental-strip-types --test app/resume-model.test.mts
pnpm lint
pnpm exec tsc --noEmit
```

Expected: All commands exit with code 0.

### Task 3: Visual System, Metadata, and Print

**Files:**

- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**

- Consumes: The semantic class names and document structure in `app/page.tsx`.
- Produces: The responsive visual system, focus states, reduced-motion behavior, and print layout.

- [x] **Step 1: Replace the scaffold styles with the design contract.**

Use CSS custom properties for color, spacing, typography, borders, and elevation.
Keep the existing Tailwind import, but use project-owned semantic classes for the product surface.

- [x] **Step 2: Add responsive and interaction states.**

The CSS must include:

- Desktop and mobile workflow layouts.
- Visible `:focus-visible` treatment.
- Hover, disabled, selected, error, and empty states.
- A `prefers-reduced-motion: reduce` override.
- Text wrapping for long employer and restaurant names.

- [x] **Step 3: Add print rules.**

The print stylesheet must:

- Hide navigation, forms, action buttons, notices, and talent-pool controls.
- Remove screen shadows and borders from the resume sheet.
- Use white paper and black text.
- Preserve career sections without avoidable page breaks.

- [x] **Step 4: Update document metadata.**

Set the document language to `ko`.
Set the title to `Mise en Place | 요리사 이력서`.
Set the description to `근무 이력을 요리사의 역할, 스테이션, 기술과 경험이 드러나는 이력서로 정리합니다.`.

- [x] **Step 5: Run static verification.**

Run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Expected: All commands exit with code 0 and the production build completes.

### Task 4: Real-Browser Verification

**Files:**

- Modify only a file that fails a verified scenario.

**Interfaces:**

- Consumes: The built application.
- Produces: Browser evidence for the complete local-only flow.

- [x] **Step 1: Start the development server.**

Run:

```bash
pnpm dev
```

Expected: The application is available on a reported localhost port.

- [x] **Step 2: Verify the manual-entry flow at a desktop viewport.**

Confirm that a user can:

1. Choose manual entry.
2. See validation before an incomplete career advances.
3. Complete one career.
4. Add culinary details.
5. Reach the resume preview.
6. See `이력서만 저장` selected by default.

- [x] **Step 3: Verify bounded choices and demo provenance.**

Confirm that a fourth primary responsibility cannot be selected.
Confirm that demo data is labeled as demo data.
Confirm that imported, confirmed, and authored labels appear in the preview.

- [x] **Step 4: Verify the file boundary.**

Select a local PDF and confirm that:

- The page reports that automatic extraction is not active.
- The file input is cleared.
- No application request contains the file or its contents.
- Manual entry remains available.

- [x] **Step 5: Verify responsive and print behavior.**

Check a 390 px mobile viewport and a desktop viewport.
Verify keyboard focus order and visible focus indicators.
Stub `window.print` in the browser, activate the print button, and confirm one call.
Inspect print media styles for the resume-only output.

- [x] **Step 6: Run the final gate and inspect the exact diff.**

Run:

```bash
node --experimental-strip-types --test app/resume-model.test.mts
pnpm lint
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Expected: Every command exits with code 0.
Confirm that the diff contains only the approved prototype, tests, metadata, styles, documentation, and TypeScript import setting.
