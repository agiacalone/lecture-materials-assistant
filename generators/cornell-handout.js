"use strict";

const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");
const { topicSlug } = require("../lib/context");

// Student handout palette — accessible WCAG AA, functional color use
const H = {
  bannerBg:     "2563EB",  // Medium blue — section headers
  bannerAccent: "1D4ED8",  // Darker blue — left accent stripe on banners
  bannerText:   "FFFFFF",
  bannerTime:   "BFDBFE",  // Light blue — time estimate in banner
  cueBg:        "EFF6FF",  // Light blue — cue column
  cueText:      "1F3864",  // Navy
  fillIn:       "FEF9C3",  // Yellow — universal fill-in convention
  scaffoldText: "374151",  // Dark gray
  tableAlt:     "F8FAFC",  // Very light gray — alternating comparison rows
  summaryBg:    "DBEAFE",  // Light blue — summary strip
  objBg:        "F0FDF4",  // Light green — objectives box
  objAccent:    "16A34A",  // Green — objectives left border
  vocabBg:      "F5F3FF",  // Light lavender — vocabulary terms
  vocabAccent:  "7C3AED",  // Purple — vocabulary border
  calloutBg:    "EFF6FF",  // Light blue — KEY callouts
  calloutAccent:"2563EB",  // Blue — KEY callout left border
};

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];

// --- Primitives ---

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after === undefined ? 60 : opts.after },
    bullet: opts.bullet ? { level: 0 } : undefined,
    alignment: opts.align || AlignmentType.LEFT,
    children: [
      new TextRun({
        text: String(text),
        font: "Arial",
        size: opts.size || 20,
        bold: Boolean(opts.bold),
        italics: Boolean(opts.italics),
        color: opts.color || "000000",
      }),
    ],
  });
}

function spacer(size = 80) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

function noBorder() {
  return { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
}

// --- Section banner with left accent stripe ---

function sectionBanner(title, index, minutes) {
  const roman = ROMAN[index] || String(index + 1);
  const timeStr = minutes ? `  (${minutes} min)` : "";
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder(),
      bottom: noBorder(),
      left: { style: BorderStyle.SINGLE, size: 36, color: H.bannerAccent },
      right: noBorder(),
      insideHorizontal: noBorder(),
      insideVertical: noBorder(),
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: H.bannerBg },
            margins: { top: 60, bottom: 60, left: 100, right: 80 },
            borders: {
              top: noBorder(), bottom: noBorder(),
              left: noBorder(), right: noBorder(),
            },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: `${roman}. ${title}`,
                    bold: true,
                    color: H.bannerText,
                    font: "Arial",
                    size: 24,
                  }),
                  new TextRun({
                    text: timeStr,
                    color: H.bannerTime,
                    font: "Arial",
                    size: 19,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// --- Objectives box ---

function objectivesBox(objectives) {
  if (!objectives || objectives.length === 0) return null;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder(), bottom: noBorder(), right: noBorder(),
      insideHorizontal: noBorder(), insideVertical: noBorder(),
      left: { style: BorderStyle.SINGLE, size: 36, color: H.objAccent },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: H.objBg },
            margins: { top: 60, bottom: 60, left: 100, right: 80 },
            borders: {
              top: noBorder(), bottom: noBorder(),
              left: noBorder(), right: noBorder(),
            },
            children: [
              para("Learning Objectives", { bold: true, color: H.cueText, size: 20, after: 60 }),
              ...objectives.map((obj) => para(`\u2022  ${obj}`, { color: H.scaffoldText, size: 18, after: 40 })),
              para("", { after: 0 }),
            ],
          }),
        ],
      }),
    ],
  });
}

// --- Vocabulary grid: 2 columns of (term | blank) pairs ---

