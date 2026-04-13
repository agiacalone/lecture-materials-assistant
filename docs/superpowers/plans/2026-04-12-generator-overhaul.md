# Generator Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite lecture-notes, study-questions, and quiz generators to output LaTeX/PDF; restructure the Cornell handout to mirror lecture sections with accessible color coding; add a shared `lib/tex-helpers.js`; update `spec.js` scaffolding.

**Architecture:** Hybrid approach — generators always produce the deadlock-style document structure (Roman numeral sections, hook block, talking points). Two optional spec fields (`section.talkingPoints`, `section.table`) enhance output when present and fall back gracefully when absent. LaTeX generators build string templates, write `.tex`, compile twice with `pdflatex`, and return the `.pdf` path. The Cornell handout stays `.docx` with an accessible student palette.

**Tech Stack:** Node.js (CommonJS), `docx` v9, `pptxgenjs` v4, `pdflatex` (TeX Live, confirmed at `/opt/homebrew/bin/pdflatex`).

---

## File Map

| File | Action | Notes |
|------|--------|-------|
| `lib/tex-helpers.js` | **Create** | LaTeX string helpers + `compileLatex()` |
| `lib/docx-helpers.js` | No change | Used only by Cornell handout; handout colors defined inline in generator |
| `generators/lecture-notes.js` | **Rewrite** | docx → LaTeX article |
| `generators/study-questions.js` | **Rewrite** | docx → LaTeX article |
| `generators/quiz.js` | **Rewrite** | docx → LaTeX article |
| `generators/cornell-handout.js` | **Rewrite** | Major restructure; section-mirroring docx |
| `generators/slides.js` | No change | Naturally ignores new spec fields |
| `lib/spec.js` | **Modify** | `defaultSection()` placeholder text |
| `package.json` | **Modify** | Add `lib/tex-helpers.js` to `check` script |

---

## Task 1: Create `lib/tex-helpers.js`

**Files:**
- Create: `lib/tex-helpers.js`

- [ ] **Step 1: Write `lib/tex-helpers.js`**

```javascript
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Instructor palette — fast-glance optimized, saturated for print
const COLORS = {
  instrNavy:      "1F3864",
  instrTeal:      "0D9488",
  instrAmber:     "D97706",
  instrIndigo:    "4F46E5",
  instrGreen:     "15803D",
  instrOrange:    "C2410C",
  instrKeyBody:   "DBEAFE",
  instrAskBody:   "EEF2FF",
  instrDemoBody:  "DCFCE7",
  instrThesisBody:"FFEDD5",
};

const CALLOUT_CONFIG = {
  KEY:   { badge: "instrNavy",   body: "instrKeyBody",    bodyText: "instrNavy" },
  ASK:   { badge: "instrIndigo", body: "instrAskBody",    bodyText: "instrIndigo" },
  DEMO:  { badge: "instrGreen",  body: "instrDemoBody",   bodyText: "instrGreen" },
  THESIS:{ badge: "instrOrange", body: "instrThesisBody", bodyText: "instrOrange" },
};

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

function texEscape(str) {
  return String(str || "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function toRoman(index) {
  return ROMAN[index] || String(index + 1);
}

function texPreamble(headerLeft, headerRight) {
  const colorDefs = Object.entries(COLORS)
    .map(([name, hex]) => `\\definecolor{${name}}{HTML}{${hex}}`)
    .join("\n");

  return `\\documentclass[12pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{xcolor}
\\usepackage{colortbl}
\\usepackage{mdframed}
\\usepackage{booktabs}
\\usepackage{tabularx}
\\usepackage{enumitem}
\\usepackage{parskip}
\\usepackage{fancyhdr}
\\usepackage[hidelinks]{hyperref}
\\usepackage{listings}
\\usepackage{array}

${colorDefs}

\\newmdenv[
  backgroundcolor=instrAmber!15,
  linecolor=instrAmber,
  linewidth=2pt,
  innerleftmargin=8pt,
  innerrightmargin=8pt,
  innertopmargin=6pt,
  innerbottommargin=6pt,
  skipabove=8pt,
  skipbelow=4pt
]{talkingpointsenv}

\\newmdenv[
  backgroundcolor=instrTeal!15,
  linecolor=instrTeal,
  linewidth=2pt,
  innerleftmargin=8pt,
  innerrightmargin=8pt,
  innertopmargin=6pt,
  innerbottommargin=6pt,
  skipabove=8pt,
  skipbelow=4pt
]{hookenv}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small\\textbf{${texEscape(headerLeft)}}}
\\fancyhead[R]{\\small\\textbf{${texEscape(headerRight)}}}
\\fancyfoot[C]{\\small Page \\thepage}
\\renewcommand{\\headrulewidth}{0.4pt}

