const path = require("path");
const { topicSlug } = require("../lib/context");
const { bullet, heading, paragraph, twoColumnNotes, writeDocx } = require("../lib/docx-helpers");

function buildRows(config) {
  const rows = [];
  for (const section of config.lecture.sections) {
    rows.push({
      cue: section.title,
      notes: section.cornellPrompt || section.overview || "Capture the projected slide content here, then annotate with the instructor explanation.",
    });
    for (const blank of section.blanks || []) {
      rows.push({
        cue: blank.cue,
        notes: blank.template,
      });
    }
  }
  return rows;
}

async function generate(config, options) {
  const slug = topicSlug(config);
  const filePath = path.join(options.outputDir, `${slug}_cornell_handout.docx`);
  const children = [];

  children.push(paragraph("Pre-distributed guided notes. Students fill blanks from projected slides and use the scaffolded prompts for verbal explanation."));
  children.push(heading("Cue / Notes Layout"));
  children.push(twoColumnNotes(buildRows(config)));

  children.push(heading("Vocabulary"));
  (config.lecture.vocabulary || config.lecture.keyConcepts).forEach((term) => {
    const text = typeof term === "string" ? `${term}: _______` : `${term.term}: ${term.definitionBlank || "_______"}`;
    children.push(bullet(text));
  });

  children.push(heading("Self-Quiz"));
  (config.lecture.selfQuiz || config.lecture.discussionQuestions || []).slice(0, 4).forEach((question) => {
    children.push(bullet(question));
  });

  await writeDocx(filePath, children, { title: `CORNELL HANDOUT - ${config.lecture.topic}` });
  return filePath;
}

module.exports = { generate };
