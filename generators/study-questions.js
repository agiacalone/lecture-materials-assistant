"use strict";

const fs = require("fs");
const path = require("path");
const { topicSlug } = require("../lib/context");
const {
  compileLatex,
  texDocHeader,
  texEscape,
  texPreamble,
} = require("../lib/tex-helpers");

function deriveQuestions(config) {
  if (Array.isArray(config.lecture.studyQuestions) && config.lecture.studyQuestions.length > 0) {
    return config.lecture.studyQuestions;
  }

  const concepts = config.lecture.keyConcepts;
  const sections = config.lecture.sections.map((s) => s.title);
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

function generate(config, options) {
  const slug = topicSlug(config);
  const texPath = path.join(options.outputDir, `${slug}_study_questions.tex`);
  const { course, lecture } = config;
  const courseLabel = `${course.code} \u2014 ${course.name}`;
  const allQuestions = deriveQuestions(config);

  const recallQs  = allQuestions.filter((q) => q.startsWith("[Recall]"));
  const applyQs   = allQuestions.filter((q) => q.startsWith("[Apply]"));
  const analyzeQs = allQuestions.filter((q) => q.startsWith("[Analyze]"));

  const lines = [];
  lines.push(texPreamble(lecture.topic, courseLabel));
  lines.push("\\begin{document}");
  lines.push("\\thispagestyle{fancy}");
  lines.push(texDocHeader(lecture.topic, "Study Questions", courseLabel));
  lines.push(`\\noindent\\textit{${texEscape("These questions reinforce the lecture and guided notes. They should deepen recall and transfer \u2014 not a substitute for attending.")}}\n`);

  let qNum = 1;

  function renderGroup(title, qs, vspace) {
    lines.push(`\n{\\color{instrNavy}\\large\\textbf{${texEscape(title)}}}`);
    lines.push(`{\\color{instrNavy}\\rule{\\linewidth}{0.4pt}}\n`);
    qs.forEach((q) => {
      const text = q.replace(/^\[.*?\]\s*/, "");
      lines.push(`\\noindent\\textbf{Q${qNum++}.} ${texEscape(text)}\n`);
      lines.push(`\\vspace{${vspace}}\n`);
    });
  }

  renderGroup("Recall", recallQs, "2em");
  renderGroup("Apply", applyQs, "3em");
  renderGroup("Analyze", analyzeQs, "4em");

  lines.push("\\end{document}\n");

  fs.writeFileSync(texPath, lines.join("\n"));
  return compileLatex(texPath, options.outputDir);
}

module.exports = { generate };
