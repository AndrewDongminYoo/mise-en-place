import assert from "node:assert/strict";
import test from "node:test";

import {
  importNhisQualificationPdf,
  parseNhisQualificationPages,
  type NhisTextItem,
} from "./nhis-parser.mts";

function textItem(str: string, x: number, y: number): NhisTextItem {
  return { str, transform: [1, 0, 0, 1, x, y] };
}

function pageWithRows(
  rows: Array<{
    number: string;
    employer: string;
    acquiredOn: string;
    lostOn: string;
  }>,
) {
  const items = [
    textItem("건강보험 자격득실확인서", 189, 721.1),
    textItem("가입자 구분", 78, 595.1),
    textItem("사업장 명칭", 232.9, 595.1),
    textItem("자격 취득일", 391.7, 595.1),
    textItem("자격 상실일", 486.6, 595.1),
  ];

  rows.forEach((row, index) => {
    const y = 565.1 - index * 30.9;
    items.push(
      textItem(row.number, 46.6, y),
      textItem("직장가입자", 62.9, y),
      textItem(row.employer, 157, y),
      textItem(row.acquiredOn, 396.7, y),
      textItem(row.lostOn, 491.6, y),
    );
  });

  return { width: 595.3, height: 841.9, items };
}

test("extracts exact fields from the direct-issued NHIS layout", () => {
  const blankFinalPage = pageWithRows([]);
  blankFinalPage.items.push(textItem("이하 여백", 232.9, 565.1));
  const result = parseNhisQualificationPages([
    pageWithRows([
      {
        number: "1",
        employer: "주식회사 가상키친",
        acquiredOn: "2022.03.14",
        lostOn: "2023.08.21",
      },
    ]),
    pageWithRows([
      {
        number: "2",
        employer: "가상다이닝 유한회사",
        acquiredOn: "2023.09.01",
        lostOn: "",
      },
    ]),
    blankFinalPage,
  ]);

  assert.deepEqual(result, {
    status: "success",
    records: [
      {
        legalEmployer: "주식회사 가상키친",
        qualificationStart: "2022-03-14",
        qualificationEnd: "2023-08-21",
      },
      {
        legalEmployer: "가상다이닝 유한회사",
        qualificationStart: "2023-09-01",
        qualificationEnd: "",
      },
    ],
  });
});

test("falls back when a page has neither rows nor a blank marker", () => {
  assert.deepEqual(
    parseNhisQualificationPages([
      pageWithRows([
        {
          number: "1",
          employer: "주식회사 가상키친",
          acquiredOn: "2022.03.14",
          lostOn: "2023.08.21",
        },
      ]),
      pageWithRows([]),
    ]),
    {
      status: "manual-fallback",
      reason: "unsupported-layout",
    },
  );
});

test("falls back when qualification dates run backwards", () => {
  const page = pageWithRows([
    {
      number: "1",
      employer: "주식회사 가상키친",
      acquiredOn: "2023.03.14",
      lostOn: "2022.08.21",
    },
  ]);

  assert.deepEqual(parseNhisQualificationPages([page]), {
    status: "manual-fallback",
    reason: "unsupported-layout",
  });
});

test("falls back before scanning excessive candidate rows", () => {
  const page = pageWithRows([
    {
      number: "1",
      employer: "주식회사 가상키친",
      acquiredOn: "2022.03.14",
      lostOn: "2023.08.21",
    },
  ]);

  page.items.push(
    ...Array.from({ length: 21 }, (_, index) =>
      textItem(String((index % 9) + 1), 46.6, 550 - index * 10),
    ),
  );

  assert.deepEqual(parseNhisQualificationPages([page]), {
    status: "manual-fallback",
    reason: "unsupported-layout",
  });
});

test("falls back when one table row has duplicate serial text", () => {
  const page = pageWithRows([
    {
      number: "1",
      employer: "주식회사 가상키친",
      acquiredOn: "2022.03.14",
      lostOn: "2023.08.21",
    },
  ]);
  page.items.push(textItem("1", 46.6, 565.1));

  assert.deepEqual(parseNhisQualificationPages([page]), {
    status: "manual-fallback",
    reason: "unsupported-layout",
  });
});

test("falls back when separate table rows reuse one serial number", () => {
  const page = pageWithRows([
    {
      number: "1",
      employer: "주식회사 가상키친",
      acquiredOn: "2022.03.14",
      lostOn: "2023.08.21",
    },
    {
      number: "1",
      employer: "가상다이닝 유한회사",
      acquiredOn: "2023.09.01",
      lostOn: "",
    },
  ]);

  assert.deepEqual(parseNhisQualificationPages([page]), {
    status: "manual-fallback",
    reason: "unsupported-layout",
  });
});

test("falls back when serial numbering repeats or skips across pages", () => {
  for (const nextPageNumber of ["1", "3"]) {
    assert.deepEqual(
      parseNhisQualificationPages([
        pageWithRows([
          {
            number: "1",
            employer: "주식회사 가상키친",
            acquiredOn: "2022.03.14",
            lostOn: "2023.08.21",
          },
        ]),
        pageWithRows([
          {
            number: nextPageNumber,
            employer: "가상다이닝 유한회사",
            acquiredOn: "2023.09.01",
            lostOn: "",
          },
        ]),
      ]),
      {
        status: "manual-fallback",
        reason: "unsupported-layout",
      },
    );
  }
});

test("returns manual fallback instead of partially importing a mismatched row", () => {
  const page = pageWithRows([
    {
      number: "1",
      employer: "주식회사 가상키친",
      acquiredOn: "2022.03.14",
      lostOn: "날짜 형식 다름",
    },
  ]);

  assert.deepEqual(parseNhisQualificationPages([page]), {
    status: "manual-fallback",
    reason: "unsupported-layout",
  });
});

test("rejects a non-PDF payload before document parsing", async () => {
  const file = new File(["not a pdf"], "certificate.pdf", {
    type: "application/pdf",
  });

  assert.deepEqual(
    await importNhisQualificationPdf(file, "local-test-password"),
    {
      status: "manual-fallback",
      reason: "invalid-pdf",
    },
  );
});
