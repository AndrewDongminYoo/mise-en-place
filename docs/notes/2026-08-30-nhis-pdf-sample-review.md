# National Health Insurance PDF Sample Review

## Scope

A locally supplied National Health Insurance qualification certificate was reviewed.
The source file was not copied into the repository.
This note contains no extracted personal data.

## Observed Facts

- The document has two pages.
- The document is not encrypted.
- The visual layout has employer-name, qualification-acquisition-date, and qualification-loss-date columns.
- The employment table continues onto the second page.
- macOS PDFKit returned no page text.
- The file did not expose the required Korean field labels through a basic text-stream check.

## Decision

The evidence does not support a text-only parser for this sample.
The first slice must route this sample to manual entry.
Do not add OCR for this sample.

## Open Requirement

The supported text-based layout remains `[UNKNOWN]`.
Review at least five usable consented samples before selecting the first automatic-import layout.