\\setlist[itemize]{noitemsep, topsep=4pt, leftmargin=1.5em}
\\setlist[enumerate]{noitemsep, topsep=4pt, leftmargin=1.5em}

\\lstset{
  basicstyle=\\ttfamily\\small,
  backgroundcolor=\\color{black!5},
  frame=single,
  framesep=4pt,
  breaklines=true,
  columns=flexible,
}
`;
}

function texDocHeader(title, subtitle, course) {
  return `
{\\color{instrNavy}\\LARGE\\textbf{${texEscape(title)}}}\\\\[0.3em]
{\\large\\textit{${texEscape(subtitle)}}}\\\\[0.1em]
{\\normalsize ${texEscape(course)}}\\\\[0.5em]
{\\color{instrNavy}\\rule{\\linewidth}{1.5pt}}
\\vspace{0.5em}
`;
}

function texSectionRule(title, index) {
  const roman = toRoman(index);
  return `
\\vspace{0.8em}
{\\color{instrNavy}\\rule{\\linewidth}{1.5pt}}
\\vspace{0.2em}

{\\color{instrNavy}\\large\\textbf{${roman}. ${texEscape(title)}}}

{\\color{instrNavy}\\rule{\\linewidth}{0.4pt}}
\\vspace{0.3em}
`;
}

function texPlainSection(title) {
  return `
\\vspace{0.8em}
{\\color{instrNavy}\\rule{\\linewidth}{1.5pt}}
\\vspace{0.2em}

{\\color{instrNavy}\\large\\textbf{${texEscape(title)}}}

{\\color{instrNavy}\\rule{\\linewidth}{0.4pt}}
\\vspace{0.3em}
`;
}

function texHook(text) {
  return `
\\begin{hookenv}
{\\textbf{\\color{instrTeal}[ HOOK --- open with this story ]}}\\\\[4pt]
${texEscape(text)}
\\end{hookenv}
`;
}

function texTalkingPoints(items) {
  if (!items || items.length === 0) return "";
  const itemLines = items.map((item) => `  \\item ${texEscape(item)}`).join("\n");
  return `
\\begin{talkingpointsenv}
{\\textbf{\\color{instrAmber}[ TALKING POINTS ]}}
\\begin{itemize}
${itemLines}
\\end{itemize}
\\end{talkingpointsenv}
`;
}

function texCallout(label, text) {
  const style = CALLOUT_CONFIG[label] || CALLOUT_CONFIG.KEY;
  return `
\\begin{mdframed}[
  backgroundcolor=${style.body}!60,
  linecolor=${style.badge},
  linewidth=2pt,
  innerleftmargin=8pt,
  innertopmargin=6pt,
  innerbottommargin=6pt,
  skipabove=6pt,
  skipbelow=4pt
]
{\\textbf{\\color{${style.badge}}[${texEscape(label)}]}}\\enspace ${texEscape(text)}
\\end{mdframed}
`;
}

function texComparisonTable(headers, rows) {
  const n = headers.length;
  const colSpec = "|" + Array(n).fill("X").join("|") + "|";
  const headerRow = headers
    .map((h) => `\\textcolor{white}{\\textbf{${texEscape(h)}}}`)
    .join(" & ");
  const dataRows = rows
    .map((row) => row.map((cell) => texEscape(cell)).join(" & ") + " \\\\\\hline")
    .join("\n");
  return `
