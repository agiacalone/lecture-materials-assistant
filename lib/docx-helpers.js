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

const SEMANTIC_FILLS = {
  structure: { fill: "1F3864", text: "FFFFFF" },
  concept: { fill: "2E5FA3", text: "FFFFFF" },
  analysis: { fill: "EAF2FB", text: "1F3864" },
  practice: { fill: "F0FAF0", text: "1F3864" },
  takeaway: { fill: "FFF8E7", text: "6B4F00" },
  reference: { fill: "E5E7EB", text: "334155" },
};

const CALLOUT_STYLES = {
  ASK: { badgeFill: "2E5FA3", tint: "EBF3FB" },
  THESIS: { badgeFill: "B7791F", tint: "FFF8E7" },
  DEMO: { badgeFill: "2F855A", tint: "F0FAF0" },
  KEY: { badgeFill: "1F3864", tint: "EAF2FB" },
};

const SECTION_SYMBOLS = {
  structure: "§",
  concept: "+",
  analysis: "=",
  practice: ">",
  takeaway: "*",
  reference: "#",
};

const CALLOUT_SYMBOLS = {
  ASK: "?",
  THESIS: "!",
  DEMO: ">",
  KEY: "*",
};

async function writeDocx(filePath, children, options = {}) {
  const title = options.title || "Lecture Materials";
  const document = new Document({
    creator: "lecture-materials-assistant",
    title,
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              heading(title, { color: "1F3864", spacingAfter: 80 }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun("Instructor Copy"),
                  new TextRun("  |  Page "),
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

  const buffer = await Packer.toBuffer(document);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function heading(text, options = {}) {
  return new Paragraph({
    spacing: { after: options.spacingAfter === undefined ? 180 : options.spacingAfter },
    children: [
      new TextRun({
        text,
        bold: true,
        font: "Arial",
        size: options.size || 28,
        color: options.color || "1F3864",
      }),
    ],
  });
}

function paragraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: options.after === undefined ? 120 : options.after },
    children: [
      new TextRun({
        text,
        font: options.font || "Arial",
        italics: Boolean(options.italics),
        bold: Boolean(options.bold),
        color: options.color || "000000",
        size: options.size || 22,
      }),
    ],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
  });
}

function labelValue(label, value) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, font: "Arial", size: 22, color: "1F3864" }),
      new TextRun({ text: value, font: "Arial", size: 22 }),
    ],
  });
}

function sectionBanner(text, semantic = "structure") {
  const style = SEMANTIC_FILLS[semantic] || SEMANTIC_FILLS.structure;
  const symbol = SECTION_SYMBOLS[semantic];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: style.fill },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: symbol ? `${symbol} ` : "", bold: true, color: style.text, font: "Arial", size: 22 }),
                  new TextRun({ text, bold: true, color: style.text, font: "Arial", size: 22 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function callout(label, text, tint = "EBF3FB") {
  const calloutStyle = CALLOUT_STYLES[label] || { badgeFill: "1F3864", tint };
  const symbol = CALLOUT_SYMBOLS[label];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: calloutStyle.badgeFill },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: symbol ? `${symbol} ` : "", bold: true, color: "FFFFFF", font: "Arial", size: 20 }),
                  new TextRun({ text: label, bold: true, color: "FFFFFF", font: "Arial", size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 82, type: WidthType.PERCENTAGE },
            shading: { fill: tint || calloutStyle.tint },
            children: [paragraph(text, { after: 0 })],
          }),
        ],
      }),
    ],
  });
}

function twoColumnNotes(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: row.cueFill || "F0F4FA" },
            children: [paragraph(row.cue, { bold: row.cueBold !== false, color: row.cueColor || "1F3864", after: 40 })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: row.notesFill ? { fill: row.notesFill } : undefined,
            borders: {
              left: { style: BorderStyle.SINGLE, size: 16, color: "2E5FA3" },
            },
            children: [paragraph(row.notes, { after: 40, color: row.notesColor || "000000" })],
          }),
        ],
      }),
    ),
  });
}

function summaryBox(title, prompts) {
  const lines = Array.isArray(prompts) && prompts.length > 0 ? prompts : ["Summary: ________________________________________________"];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "EBF3FB" },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: [new TextRun({ text: title, bold: true, color: "1F3864", font: "Arial", size: 22 })],
              }),
            ],
          }),
        ],
      }),
      ...lines.map((line) =>
        new TableRow({
          children: [
            new TableCell({
              children: [paragraph(line, { after: 40 })],
            }),
          ],
        }),
      ),
    ],
  });
}

function codeBlock(lines, languageLabel) {
  const rows = [];
  if (languageLabel) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F5F5F5" },
            children: [paragraph(languageLabel, { color: "555555", italics: true, after: 40 })],
          }),
        ],
      }),
    );
  }

  rows.push(
    new TableRow({
      children: [
        new TableCell({
          borders: {
            top: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
          },
          shading: { fill: "F5F5F5" },
          children: lines.map((line) => paragraph(line, { font: "Menlo", size: 20, after: 0 })),
        }),
      ],
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

module.exports = {
  bullet,
  callout,
  codeBlock,
  heading,
  labelValue,
  paragraph,
  sectionBanner,
  summaryBox,
  twoColumnNotes,
  writeDocx,
};
