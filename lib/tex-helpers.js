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

% Talking points environment - amber, instructor voice
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

% Hook block - teal, "start here"
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
