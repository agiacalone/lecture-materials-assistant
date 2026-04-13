const path = require("path");
const { topicSlug } = require("../lib/context");
const { bullet, heading, paragraph, writeDocx } = require("../lib/docx-helpers");

function deriveQuiz(config) {
  if (Array.isArray(config.lecture.quizQuestions) && config.lecture.quizQuestions.length > 0) {
    return config.lecture.quizQuestions;
  }

  const sections = config.lecture.sections;
  return [
    { prompt: `Multiple choice: Which statement best captures ${config.lecture.keyConcepts[0]}?`, rubric: "1 point for the correct selection; distractors must stay plausible." },
    { prompt: `Short answer: Explain the most important tradeoff in ${sections[0].title}.`, rubric: "2 points for naming the tradeoff and defending one side." },
    { prompt: `Multiple choice: Which failure mode does the lecture warn about most strongly?`, rubric: "1 point for the correct selection with no partial credit." },
    { prompt: `Short answer: Use one case study from class to justify a design decision.`, rubric: "2 points for a concrete case study plus a defensible rationale." },
    { prompt: `Exit ticket: State one takeaway you would apply immediately in practice.`, rubric: "1 point for a specific, lecture-aligned takeaway." },
  ];
}

async function generate(config, options) {
  const slug = topicSlug(config);
  const filePath = path.join(options.outputDir, `${slug}_quiz.docx`);
  const children = [];

  children.push(paragraph("Pop quiz. All questions should be directly answerable from the lecture and slide content."));
  children.push(heading("Quiz"));
  deriveQuiz(config).forEach((item, index) => {
    children.push(paragraph(`${index + 1}. ${item.prompt}`));
    children.push(paragraph("Response: ________________________________________________", { color: "666666" }));
  });

  children.push(heading("Instructor Answer Key"));
  deriveQuiz(config).forEach((item, index) => {
    children.push(bullet(`${index + 1}. ${item.rubric}`));
  });

  await writeDocx(filePath, children, { title: `QUIZ - ${config.lecture.topic}` });
  return filePath;
}

module.exports = { generate };