\\begin{center}
\\begin{tabularx}{\\linewidth}{${colSpec}}
\\hline
\\rowcolor{instrNavy}
${headerRow} \\\\\\hline
${dataRows}
\\end{tabularx}
\\end{center}
`;
}

function texBulletList(items) {
  if (!items || items.length === 0) return "";
  return `\\begin{itemize}\n${items.map((item) => `  \\item ${texEscape(item)}`).join("\n")}\n\\end{itemize}\n`;
}

function texCodeBlock(lines, lang) {
  const langOpt = lang ? `language=${lang},` : "";
  return `\\begin{lstlisting}[${langOpt}frame=single]\n${lines.join("\n")}\n\\end{lstlisting}\n`;
}

function compileLatex(texPath, outputDir) {
  const cmd = `pdflatex -interaction=nonstopmode -output-directory "${outputDir}" "${texPath}"`;
  try {
    execSync(cmd, { stdio: "ignore" });
    execSync(cmd, { stdio: "ignore" }); // second pass for refs
  } catch (_) {
    // pdflatex exits non-zero on warnings; check for PDF instead
  }
  const pdfPath = path.join(outputDir, path.basename(texPath).replace(/\.tex$/, ".pdf"));
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`pdflatex did not produce a PDF: ${pdfPath}. Check the .tex file for errors.`);
  }
  return pdfPath;
}

module.exports = {
  compileLatex,
  texBulletList,
  texCallout,
  texCodeBlock,
  texComparisonTable,
  texDocHeader,
  texEscape,
  texHook,
  texPlainSection,
  texPreamble,
  texSectionRule,
  texTalkingPoints,
  toRoman,
};
```

- [ ] **Step 2: Syntax-check the new file**

```bash
node --check lib/tex-helpers.js
```

Expected: no output (success).

- [ ] **Step 3: Commit**

```bash
git add lib/tex-helpers.js
git commit -m "feat: add lib/tex-helpers.js — shared LaTeX string helpers and compileLatex"
```

---

## Task 2: Rewrite `generators/lecture-notes.js` to LaTeX

**Files:**
- Modify: `generators/lecture-notes.js`

- [ ] **Step 1: Rewrite `generators/lecture-notes.js`**

```javascript
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
```

- [ ] **Step 2: Syntax-check**

```bash
node --check generators/lecture-notes.js
```

Expected: no output.

- [ ] **Step 3: Smoke test**

```bash
mkdir -p /tmp/lma-test
node generate.js --config examples/lecture-spec.json --output /tmp/lma-test --artifact notes
```

Expected output:
```
generated notes: /tmp/lma-test/virtual_memory_and_paging_lecture_notes.pdf
```

Also verify the `.tex` source exists:
```bash
ls /tmp/lma-test/virtual_memory_and_paging_lecture_notes.tex
```

- [ ] **Step 4: Commit**

```bash
git add generators/lecture-notes.js
git commit -m "feat: rewrite lecture-notes generator to LaTeX/PDF"
```

---

## Task 3: Rewrite `generators/study-questions.js` to LaTeX

**Files:**
- Modify: `generators/study-questions.js`

- [ ] **Step 1: Rewrite `generators/study-questions.js`**

```javascript
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
    `[Apply] Apply ${concepts[0]} to one of today's case studies.`,
    `[Apply] Explain how ${sections[0]} would change under a different workload or constraint.`,
    `[Apply] Choose one tradeoff from the lecture and defend a decision.`,
    `[Analyze] Compare two approaches from the lecture and identify the stronger fit for a real system.`,
    `[Analyze] Identify the failure mode most likely to appear if the lecture's guardrails are ignored.`,
    `[Analyze] Evaluate how the lecture's design choices affect observability, performance, and correctness.`,
    `[Analyze] Build a short argument connecting the framework to an unfamiliar scenario.`,
    `[Analyze] Critique the lecture's case study and propose a better alternative.`,
  ];

  if (config.course.adversarialThinking) {
    questions[8] = "[Analyze] From an attacker's perspective, identify the most exploitable weakness in the design and justify it.";
  }

  return questions;
}