function vocabularyGrid(terms) {
  if (!terms || terms.length === 0) return null;

  const half = Math.ceil(terms.length / 2);
  const col1 = terms.slice(0, half);
  const col2 = terms.slice(half);
  while (col2.length < col1.length) col2.push(null);

  function termCell(text) {
    return new TableCell({
      width: { size: 22, type: WidthType.PERCENTAGE },
      shading: { fill: H.vocabBg },
      margins: { top: 80, bottom: 80, left: 80, right: 40 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "E9D5FF" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "E9D5FF" },
        left: noBorder(), right: noBorder(),
      },
      children: [para(text, { bold: true, color: H.cueText, size: 18, after: 0 })],
    });
  }

  function blankCell() {
    return new TableCell({
      width: { size: 28, type: WidthType.PERCENTAGE },
      shading: { fill: H.fillIn },
      margins: { top: 80, bottom: 80, left: 80, right: 40 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "FEF08A" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "FEF08A" },
        left: noBorder(), right: noBorder(),
      },
      children: [para("\u00a0", { after: 240 })],  // space to type or write
    });
  }

  function emptyCell(pct) {
    return new TableCell({
      width: { size: pct, type: WidthType.PERCENTAGE },
      borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() },
      children: [para("", { after: 0 })],
    });
  }

  const dataRows = col1.map((term, i) => {
    const t2 = col2[i];
    return new TableRow({
      children: t2
        ? [termCell(term), blankCell(), termCell(t2), blankCell()]
        : [termCell(term), blankCell(), emptyCell(22), emptyCell(28)],
    });
  });

  const headerRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 4,
        shading: { fill: H.vocabBg },
        margins: { top: 50, bottom: 50, left: 80, right: 80 },
        borders: {
          top: noBorder(), right: noBorder(),
          left: { style: BorderStyle.SINGLE, size: 24, color: H.vocabAccent },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: "C4B5FD" },
        },
        children: [
          para("Vocabulary \u2014 fill in during lecture", {
            bold: true, color: H.cueText, size: 20, after: 0,
          }),
        ],
      }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideHorizontal: noBorder(), insideVertical: noBorder(),
    },
    rows: [headerRow, ...dataRows],
  });
}

// --- Cornell fill-in table ---

function cornellTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: noBorder(),
    },
    rows: rows.map(({ cue, notes, fillIn }) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 26, type: WidthType.PERCENTAGE },
            shading: { fill: H.cueBg },
            margins: { top: 80, bottom: 80, left: 80, right: 60 },
            borders: {
              top: noBorder(), bottom: noBorder(),
              left: { style: BorderStyle.SINGLE, size: 4, color: "BFDBFE" },
              right: noBorder(),
            },
            children: [para(cue, { bold: true, color: H.cueText, size: 18, after: 0 })],
          }),
          new TableCell({
            width: { size: 74, type: WidthType.PERCENTAGE },
            shading: fillIn ? { fill: H.fillIn } : undefined,
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            borders: {
              top: noBorder(), bottom: noBorder(), right: noBorder(),
              left: { style: BorderStyle.SINGLE, size: 16, color: H.bannerBg },
            },
            children: fillIn
              ? [
                  para(notes, { color: "374151", size: 19, after: 60 }),
                  para("\u00a0", { after: 300 }),  // writing space for tablet/print
                ]
              : [para(notes, { color: H.scaffoldText, size: 19, after: 0 })],
          }),
        ],
      }),
    ),
  });
}

// --- KEY callout box ---

function keyCallout(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder(), bottom: noBorder(), right: noBorder(),
      insideHorizontal: noBorder(), insideVertical: noBorder(),
      left: { style: BorderStyle.SINGLE, size: 28, color: H.calloutAccent },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: H.calloutBg },
            margins: { top: 50, bottom: 50, left: 100, right: 80 },
            borders: {
              top: noBorder(), bottom: noBorder(),
              left: noBorder(), right: noBorder(),
            },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: "KEY  ", bold: true, font: "Arial", size: 18, color: H.cueText }),
                  new TextRun({ text: String(text), font: "Arial", size: 18, color: H.scaffoldText }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// --- Comparison table with alternating row tint ---

function comparisonTable(tableSpec) {
  const { headers, rows } = tableSpec;
  const colPct = Math.floor(100 / headers.length);

  const headerRow = new TableRow({
    children: headers.map((h) =>
      new TableCell({
        width: { size: colPct, type: WidthType.PERCENTAGE },
        shading: { fill: H.bannerBg },
        margins: { top: 50, bottom: 50, left: 80, right: 80 },
        borders: {
          top: noBorder(), bottom: noBorder(),
          left: { style: BorderStyle.SINGLE, size: 4, color: H.bannerAccent },
          right: { style: BorderStyle.SINGLE, size: 4, color: H.bannerAccent },
        },
        children: [para(h, { bold: true, color: H.bannerText, size: 18, after: 0 })],
      }),
    ),
  });

  const dataRows = rows.map((row, rowIdx) =>
    new TableRow({
      children: row.map((cell) => {
        const isFillIn = cell === "" || cell.includes("_______");
        const rowBg = isFillIn ? H.fillIn : (rowIdx % 2 === 0 ? "FFFFFF" : H.tableAlt);
        return new TableCell({
          width: { size: colPct, type: WidthType.PERCENTAGE },
          shading: { fill: rowBg },
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
          },
          children: [
            para(isFillIn ? "_______________" : cell, {
              color: isFillIn ? "000000" : H.scaffoldText,
              size: 18,
              after: 0,
            }),
          ],
        });
      }),
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideHorizontal: noBorder(), insideVertical: noBorder(),
    },
    rows: [headerRow, ...dataRows],
  });
}

