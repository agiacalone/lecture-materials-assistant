const path = require("path");
const { topicSlug } = require("../lib/context");
const { heading, paragraph, writeDocx } = require("../lib/docx-helpers");

function deriveQuestions(config) {
  if (Array.isArray(config.lecture.studyQuestions) && config.lecture.studyQuestions.length > 0) {
    return config.lecture.studyQuestions;
  }

  const concepts = config.lecture.keyConcepts;
  const sections = config.lecture.sections.map((section) => section.title);
  const questions = [
    `[Recall] Define ${concepts[0]}.`,
    `[Recall] Summarize the main idea behind ${concepts[1] || concepts[0]}.`,
    `[Apply] Apply ${concepts[0]} to one of today’s case studies.`,
    `[Apply] Explain how ${sections[0]} would change under a different workload or constraint.`,
    `[Apply] Choose one tradeoff from the lecture and defend a decision.`,
    `[Analyze] Compare two approaches from the lecture and identify the stronger fit for a real system.`,
    `[Analyze] Identify the failure mode most likely to appear if the lecture’s guardrails are ignored.`,
    `[Analyze] Evaluate how the lecture’s design choices affect observability, performance, and correctness.`,
    `[Analyze] Build a short argument connecting the framework to an unfamiliar scenario.`,
    `[Analyze] Critique the lecture’s case study and propose a better alternative.`,
  ];

  if (config.course.adversarialThinking) {
    questions[8] = "[Analyze] From an attacker’s perspective, identify the most exploitable weakness in the design and justify it.";
  }

  return questions;
}

async function generate(config, options) {
  const slug = topicSlug(config);
  const filePath = path.join(options.outputDir, `${slug}_study_questions.docx`);
  const children = [paragraph(config.lecture.summary)];

  children.push(heading("Study Questions"));
  deriveQuestions(config).forEach((question, index) => {
    children.push(paragraph(`Q${index + 1}. ${question}`));
    children.push(paragraph("Answer: ________________________________________________", { color: "666666" }));
  });

  await writeDocx(filePath, children, { title: `STUDY QUESTIONS - ${config.lecture.topic}` });
  return filePath;
}

module.exports = { generate };