async function generate(config, options) {
  const slug = topicSlug(config);
  const texPath = path.join(options.outputDir, `${slug}_study_questions.tex`);
  const { course, lecture } = config;
  const courseLabel = `${course.code} \u2014 ${course.name}`;
  const allQuestions = deriveQuestions(config);

  const recallQs   = allQuestions.filter((q) => q.startsWith("[Recall]"));
  const applyQs    = allQuestions.filter((q) => q.startsWith("[Apply]"));
  const analyzeQs  = allQuestions.filter((q) => q.startsWith("[Analyze]"));

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
```

- [ ] **Step 2: Syntax-check**

```bash
node --check generators/study-questions.js
```

Expected: no output.

- [ ] **Step 3: Smoke test**

```bash
node generate.js --config examples/lecture-spec.json --output /tmp/lma-test --artifact questions
```

Expected:
```
generated questions: /tmp/lma-test/virtual_memory_and_paging_study_questions.pdf
```

- [ ] **Step 4: Commit**

```bash
git add generators/study-questions.js
git commit -m "feat: rewrite study-questions generator to LaTeX/PDF with Bloom grouping"
```

---

## Task 4: Rewrite `generators/quiz.js` to LaTeX

**Files:**
- Modify: `generators/quiz.js`

- [ ] **Step 1: Rewrite `generators/quiz.js`**

```javascript
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

  const concept = config.lecture.keyConcepts[0];
  const section0 = config.lecture.sections[0].title;

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

async function generate(config, options) {
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
    lines.push(`\\noindent\\textbf{${i + 1}.}${answerNote} ${texEscape(q.rubric)}\\\\[0.5em]`);
  });

  lines.push("\\end{document}\n");

  fs.writeFileSync(texPath, lines.join("\n"));
  return compileLatex(texPath, options.outputDir);
}

