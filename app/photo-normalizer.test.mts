import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_SOURCE_PHOTO_BYTES,
  getScaledDimensions,
  validatePhotoFile,
} from "./photo-normalizer.mts";

test("rejects source photos larger than 20 MB", () => {
  assert.equal(
    validatePhotoFile({
      name: "large.jpg",
      size: MAX_SOURCE_PHOTO_BYTES + 1,
      type: "image/jpeg",
    }),
    "사진은 20 MB 이하인 파일을 선택해 주세요.",
  );
});

test("rejects empty, animated and vector image files", () => {
  assert.equal(
    validatePhotoFile({ name: "empty.jpg", size: 0, type: "image/jpeg" }),
    "내용이 있는 사진 파일을 선택해 주세요.",
  );
  assert.equal(
    validatePhotoFile({ name: "moving.gif", size: 100, type: "image/gif" }),
    "JPEG, PNG, WebP, HEIC 또는 HEIF 사진을 선택해 주세요.",
  );
  assert.equal(
    validatePhotoFile({ name: "vector.svg", size: 100, type: "image/svg+xml" }),
    "JPEG, PNG, WebP, HEIC 또는 HEIF 사진을 선택해 주세요.",
  );
});

test("accepts the declared still photo types", () => {
  for (const type of [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]) {
    assert.equal(
      validatePhotoFile({ name: "photo", size: 100, type }),
      null,
    );
  }
});

test("scales the longest photo edge to 1600 pixels", () => {
  assert.deepEqual(getScaledDimensions(4000, 3000, 1600), {
    width: 1600,
    height: 1200,
  });
  assert.deepEqual(getScaledDimensions(3000, 4000, 1600), {
    width: 1200,
    height: 1600,
  });
});

test("does not enlarge photos below the edge limit", () => {
  assert.deepEqual(getScaledDimensions(800, 600, 1600), {
    width: 800,
    height: 600,
  });
});

test("rejects invalid photo dimensions", () => {
  assert.throws(
    () => getScaledDimensions(0, 600, 1600),
    /사진 크기를 확인할 수 없습니다/,
  );
});
