"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { topicSlug } = require("../lib/context");
const {
  resolveSectionKind,
  cornellPreamble,
  cornellKeyBanner,
  cornellTitleBlock,
  cornellInstructionLine,
  cornellObjectivesBox,
  cornellVocabGrid,
  cornellSectionBanner,
  cornellTable,
  cornellKeyCallout,
  cornellComparisonTable,
  cornellSummaryStrip,
  cornellReferences,
} = require("../lib/cornell-tex");

// Derive a scaffold cue from a long point string (first 4 words, capped to 28
// chars). Keeps the cue column readable when the source point is verbose.
function pointCue(pointText) {
  const words = String(pointText).split(/\s+/);
  const raw = words.slice(0, 4).join(" ");
  return raw.length > 28 ? raw.slice(0, 25) + "…" : raw;
}

// Build the (toggle-aware) LaTeX source string. Compiled twice by the caller:
// once with \answersfalse (student handout) and once string-replaced to
// \answerstrue (in-class answer key).
function buildTex(config, options) {
  const { course, lecture } = config;
  const headerRight = `${course.code} — ${course.name}`;
  const headerLeft = `${lecture.topic} — Cornell Handout`;

  // `fillable` is reserved for a future feature — emit AcroForm fields rather
  // than static writing space. Plumbed through the helpers but ignored today.
  const fillable = Boolean(options.fillable || (config.options && config.options.fillable));

  const lines = [];
  lines.push(cornellPreamble(headerLeft, headerRight));
  lines.push("\\begin{document}");
  lines.push("\\thispagestyle{fancy}");
  lines.push(cornellKeyBanner());
  lines.push(cornellTitleBlock(lecture.topic));
  lines.push(cornellInstructionLine(
    "Fill in the highlighted (yellow) cells during lecture. Complete the Summary strip after class."
  ));

  lines.push(cornellObjectivesBox(lecture.objectives));
  lines.push(cornellVocabGrid(lecture.vocabulary));

  const sections = lecture.sections || [];
  sections.forEach((section, index) => {
    const kind = resolveSectionKind(section, index, sections.length);
    lines.push(cornellSectionBanner(section.title, index, section.minutes, kind));

    const rows = [];
    (section.blanks || []).forEach((blank) => {
      rows.push({
        cue: blank.cue,
        notes: blank.template,
        fillIn: true,
        answers: blank.answers,
      });
    });
    (section.points || []).slice(0, 3).forEach((point) => {
      rows.push({
        cue: pointCue(point),
        notes: `${String(point).replace(/[.:]+$/, "")}: _______.`,
        fillIn: false,
      });
    });
    if (rows.length > 0) {
      lines.push(cornellTable(rows, kind, { fillable }));
    }

    (section.callouts || []).forEach((c) => {
      if (c && c.label === "KEY" && c.text) {
        lines.push(cornellKeyCallout(c.text, kind));
      }
    });

    if (section.table && section.table.headers && section.table.rows) {
      lines.push(cornellComparisonTable(section.table.headers, section.table.rows, kind));
    }
  });

  lines.push(cornellSummaryStrip());
  lines.push(cornellReferences(lecture.references));
  lines.push("\\end{document}\n");
  return lines.join("\n");
}

// Compile the same texContent twice — student first, then with the answer
// toggle flipped to produce the key. Mirrors quiz.js's pattern.
function compileStudentAndKey(texContent, slug, outputDir) {
  const args = ["-interaction=nonstopmode", "-output-directory", outputDir];

  const studentTex = path.join(outputDir, `${slug}_cornell_handout.tex`);
  fs.writeFileSync(studentTex, texContent);
  spawnSync("pdflatex", [...args, studentTex], { stdio: "ignore" });
  spawnSync("pdflatex", [...args, studentTex], { stdio: "ignore" });

  // Global regex: flips every occurrence so a stray mention in a comment can't
  // shadow the actual \answersfalse directive (string-arg .replace would only
  // swap the first hit).
  const keyContent = texContent.replace(/\\answersfalse/g, "\\answerstrue");
  const keyTex = path.join(outputDir, `${slug}_cornell_handout_key.tex`);
  fs.writeFileSync(keyTex, keyContent);
  spawnSync("pdflatex", [...args, keyTex], { stdio: "ignore" });
  spawnSync("pdflatex", [...args, keyTex], { stdio: "ignore" });

  const studentPdf = path.join(outputDir, `${slug}_cornell_handout.pdf`);
  const keyPdf = path.join(outputDir, `${slug}_cornell_handout_key.pdf`);
  if (!fs.existsSync(studentPdf)) {
    throw new Error(`Cornell student PDF not produced. Check ${studentTex} for errors.`);
  }
  if (!fs.existsSync(keyPdf)) {
    throw new Error(`Cornell key PDF not produced. Check ${keyTex} for errors.`);
  }
  return studentPdf;
}

function generate(config, options) {
  const slug = topicSlug(config);
  fs.mkdirSync(options.outputDir, { recursive: true });
  const texContent = buildTex(config, options);
  return compileStudentAndKey(texContent, slug, options.outputDir);
}

module.exports = { generate };
