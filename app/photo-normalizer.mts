export const MAX_SOURCE_PHOTO_BYTES = 20 * 1024 * 1024;
export const MAX_STORED_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_PHOTO_EDGE = 1600;

const MIN_PHOTO_EDGE = 960;
const JPEG_QUALITIES = [0.85, 0.75, 0.65] as const;
const ACCEPTED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type PhotoFileDescriptor = Pick<File, "name" | "size" | "type">;

export type NormalizedPhoto = {
  blob: Blob;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  byteLength: number;
};

export function validatePhotoFile(file: PhotoFileDescriptor): string | null {
  if (file.size === 0) {
    return "내용이 있는 사진 파일을 선택해 주세요.";
  }

  if (file.size > MAX_SOURCE_PHOTO_BYTES) {
    return "사진은 20 MB 이하인 파일을 선택해 주세요.";
  }

  if (!ACCEPTED_PHOTO_TYPES.has(file.type.toLowerCase())) {
    return "JPEG, PNG, WebP, HEIC 또는 HEIF 사진을 선택해 주세요.";
  }

  return null;
}

export function getScaledDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0 || maxEdge <= 0) {
    throw new Error("사진 크기를 확인할 수 없습니다.");
  }

  const longestEdge = Math.max(width, height);

  if (longestEdge <= maxEdge) {
    return { width, height };
  }

  const scale = maxEdge / longestEdge;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImage(file: File): Promise<{
  image: HTMLImageElement;
  objectUrl: string;
}> {
  if (typeof Image === "undefined" || typeof URL === "undefined") {
    return Promise.reject(
      new Error("이 브라우저에서는 사진을 처리할 수 없습니다."),
    );
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "이 브라우저에서 사진을 읽을 수 없습니다. 다른 형식으로 다시 선택해 주세요.",
        ),
      );
    };
    image.src = objectUrl;
  });
}

function encodeJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("사진을 JPEG로 변환하지 못했습니다."));
      },
      "image/jpeg",
      quality,
    );
  });
}

function drawPhoto(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("이 브라우저에서는 사진을 변환할 수 없습니다.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
}

export async function normalizePhoto(file: File): Promise<NormalizedPhoto> {
  const fileError = validatePhotoFile(file);

  if (fileError) {
    throw new Error(fileError);
  }

  if (typeof document === "undefined") {
    throw new Error("이 브라우저에서는 사진을 처리할 수 없습니다.");
  }

  const { image, objectUrl } = await loadImage(file);

  try {
    let dimensions = getScaledDimensions(
      image.naturalWidth,
      image.naturalHeight,
      MAX_PHOTO_EDGE,
    );
    const canvas = document.createElement("canvas");

    while (true) {
      drawPhoto(canvas, image, dimensions.width, dimensions.height);

      for (const quality of JPEG_QUALITIES) {
        const blob = await encodeJpeg(canvas, quality);

        if (blob.size <= MAX_STORED_PHOTO_BYTES) {
          return {
            blob,
            mimeType: "image/jpeg",
            width: dimensions.width,
            height: dimensions.height,
            byteLength: blob.size,
          };
        }
      }

      const longestEdge = Math.max(dimensions.width, dimensions.height);

      if (longestEdge <= MIN_PHOTO_EDGE) {
        break;
      }

      dimensions = getScaledDimensions(
        dimensions.width,
        dimensions.height,
        Math.max(MIN_PHOTO_EDGE, Math.floor(longestEdge * 0.85)),
      );
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  throw new Error(
    "사진을 2 MB 이하로 줄이지 못했습니다. 다른 사진을 선택해 주세요.",
  );
}