module.exports = { generate };
```

- [ ] **Step 2: Syntax-check**

```bash
node --check generators/quiz.js
```

Expected: no output.

- [ ] **Step 3: Smoke test**

```bash
node generate.js --config examples/lecture-spec.json --output /tmp/lma-test --artifact quiz
```

Expected:
```
generated quiz: /tmp/lma-test/virtual_memory_and_paging_quiz.pdf
```

- [ ] **Step 4: Commit**

```bash
git add generators/quiz.js
git commit -m "feat: rewrite quiz generator to LaTeX/PDF with answer key on separate page"
```

---

## Task 5: Restructure `generators/cornell-handout.js`

**Files:**
- Modify: `generators/cornell-handout.js`

- [ ] **Step 1: Rewrite `generators/cornell-handout.js`**

```javascript
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

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

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

  // Instruction
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

    if (section.table) {
      children.push(comparisonTable(section.table));
    } else {
      const rows = [];

      // Blank rows (fill-in)
      (section.blanks || []).forEach((blank) => {
        rows.push({ cue: blank.cue, notes: blank.template, fillIn: true });
      });

      // Key points with scaffolded text (not fill-in — students see context)
      (section.points || []).slice(0, 3).forEach((point, i) => {
        rows.push({ cue: `Point ${i + 1}`, notes: `${point.replace(/\.$/, "")}: _______.`, fillIn: false });
      });

      // Overview as non-fill-in context
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

  // Summary strip
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
```

- [ ] **Step 2: Syntax-check**

```bash
node --check generators/cornell-handout.js
```

Expected: no output.

- [ ] **Step 3: Smoke test**

```bash
node generate.js --config examples/lecture-spec.json --output /tmp/lma-test --artifact cornell
```

Expected:
```
generated cornell: /tmp/lma-test/virtual_memory_and_paging_cornell_handout.docx
```

Verify the file is non-empty:
```bash
ls -lh /tmp/lma-test/virtual_memory_and_paging_cornell_handout.docx
```

Expected: file size > 5 KB.

- [ ] **Step 4: Commit**

```bash
git add generators/cornell-handout.js
git commit -m "feat: restructure Cornell handout to section-mirroring layout with accessible palette"
```

---

## Task 6: Update `lib/spec.js` — fix `defaultSection()` placeholders

**Files:**
- Modify: `lib/spec.js:112-131`

- [ ] **Step 1: Replace `defaultSection()` in `lib/spec.js`**

Find this function (lines 112–131):

```javascript
function defaultSection(sectionTitle, concept, minutes) {
  return {
    title: sectionTitle,
    minutes,
    overview: `Explain ${sectionTitle.toLowerCase()} and connect it to ${concept || "the lecture objectives"}.`,
    points: [
      `Define the core idea behind ${sectionTitle.toLowerCase()}.`,
      `Show one concrete example that makes ${sectionTitle.toLowerCase()} operational.`,
      `Link ${sectionTitle.toLowerCase()} back to the lecture's main tradeoffs.`,
    ],
    activities: [
      `Ask students to explain ${sectionTitle.toLowerCase()} in their own words.`,
    ],
    blanks: [
      {
        cue: sectionTitle,
        template: `${sectionTitle}: _______`,
      },
    ],
  };
}
```

Replace with:

```javascript
function defaultSection(sectionTitle, concept, minutes) {
  return {
    title: sectionTitle,
    minutes,
    overview: `[TODO: 1–2 sentence overview of ${sectionTitle} and its connection to the lecture.]`,
    points: [
      `[TODO: Key point 1 — what is the mechanism or concept in ${sectionTitle}?]`,
      `[TODO: Key point 2 — what is a concrete example or case?]`,
      `[TODO: Key point 3 — what is the tradeoff or failure mode?]`,
    ],
    talkingPoints: [
      `[TODO: What should the instructor say aloud during ${sectionTitle}? Not slide content — what you add verbally.]`,
    ],
    blanks: [
      {
        cue: sectionTitle,
        template: `[TODO: Write a fill-in sentence for students, e.g. "${sectionTitle} works by _______."]`,
      },
    ],
  };
}
```

- [ ] **Step 2: Syntax-check**

```bash
node --check lib/spec.js
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add lib/spec.js
git commit -m "fix: replace defaultSection() template strings with explicit TODO placeholders"
```

---

## Task 7: Update `package.json` check script and run full verification

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `lib/tex-helpers.js` to the `check` script in `package.json`**

Find the `"check"` line and replace with:

```json
"check": "node --check generate.js && node --check init-spec.js && node --check lib/context.js && node --check lib/files.js && node --check lib/spec.js && node --check lib/prompt-parser.js && node --check lib/docx-helpers.js && node --check lib/pptx-helpers.js && node --check lib/tex-helpers.js && node --check generators/lecture-notes.js && node --check generators/cornell-handout.js && node --check generators/study-questions.js && node --check generators/quiz.js && node --check generators/readme.js && node --check generators/slides.js && node --check generators/question-bank.js && node --check generators/exam.js"
```

- [ ] **Step 2: Run full check**

```bash
npm run check
```

Expected: no output (all files parse cleanly).

- [ ] **Step 3: Run full artifact smoke test**

```bash
mkdir -p /tmp/lma-full-test
node generate.js --config examples/lecture-spec.json --output /tmp/lma-full-test
```

Expected (six lines):
```
generated notes: /tmp/lma-full-test/virtual_memory_and_paging_lecture_notes.pdf
generated cornell: /tmp/lma-full-test/virtual_memory_and_paging_cornell_handout.docx
generated questions: /tmp/lma-full-test/virtual_memory_and_paging_study_questions.pdf
generated quiz: /tmp/lma-full-test/virtual_memory_and_paging_quiz.pdf
generated readme: /tmp/lma-full-test/README.md
generated slides: /tmp/lma-full-test/virtual_memory_and_paging_slides.pptx
```

Verify all six output files exist:
```bash
ls -lh /tmp/lma-full-test/
```

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add lib/tex-helpers.js to check script; verify full artifact pipeline"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| `lib/tex-helpers.js` with all listed helpers | Task 1 |
| Instructor fast-glance color palette | Task 1 (COLORS + environments) |
| `lecture-notes.js` → LaTeX/PDF | Task 2 |
| Roman numeral sections | Task 2 (`texSectionRule`) |
| `[HOOK]` block | Task 2 (`texHook`) |
| `[TALKING POINTS]` block | Task 2 (`texTalkingPoints`) |
| `section.talkingPoints` preferred over `speakerNotes` | Task 2 |
| `section.table` → comparison table in lecture notes | Task 2 |
| `study-questions.js` → LaTeX/PDF | Task 3 |
| Bloom grouping (Recall/Apply/Analyze) with sized vspace | Task 3 |
| Adversarial-thinking Q9 substitution | Task 3 |
| `quiz.js` → LaTeX/PDF with answer key on new page | Task 4 |
| `cornell-handout.js` → section-mirroring docx | Task 5 |
| Student accessible palette (WCAG AA) | Task 5 (H constants) |
| Yellow fill-in cells | Task 5 (`H.fillIn`) |
| `section.table` → multi-column fill-in table in handout | Task 5 (`comparisonTable`) |
| Summary strip at bottom | Task 5 (`summaryStrip`) |
| `defaultSection()` placeholder fix | Task 6 |
| `package.json` check script updated | Task 7 |
| Exam generator unchanged | Not touched |
| `slides.js`, `question-bank.js`, `readme.js` unchanged | Not touched (naturally ignore new fields) |

All spec requirements covered.
