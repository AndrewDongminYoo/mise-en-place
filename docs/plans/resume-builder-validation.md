# Resume Builder Validation Plan

## Goal

Validate whether a chef-specific resume workflow helps culinary professionals complete and use a stronger resume before building a hiring marketplace.

## Success Criteria

Use the complete Track A gate in `docs/specs/initial-product-scope.md`.
The behavioral targets are:

- At least 7 of 10 participating culinary professionals complete a resume.
- At least 5 participants use the resume in an application or state that they intend to use it.
- At least 3 participants choose private profile storage for future hiring contact.

The prototype must also prove that one selected document layout can provide an editable employment skeleton without sending the source document to a server.

## Step 1: Validate Real Documents Locally

Start with one consented, locally held certificate from the National Health Insurance Service direct issuance flow.
Use that certificate to implement a narrow browser-local diagnostic for one candidate layout.
Do not label the layout as supported until at least 5 usable cases pass this step.

Ask 5 to 10 former or current culinary professionals to run the diagnostic with their own directly issued certificate.
Ask each participant to keep the default resident-registration-number masking enabled.
The diagnostic must not upload the PDF, password, or extracted text.
If debugging requires a redacted sample, agree on the purpose, access, retention period, and deletion point before accepting it.
Do not commit sample documents or extracted personal data to this repository.

For each sample, record only:

- Issuing service and document name.
- Whether text can be extracted in the browser.
- Whether a password, encryption, scan, or unusual layout blocks extraction.
- Available employer and date fields.
- Layout differences that affect extraction.
- Whether the participant confirms all extracted rows or needs corrections or exclusions.

Use the direct-issued, password-protected text PDF with the `가입자 구분`, `사업장 명칭`, `자격 취득일`, and `자격 상실일` table headers as the diagnostic candidate.
Route every other format to manual entry.

Verify this step by confirming that:

- At least 5 usable, consented certificates were processed on participant devices.
- One exact layout and its target fields were selected.
- Each participant could inspect the real employer and date rows before reporting the outcome.
- The repository contains no sample document or personal document content.

## Step 2: Test the Four-Step Workflow

Create a low-fidelity prototype with:

1. Document import or manual entry.
2. Extracted employment-record confirmation.
3. Culinary-career enrichment.
4. Resume preview and PDF output.

The first prototype can simulate extraction manually.
Test the questions and correction flow before investing in parser coverage.
Every imported field must remain editable, and every employment record must be excludable.

Verify this step with a walkthrough that proves:

- Original employer name and restaurant display name remain separate.
- Qualification dates and person-confirmed employment dates remain separate.
- Role, station, up to 3 primary responsibilities, skills, equipment, and representative experience can be entered.
- Imported, confirmed, and authored fields have distinct labels.
- Extraction failure reaches manual entry without blocking completion.

## Step 3: Run Moderated Completion Tests

Run the workflow with 10 culinary professionals.
Observe where each participant stops, needs help, changes an imported field, or cannot describe a culinary-career detail.
Do not add a field because one participant requests it.
Add or promote a structured field only when repeated evidence shows that it affects completion or resume usefulness.

Record:

- Resume completion.
- Extraction success or manual fallback.
- Corrected and excluded records.
- Fields that block completion.
- Whether the participant uses or intends to use the output in an application.
- The separate talent-pool choice made after completion.

Do not record source-document text, resident registration numbers, certificate numbers, or unrelated personal data in analytics or research notes.

Verify this step by reconciling all 10 participant outcomes against the Track A gate.

## Step 4: Decide the Next Slice

If the Track A gate passes, plan the smallest production resume-authoring slice and specify the required resume-review workflow.
Define a consented profile return, withdrawal, and deletion flow before enabling server-side talent-pool persistence.

If the gate does not pass, use the observed failure point to decide whether to revise the questions, remove document import, or stop.
Do not add OCR, another document adapter, multiple templates, or AI writing to compensate for an unproven core workflow.

Track A results do not authorize or validate the hiring-network work in `docs/plans/founding-cohort-validation.md`.
