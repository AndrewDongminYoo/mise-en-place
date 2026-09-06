import type { NormalizedPhoto } from "./photo-normalizer.mts";

export const LOCAL_PHOTO_DATABASE_NAME = "mise-en-place-media";
export const LOCAL_PHOTO_STORE_NAME = "photos";

const LOCAL_PHOTO_DATABASE_VERSION = 1;

export type LocalPhotoAsset = NormalizedPhoto & {
  id: string;
  createdAt: string;
};

let fallbackPhotoId = 0;

function createPhotoId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  fallbackPhotoId += 1;
  return `photo-${Date.now()}-${fallbackPhotoId}`;
}

function resolveIndexedDb(indexedDB?: IDBFactory): IDBFactory {
  const factory = indexedDB ?? globalThis.indexedDB;

  if (!factory) {
    throw new Error("이 브라우저에서는 사진 저장소를 사용할 수 없습니다.");
  }

  return factory;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("사진 저장소 요청에 실패했습니다."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(
        transaction.error ?? new Error("사진 저장소 작업이 중단되었습니다."),
      );
    transaction.onerror = () =>
      reject(
        transaction.error ?? new Error("사진 저장소 작업에 실패했습니다."),
      );
  });
}

function openPhotoDatabase(indexedDB?: IDBFactory): Promise<IDBDatabase> {
  const factory = resolveIndexedDb(indexedDB);

  return new Promise((resolve, reject) => {
    const request = factory.open(
      LOCAL_PHOTO_DATABASE_NAME,
      LOCAL_PHOTO_DATABASE_VERSION,
    );

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(LOCAL_PHOTO_STORE_NAME)) {
        request.result.createObjectStore(LOCAL_PHOTO_STORE_NAME, {
          keyPath: "id",
        });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ?? new Error("사진 저장소를 열지 못했습니다."),
      );
    request.onblocked = () =>
      reject(new Error("열려 있는 다른 탭 때문에 사진 저장소를 열지 못했습니다."));
  });
}

function isLocalPhotoAsset(value: unknown): value is LocalPhotoAsset {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const asset = value as Partial<LocalPhotoAsset>;

  return (
    typeof asset.id === "string" &&
    asset.id.length > 0 &&
    asset.blob instanceof Blob &&
    asset.mimeType === "image/jpeg" &&
    typeof asset.width === "number" &&
    asset.width > 0 &&
    typeof asset.height === "number" &&
    asset.height > 0 &&
    typeof asset.byteLength === "number" &&
    asset.byteLength === asset.blob.size &&
    typeof asset.createdAt === "string"
  );
}

export function reconcilePhotoAssetIds(
  referencedIds: readonly string[],
  storedIds: readonly string[],
): { missingIds: string[]; orphanedIds: string[] } {
  const referenced = [...new Set(referencedIds)];
  const stored = [...new Set(storedIds)];
  const referencedSet = new Set(referenced);
  const storedSet = new Set(stored);

  return {
    missingIds: referenced.filter((id) => !storedSet.has(id)),
    orphanedIds: stored.filter((id) => !referencedSet.has(id)),
  };
}

export async function deleteLocalDraftAndPhotos(
  removeDraft: () => void,
  clearPhotos: () => Promise<void>,
): Promise<void> {
  removeDraft();
  await clearPhotos();
}

export async function savePhotoAsset(
  photo: NormalizedPhoto,
  indexedDB?: IDBFactory,
): Promise<LocalPhotoAsset> {
  const database = await openPhotoDatabase(indexedDB);
  const asset: LocalPhotoAsset = {
    ...photo,
    id: createPhotoId(),
    createdAt: new Date().toISOString(),
  };

  try {
    const transaction = database.transaction(
      LOCAL_PHOTO_STORE_NAME,
      "readwrite",
    );
    const completed = transactionDone(transaction);
    const request = transaction.objectStore(LOCAL_PHOTO_STORE_NAME).put(asset);

    await requestResult(request);
    await completed;
    return asset;
  } finally {
    database.close();
  }
}

export async function getPhotoAssets(
  ids: readonly string[],
  indexedDB?: IDBFactory,
): Promise<Map<string, LocalPhotoAsset>> {
  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const database = await openPhotoDatabase(indexedDB);

  try {
    const transaction = database.transaction(LOCAL_PHOTO_STORE_NAME, "readonly");
    const completed = transactionDone(transaction);
    const store = transaction.objectStore(LOCAL_PHOTO_STORE_NAME);
    const values = await Promise.all(
      uniqueIds.map((id) => requestResult(store.get(id))),
    );

    await completed;

    const assets = new Map<string, LocalPhotoAsset>();

    values.forEach((value) => {
      if (isLocalPhotoAsset(value)) {
        assets.set(value.id, value);
      }
    });

    return assets;
  } finally {
    database.close();
  }
}

export async function deletePhotoAsset(
  id: string,
  indexedDB?: IDBFactory,
): Promise<void> {
  const database = await openPhotoDatabase(indexedDB);

  try {
    const transaction = database.transaction(
      LOCAL_PHOTO_STORE_NAME,
      "readwrite",
    );
    const completed = transactionDone(transaction);
    const request = transaction.objectStore(LOCAL_PHOTO_STORE_NAME).delete(id);

    await requestResult(request);
    await completed;
  } finally {
    database.close();
  }
}

export async function clearPhotoAssets(
  indexedDB?: IDBFactory,
): Promise<void> {
  const database = await openPhotoDatabase(indexedDB);

  try {
    const transaction = database.transaction(
      LOCAL_PHOTO_STORE_NAME,
      "readwrite",
    );
    const completed = transactionDone(transaction);
    const request = transaction.objectStore(LOCAL_PHOTO_STORE_NAME).clear();

    await requestResult(request);
    await completed;
  } finally {
    database.close();
  }
}

export async function deleteOrphanedPhotoAssets(
  referencedIds: readonly string[],
  indexedDB?: IDBFactory,
): Promise<{ missingIds: string[]; deletedOrphanIds: string[] }> {
  const database = await openPhotoDatabase(indexedDB);

  try {
    const readTransaction = database.transaction(
      LOCAL_PHOTO_STORE_NAME,
      "readonly",
    );
    const readCompleted = transactionDone(readTransaction);
    const keys = await requestResult(
      readTransaction.objectStore(LOCAL_PHOTO_STORE_NAME).getAllKeys(),
    );

    await readCompleted;

    const storedIds = keys.filter((key): key is string => typeof key === "string");
    const { missingIds, orphanedIds } = reconcilePhotoAssetIds(
      referencedIds,
      storedIds,
    );

    if (orphanedIds.length === 0) {
      return { missingIds, deletedOrphanIds: [] };
    }

    const deleteTransaction = database.transaction(
      LOCAL_PHOTO_STORE_NAME,
      "readwrite",
    );
    const deleteCompleted = transactionDone(deleteTransaction);
    const store = deleteTransaction.objectStore(LOCAL_PHOTO_STORE_NAME);

    await Promise.all(
      orphanedIds.map((id) => requestResult(store.delete(id))),
    );
    await deleteCompleted;

    return { missingIds, deletedOrphanIds: orphanedIds };
  } finally {
    database.close();
  }
}
