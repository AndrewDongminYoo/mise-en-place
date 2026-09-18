import { PROVENANCE_LABELS } from "./resume-model.mts";

export function ProvenanceTag({
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
