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

function callout(label, text, tint = "EBF3FB") {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: "1F3864" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, bold: true, color: "FFFFFF", font: "Arial", size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 82, type: WidthType.PERCENTAGE },
            shading: { fill: tint },
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
            shading: { fill: "F0F4FA" },
            children: [paragraph(row.cue, { bold: true, color: "1F3864", after: 40 })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [paragraph(row.notes, { after: 40 })],
          }),
        ],
      }),
    ),
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
  twoColumnNotes,
  writeDocx,
};
