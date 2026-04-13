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

// Student handout palette — accessible, WCAG AA, not fast-glance
const H = {
  bannerBg:     "2563EB",  // Medium blue
  bannerText:   "FFFFFF",
  cueBg:        "F1F5F9",  // Light blue-gray
  cueText:      "1F3864",  // Navy
  fillIn:       "FEF9C3",  // Yellow — universal fill-in convention
  scaffoldText: "374151",  // Dark gray
  summaryBg:    "EFF6FF",  // Light blue
};

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after === undefined ? 60 : opts.after },
    bullet: opts.bullet ? { level: 0 } : undefined,
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

function sectionBanner(title, index) {
  const roman = ROMAN[index] || String(index + 1);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: H.bannerBg },
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
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function cornellTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(({ cue, notes, fillIn }) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { fill: H.cueBg },
            children: [para(cue, { bold: true, color: H.cueText, after: 0 })],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            shading: fillIn ? { fill: H.fillIn } : undefined,
            borders: {
              left: { style: BorderStyle.SINGLE, size: 16, color: H.bannerBg },
            },
            children: [para(notes, { color: fillIn ? "000000" : H.scaffoldText, after: 0 })],
          }),
        ],
      }),
    ),
  });
}

function comparisonTable(tableSpec) {
  const { headers, rows } = tableSpec;
  const colPct = Math.floor(100 / headers.length);

  const headerRow = new TableRow({
    children: headers.map((h) =>
      new TableCell({
        width: { size: colPct, type: WidthType.PERCENTAGE },
        shading: { fill: H.bannerBg },
        children: [para(h, { bold: true, color: H.bannerText, after: 0 })],
      }),
    ),
  });

  const dataRows = rows.map((row) =>
    new TableRow({
      children: row.map((cell) => {
        const isFillIn = cell === "" || cell.includes("_______");
        return new TableCell({
          width: { size: colPct, type: WidthType.PERCENTAGE },
          shading: isFillIn ? { fill: H.fillIn } : undefined,
          children: [para(isFillIn ? "_______________" : cell, { color: "000000", after: 0 })],
        });
      }),
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function summaryStrip() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: H.summaryBg },
            children: [
              para("Summary \u2014 write this after class in your own words", { bold: true, color: H.cueText, size: 22, after: 120 }),
              para("\u00a0", { after: 280 }),
              para("\u00a0", { after: 280 }),
              para("\u00a0", { after: 120 }),
            ],
          }),
        ],
      }),
    ],
  });
}

async function generate(config, options) {
  const slug = topicSlug(config);
  const filePath = path.join(options.outputDir, `${slug}_cornell_handout.docx`);
  const { lecture } = config;
  const children = [];

  // Title
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: lecture.topic, bold: true, font: "Arial", size: 36, color: H.cueText }),
      ],
    }),
  );

  // Instruction text
  children.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: "Fill in the highlighted cells and blank lines during lecture. Complete the Summary strip afterward.",
          font: "Arial",
          size: 20,
          italics: true,
          color: H.scaffoldText,
        }),
      ],
    }),
  );

  // One section per lecture section
  lecture.sections.forEach((section, index) => {
    children.push(sectionBanner(section.title, index));

    if (section.table && section.table.headers && section.table.rows) {
      children.push(comparisonTable(section.table));
    } else {
      const rows = [];

      // Blank rows (fill-in, yellow)
      (section.blanks || []).forEach((blank) => {
        rows.push({ cue: blank.cue, notes: blank.template, fillIn: true });
      });

      // Key points with scaffolded text (not fill-in)
      (section.points || []).slice(0, 3).forEach((point, i) => {
        rows.push({ cue: `Point ${i + 1}`, notes: `${point.replace(/\.$/, "")}: _______.`, fillIn: false });
      });

      // Overview as non-fill-in context row if table is sparse
      if (section.overview && rows.length < 2) {
        rows.push({ cue: "Overview", notes: section.overview, fillIn: false });
      }

      if (rows.length > 0) {
        children.push(cornellTable(rows));
      }
    }
  });

  // References
  if (lecture.references && lecture.references.length > 0) {
    children.push(para("References", { bold: true, color: H.cueText, size: 22, after: 60 }));
    lecture.references.forEach((ref) => {
      children.push(para(ref, { bullet: true, color: H.scaffoldText, size: 18, after: 60 }));
    });
  }

  // Summary strip always at bottom
  children.push(summaryStrip());

  const doc = new Document({
    creator: "lecture-materials-assistant",
    title: `CORNELL HANDOUT - ${lecture.topic}`,
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `${lecture.topic} \u2014 Cornell Handout`,
                    bold: true,
                    font: "Arial",
                    size: 20,
                    color: H.cueText,
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
                  new TextRun({ text: "Fill in during lecture  |  Page ", font: "Arial", size: 18 }),
                  PageNumber.CURRENT,
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
