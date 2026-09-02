export type NhisTextItem = {
  str: string;
  transform: readonly number[];
};

export type NhisTextPage = {
  width: number;
  height: number;
  items: readonly NhisTextItem[];
};

export type NhisQualificationRecord = {
  legalEmployer: string;
  qualificationStart: string;
  qualificationEnd: string;
};

export type NhisQualificationParseResult =
  | {
      status: "success";
      records: NhisQualificationRecord[];
    }
  | {
      status: "manual-fallback";
      reason: "unsupported-layout";
    };

export type NhisPdfImportResult =
  | NhisQualificationParseResult
  | {
      status: "password-error";
    }
  | {
      status: "manual-fallback";
      reason: "invalid-pdf";
    };

const MAX_PAGES = 10;
const MAX_SERIAL_ROWS_PER_PAGE = 20;
const MAX_TEXT_ITEMS_PER_PAGE = 5_000;
export const MAX_NHIS_PDF_BYTES = 10 * 1024 * 1024;
const TABLE_BOTTOM = 250;
const TABLE_TOP_OFFSET = 5;
const ROW_TOLERANCE = 1.5;

function normalizeLabel(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, "");
}

function itemX(item: NhisTextItem) {
  return item.transform[4];
}

function itemY(item: NhisTextItem) {
  return item.transform[5];
}

function findLabel(items: readonly NhisTextItem[], label: string) {
  return items.find((item) => normalizeLabel(item.str) === label);
}

function isExpectedPage(page: NhisTextPage) {
  if (
    page.items.length > MAX_TEXT_ITEMS_PER_PAGE ||
    page.width < 590 ||
    page.width > 600 ||
    page.height < 835 ||
    page.height > 845
  ) {
    return false;
  }

  const title = findLabel(page.items, "건강보험자격득실확인서");
  const subscriber = findLabel(page.items, "가입자구분");
  const employer = findLabel(page.items, "사업장명칭");
  const acquired = findLabel(page.items, "자격취득일");
  const lost = findLabel(page.items, "자격상실일");

  if (!title || !subscriber || !employer || !acquired || !lost) {
    return false;
  }

  const headerY = itemY(employer);

  return (
    itemX(title) >= 170 &&
    itemX(title) <= 210 &&
    itemY(title) >= 700 &&
    itemY(title) <= 735 &&
    itemX(subscriber) >= 65 &&
    itemX(subscriber) <= 95 &&
    itemX(employer) >= 210 &&
    itemX(employer) <= 255 &&
    itemX(acquired) >= 370 &&
    itemX(acquired) <= 415 &&
    itemX(lost) >= 465 &&
    itemX(lost) <= 510 &&
    headerY >= 580 &&
    headerY <= 610 &&
    Math.abs(itemY(subscriber) - headerY) <= ROW_TOLERANCE &&
    Math.abs(itemY(acquired) - headerY) <= ROW_TOLERANCE &&
    Math.abs(itemY(lost) - headerY) <= ROW_TOLERANCE
  );
}

