import assert from "node:assert/strict";
import test from "node:test";

import {
  deleteLocalDraftAndPhotos,
  reconcilePhotoAssetIds,
} from "./local-photo-store.mts";

test("finds missing references and orphaned stored photos", () => {
  assert.deepEqual(
    reconcilePhotoAssetIds(
      ["profile-a", "work-a", "missing-a"],
      ["profile-a", "work-a", "orphan-a"],
    ),
    {
      missingIds: ["missing-a"],
      orphanedIds: ["orphan-a"],
    },
  );
});

test("deduplicates ids while preserving their first order", () => {
  assert.deepEqual(
    reconcilePhotoAssetIds(
      ["work-b", "work-a", "work-b"],
      ["orphan-b", "work-a", "orphan-b", "orphan-a"],
    ),
    {
      missingIds: ["work-b"],
      orphanedIds: ["orphan-b", "orphan-a"],
    },
  );
});

test("keeps photos when removing the structured draft fails", async () => {
  const actions: string[] = [];

  await assert.rejects(
    deleteLocalDraftAndPhotos(
      () => {
        actions.push("remove-draft");
        throw new Error("draft storage unavailable");
      },
      async () => {
        actions.push("clear-photos");
      },
    ),
    /draft storage unavailable/,
  );

  assert.deepEqual(actions, ["remove-draft"]);
});

test("removes the draft before attempting to clear photos", async () => {
  const actions: string[] = [];

  await assert.rejects(
    deleteLocalDraftAndPhotos(
      () => {
        actions.push("remove-draft");
      },
      async () => {
        actions.push("clear-photos");
        throw new Error("photo storage unavailable");
      },
    ),
    /photo storage unavailable/,
  );

  assert.deepEqual(actions, ["remove-draft", "clear-photos"]);
});