// --- Summary strip ---

function summaryStrip() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: H.bannerAccent },
      bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideHorizontal: noBorder(), insideVertical: noBorder(),
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: H.summaryBg },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            borders: {
              top: noBorder(), bottom: noBorder(),
              left: noBorder(), right: noBorder(),
            },
            children: [
              para("Summary \u2014 write 3 key ideas in your own words after class", {
                bold: true, color: H.cueText, size: 20, after: 160,
              }),
              para("\u00a0", { after: 480 }),
              para("\u00a0", { after: 480 }),
              para("\u00a0", { after: 480 }),
              para("\u00a0", { after: 160 }),
            ],
          }),
        ],
      }),
    ],
  });
}

// --- Derive scaffold cue from a point string (first 4 words) ---

function pointCue(pointText) {
  const words = String(pointText).split(/\s+/);
  const raw = words.slice(0, 4).join(" ");
  return raw.length > 28 ? raw.slice(0, 25) + "\u2026" : raw;
}

// --- Main generate ---

async function generate(config, options) {
  const slug = topicSlug(config);
  const filePath = path.join(options.outputDir, `${slug}_cornell_handout.docx`);
  const { course, lecture } = config;
  const children = [];

  // Title block
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: lecture.topic, bold: true, font: "Arial", size: 40, color: H.cueText }),
        new TextRun({ text: `  \u2014  ${course.code}`, font: "Arial", size: 26, color: "6B7280" }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: "Fill in the highlighted (yellow) cells during lecture — tap to type or write with a stylus. Complete the Summary strip after class.",
          font: "Arial",
          size: 18,
          italics: true,
          color: "6B7280",
        }),
      ],
    }),
  );

  // Learning objectives
  const objBox = objectivesBox(lecture.objectives);
  if (objBox) {
    children.push(objBox);
    children.push(spacer(100));
  }

  // Vocabulary preview
  const vocabGrid = vocabularyGrid(lecture.vocabulary);
  if (vocabGrid) {
    children.push(vocabGrid);
    children.push(spacer(120));
  }

  // One section per lecture section
  lecture.sections.forEach((section, index) => {
    children.push(sectionBanner(section.title, index, section.minutes));

    // Cornell fill-in table from blanks + scaffolded points
    const rows = [];
    (section.blanks || []).forEach((blank) => {
      rows.push({ cue: blank.cue, notes: blank.template, fillIn: true });
    });
    (section.points || []).slice(0, 3).forEach((point) => {
      rows.push({ cue: pointCue(point), notes: `${point.replace(/[.:]+$/, "")}: _______.`, fillIn: false });
    });
    if (rows.length > 0) {
      children.push(cornellTable(rows));
    }

    // Comparison table (shown in addition to, not instead of, blanks)
    if (section.table && section.table.headers && section.table.rows) {
      children.push(spacer(60));
      children.push(comparisonTable(section.table));
    }

    // KEY callouts only (ASK/DEMO are instructor-facing)
    (section.callouts || []).forEach((c) => {
      if (c && c.label === "KEY" && c.text) {
        children.push(spacer(60));
        children.push(keyCallout(c.text));
      }
    });

    children.push(spacer(100));
  });

  // Summary strip always at bottom
  children.push(summaryStrip());
  children.push(spacer(120));

  // References (small, at end)
  if (lecture.references && lecture.references.length > 0) {
    children.push(para("References", { bold: true, color: H.cueText, size: 18, after: 60 }));
    lecture.references.forEach((ref) => {
      children.push(para(ref, { color: "9CA3AF", size: 16, after: 40 }));
    });
  }

  const doc = new Document({
    creator: "lecture-materials-assistant",
    title: `${lecture.topic} — Cornell Handout`,
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                spacing: { after: 0 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "BFDBFE" } },
                children: [
                  new TextRun({
                    text: `${lecture.topic} \u2014 Cornell Handout`,
                    bold: true,
                    font: "Arial",
                    size: 18,
                    color: H.cueText,
                  }),
                  new TextRun({
                    text: `  |  ${course.code} \u2014 ${course.name}`,
                    font: "Arial",
                    size: 18,
                    color: "9CA3AF",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Fill in during lecture  |  Page ", font: "Arial", size: 16, color: "9CA3AF" }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "9CA3AF" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = { generate };
