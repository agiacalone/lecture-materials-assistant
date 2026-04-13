"use strict";

const fs = require("fs");
const path = require("path");
const { topicSlug } = require("../lib/context");
const {
  compileLatex,
  texBulletList,
  texCallout,
  texComparisonTable,
  texDocHeader,
  texHook,
  texPlainSection,
  texPreamble,
  texSectionRule,
  texTalkingPoints,
  texEscape,
} = require("../lib/tex-helpers");

async function generate(config, options) {
  const slug = topicSlug(config);
  const texPath = path.join(options.outputDir, `${slug}_lecture_notes.tex`);
  const { course, lecture } = config;
  const courseLabel = `${course.code} \u2014 ${course.name}`;

  const lines = [];
  lines.push(texPreamble(lecture.topic, courseLabel));
  lines.push("\\begin{document}");
  lines.push("\\thispagestyle{fancy}");
  lines.push(texDocHeader(lecture.topic, "Lecture Notes \u2014 with Talking Points", courseLabel));

  // Opening hook
  lines.push(texHook(
    lecture.openingHook ||
    `Frame ${lecture.topic} as a practical systems problem before introducing formal vocabulary.`
  ));

  // Learning objectives
  lines.push(texPlainSection("Learning Objectives"));
  lines.push(texBulletList(lecture.objectives));

  // Numbered sections
  lecture.sections.forEach((section, index) => {
    lines.push(texSectionRule(`${section.title} (${section.minutes || "TBD"} min)`, index));

    if (section.overview) {
      lines.push(`\\noindent ${texEscape(section.overview)}\n`);
    }

    if (section.points && section.points.length > 0) {
      lines.push(texBulletList(section.points));
    }

    const talkingPoints = section.talkingPoints || section.speakerNotes;
    if (talkingPoints && talkingPoints.length > 0) {
      lines.push(texTalkingPoints(talkingPoints));
    }

    (section.callouts || []).forEach((c) => {
      lines.push(texCallout(c.label, c.text));
    });

    if (section.table) {
      lines.push(texComparisonTable(section.table.headers, section.table.rows));
    }
  });

  // Case studies
  if (lecture.caseStudies && lecture.caseStudies.length > 0) {
    lines.push(texPlainSection("Case Studies"));
    lines.push(texBulletList(lecture.caseStudies));
  }

  // Summary
  lines.push(texPlainSection("Summary"));
  lines.push(texBulletList(lecture.takeaways || lecture.objectives));

  // Discussion questions
  if (lecture.discussionQuestions && lecture.discussionQuestions.length > 0) {
    lines.push(texPlainSection("Discussion Questions"));
    lines.push(texBulletList(lecture.discussionQuestions));
  }

  // References
  if (lecture.references && lecture.references.length > 0) {
    lines.push(texPlainSection("References"));
    lines.push(texBulletList(lecture.references));
  }

  lines.push("\\end{document}\n");

  fs.writeFileSync(texPath, lines.join("\n"));
  const pdfPath = compileLatex(texPath, options.outputDir);
  return pdfPath;
}

module.exports = { generate };
