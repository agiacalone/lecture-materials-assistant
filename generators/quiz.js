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

function deriveQuiz(config) {
  if (Array.isArray(config.lecture.quizQuestions) && config.lecture.quizQuestions.length > 0) {
    return config.lecture.quizQuestions;
  }

  const concept = config.lecture.keyConcepts[0] || "the primary concept";
  const section0 = (config.lecture.sections[0] && config.lecture.sections[0].title) || "the first section";

  return [
    {
      type: "mc",
      prompt: `Which statement best captures ${concept}?`,
      options: [
        "The mechanism that prevents the associated failure mode.",
        "The abstraction layer that hides physical resource management.",
        "The failure mode produced by ignoring the mechanism.",
        "The policy that governs resource allocation decisions.",
      ],
      answer: "b",
      rubric: "1 point for correct selection; no partial credit. Distractors represent common misconceptions.",
    },
    {
      type: "sa",
      prompt: `Explain the most important tradeoff in ${section0}.`,
      rubric: "2 points: name the tradeoff (1 pt), defend one side with a concrete example from lecture (1 pt).",
    },
    {
      type: "mc",
      prompt: `Which failure mode does the lecture warn about most strongly?`,
      options: [
        "Starvation under an unfair scheduling policy.",
        "The failure mode introduced in the lecture's opening case study.",
        "Deadlock arising from circular resource dependency.",
        "Data corruption under unsynchronized concurrent writes.",
      ],
      answer: "b",
      rubric: "1 point for correct selection; no partial credit.",
    },
    {
      type: "sa",
      prompt: `Use one case study from class to justify a design decision. Name the case study, state the decision, and defend it.`,
      rubric: "2 points: identify the case study by name (1 pt), state and defend the decision with lecture-specific reasoning (1 pt).",
    },
    {
      type: "sa",
      prompt: `State one takeaway from today's lecture and explain how you would apply it in a system you might build or operate.`,
      rubric: "1 point for a specific, lecture-aligned takeaway with a plausible application. Generic answers receive 0.",
    },
  ];
}

function renderMC(q, num) {
  const opts = (q.options || [])
    .map((opt, i) => `  \\item[(${String.fromCharCode(97 + i)})] ${texEscape(opt)}`)
    .join("\n");
  return `\\noindent\\textbf{${num}.} ${texEscape(q.prompt)}\n\\begin{enumerate}[leftmargin=2em,topsep=2pt,itemsep=0pt]\n${opts}\n\\end{enumerate}\n\\vspace{1em}\n`;
}

function renderSA(q, num) {
  return `\\noindent\\textbf{${num}.} ${texEscape(q.prompt)}\n\n\\vspace{3em}\n`;
}

function generate(config, options) {
  const slug = topicSlug(config);
  const texPath = path.join(options.outputDir, `${slug}_quiz.tex`);
  const { course, lecture } = config;
  const courseLabel = `${course.code} \u2014 ${course.name}`;
  const questions = deriveQuiz(config);

  const lines = [];
  lines.push(texPreamble(lecture.topic, courseLabel));
  lines.push("\\begin{document}");
  lines.push("\\thispagestyle{fancy}");
  lines.push(texDocHeader(lecture.topic, "Pop Quiz", courseLabel));
  lines.push("\\noindent\\textbf{Name:}\\enspace\\underline{\\hspace{6cm}}\\qquad\\textbf{Date:}\\enspace\\underline{\\hspace{3cm}}\\\\[1em]");
  lines.push("\\noindent\\textit{All questions are directly answerable from the lecture and slide content.}\\\\[0.5em]");

  questions.forEach((q, i) => {
    lines.push(q.type === "mc" ? renderMC(q, i + 1) : renderSA(q, i + 1));
  });

  // Answer key on a new page
  lines.push("\\newpage");
  lines.push("{\\color{red}\\rule{\\linewidth}{2pt}}");
  lines.push("\\vspace{0.3em}");
  lines.push("{\\color{red}\\Large\\textbf{ANSWER KEY --- INSTRUCTOR COPY}}");
  lines.push("\\vspace{0.2em}");
  lines.push("{\\color{red}\\rule{\\linewidth}{2pt}}\\\\[0.8em]");

  questions.forEach((q, i) => {
    const answerNote = q.type === "mc" ? ` Answer: (${q.answer}).` : "";
    lines.push(`\\noindent\\textbf{${i + 1}.}${answerNote} ${texEscape(q.rubric || "")}\\\\[0.5em]`);
  });

  lines.push("\\end{document}\n");

  fs.writeFileSync(texPath, lines.join("\n"));
  return compileLatex(texPath, options.outputDir);
}

module.exports = { generate };