function joinText(items: readonly NhisTextItem[]) {
  return [...items]
    .sort((left, right) => itemX(left) - itemX(right))
    .map((item) => item.str)
    .join("")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCertificateDate(value: string) {
  const normalized = normalizeLabel(value);
  const match = /^(\d{4})[./-](\d{2})[./-](\d{2})$/.exec(normalized);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

export function parseNhisQualificationPages(
  pages: readonly NhisTextPage[],
): NhisQualificationParseResult {
  const fallback = {
    status: "manual-fallback" as const,
    reason: "unsupported-layout" as const,
  };

  if (
    pages.length === 0 ||
    pages.length > MAX_PAGES ||
    pages.some((page) => !isExpectedPage(page))
  ) {
    return fallback;
  }

  const records: NhisQualificationRecord[] = [];

  for (const page of pages) {
    const subscriberHeader = findLabel(page.items, "가입자구분");
    const employerHeader = findLabel(page.items, "사업장명칭");
    const acquiredHeader = findLabel(page.items, "자격취득일");
    const lostHeader = findLabel(page.items, "자격상실일");

    if (!subscriberHeader || !employerHeader || !acquiredHeader || !lostHeader) {
      return fallback;
    }

    const subscriberBoundary =
      (itemX(subscriberHeader) + itemX(employerHeader)) / 2;
    const acquiredBoundary =
      (itemX(employerHeader) + itemX(acquiredHeader)) / 2;
    const lostBoundary = (itemX(acquiredHeader) + itemX(lostHeader)) / 2;
    const headerY = itemY(employerHeader);
    const serialItems = page.items
      .filter((item) => {
        const x = itemX(item);
        const y = itemY(item);

        return (
          x >= 35 &&
          x <= 55 &&
          y > TABLE_BOTTOM &&
          y < headerY - TABLE_TOP_OFFSET &&
          /^\d{1,3}$/.test(normalizeLabel(item.str))
        );
      })
      .sort((left, right) => itemY(right) - itemY(left));
    const serialNumbers = serialItems.map((item) =>
      Number(normalizeLabel(item.str)),
    );

    if (
      serialItems.length > MAX_SERIAL_ROWS_PER_PAGE ||
      serialNumbers.some(
        (value, index) =>
          index > 0 && value !== serialNumbers[index - 1] + 1,
      ) ||
      serialItems.some(
        (item, index) =>
          index > 0 &&
          Math.abs(itemY(item) - itemY(serialItems[index - 1])) <= ROW_TOLERANCE,
      )
    ) {
      return fallback;
    }

    if (serialItems.length === 0) {
      if (!findLabel(page.items, "이하여백")) {
        return fallback;
      }

      continue;
    }

    for (const serialItem of serialItems) {
      const rowY = itemY(serialItem);
      const rowItems = page.items.filter(
        (item) => Math.abs(itemY(item) - rowY) <= ROW_TOLERANCE,
      );
      const subscriberType = joinText(
        rowItems.filter((item) => {
          const x = itemX(item);
          return x > 55 && x < subscriberBoundary;
        }),
      );

      if (normalizeLabel(subscriberType) !== "직장가입자") {
        continue;
      }

      const legalEmployer = joinText(
        rowItems.filter((item) => {
          const x = itemX(item);
          return x >= subscriberBoundary && x < acquiredBoundary;
        }),
      );
      const acquiredText = joinText(
        rowItems.filter((item) => {
          const x = itemX(item);
          return x >= acquiredBoundary && x < lostBoundary;
        }),
      );
      const lostText = joinText(
        rowItems.filter((item) => itemX(item) >= lostBoundary),
      );
      const qualificationStart = parseCertificateDate(acquiredText);
      const qualificationEnd = lostText
        ? parseCertificateDate(lostText)
        : "";

      if (
        !legalEmployer ||
        !qualificationStart ||
        qualificationEnd === null ||
        (qualificationEnd && qualificationEnd < qualificationStart)
      ) {
        return fallback;
      }

      records.push({
        legalEmployer,
        qualificationStart,
        qualificationEnd,
      });
    }
  }

  return records.length > 0 ? { status: "success", records } : fallback;
}

export async function importNhisQualificationPdf(
  file: File,
  password: string,
): Promise<NhisPdfImportResult> {
  if (file.size === 0 || file.size > MAX_NHIS_PDF_BYTES) {
    return { status: "manual-fallback", reason: "invalid-pdf" };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const hasPdfHeader =
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d;

    if (!hasPdfHeader) {
      return { status: "manual-fallback", reason: "invalid-pdf" };
    }

    const pdfjs = await import("pdfjs-dist/webpack.mjs");
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      password,
      disableFontFace: true,
      enableXfa: false,
      isImageDecoderSupported: false,
      isOffscreenCanvasSupported: false,
      maxImageSize: 0,
      stopAtErrors: true,
      useSystemFonts: false,
      useWasm: false,
      useWorkerFetch: false,
      verbosity: 0,
    });

    try {
      const pdf = await loadingTask.promise;

      if (pdf.numPages === 0 || pdf.numPages > MAX_PAGES) {
        return { status: "manual-fallback", reason: "unsupported-layout" };
      }

      const pages: NhisTextPage[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const [left, bottom, right, top] = page.view;

        if (content.items.length > MAX_TEXT_ITEMS_PER_PAGE) {
          return { status: "manual-fallback", reason: "unsupported-layout" };
        }

        pages.push({
          width: right - left,
          height: top - bottom,
          items: content.items.flatMap((item) =>
            "str" in item && item.transform.length >= 6
              ? [{ str: item.str, transform: item.transform }]
              : [],
          ),
        });
      }

      return parseNhisQualificationPages(pages);
    } catch (error) {
      if (error instanceof pdfjs.PasswordException) {
        return { status: "password-error" };
      }

      return { status: "manual-fallback", reason: "invalid-pdf" };
    } finally {
      await loadingTask.destroy();
    }
  } catch {
    return { status: "manual-fallback", reason: "invalid-pdf" };
  }
}
