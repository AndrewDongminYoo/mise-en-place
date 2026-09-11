import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const printStyles = styles.slice(styles.lastIndexOf("@media print"));

test("disables the preview entrance animation while printing", () => {
  assert.match(
    printStyles,
    /\.preview-stack\s*\{[^}]*animation:\s*none;/,
    "print styles must not capture the preview while it is still transparent",
  );
});
