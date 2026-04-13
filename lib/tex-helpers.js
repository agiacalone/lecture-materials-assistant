"use strict";

const { spawnSync } = require("child_process");
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

const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];

function texEscape(str) {
  return String(str || "").replace(/[\\&%$#_{}~^]/g, (ch) => {
    switch (ch) {
      case "\\": return "\\textbackslash{}";
      case "&":  return "\\&";
      case "%":  return "\\%";
      case "$":  return "\\$";
      case "#":  return "\\#";
      case "_":  return "\\_";
      case "{":  return "\\{";
      case "}":  return "\\}";
      case "~":  return "\\textasciitilde{}";
      case "^":  return "\\textasciicircum{}";
    }
  });
}

function toRoman(index) {
  if (index >= ROMAN.length) {
    console.warn(`tex-helpers: section index ${index} exceeds Roman numeral table, using Arabic`);
    return String(index + 1);
  }
  return ROMAN[index];
}

function texPreamble(headerLeft, headerRight, opts = {}) {
  const fontSize = opts.fontSize || "12pt";
  const margin = opts.margin || "1in";
  // tightSpacing: suppress parskip's inter-paragraph stretch for dense layouts
  const spacingSetup = opts.tightSpacing
    ? `\\setlength{\\parskip}{1pt}\\setlength{\\parindent}{0pt}`
    : `\\usepackage{parskip}`;
  const colorDefs = Object.entries(COLORS)
    .map(([name, hex]) => `\\definecolor{${name}}{HTML}{${hex}}`)
    .join("\n");

  return `\\documentclass[${fontSize}]{article}
\\usepackage[margin=${margin}]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{xcolor}
\\usepackage{colortbl}
\\usepackage{mdframed}
\\usepackage{booktabs}
\\usepackage{tabularx}
\\usepackage{enumitem}
\\usepackage{fancyhdr}
\\usepackage[hyphens]{url}
\\usepackage[hidelinks]{hyperref}
\\usepackage{listings}
\\usepackage{array}
\\usepackage{needspace}
${spacingSetup}

${colorDefs}

% Talking points — full-width stacked box (used by non-briefing generators)
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

% Talking points — compact left-bar style for briefing/quick-ref layout
\\newmdenv[
  topline=false,
  bottomline=false,
  rightline=false,
  linewidth=3pt,
  linecolor=instrAmber,
  backgroundcolor=instrAmber!8,
  innerleftmargin=8pt,
  innerrightmargin=6pt,
  innertopmargin=4pt,
  innerbottommargin=4pt,
  skipabove=4pt,
  skipbelow=4pt
]{talkingbarenv}

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
  skipbelow=4pt,
  nobreak=true
]{hookenv}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small\\textbf{${texEscape(headerLeft)}}}
\\fancyhead[R]{\\small\\textbf{${texEscape(headerRight)}}}
\\fancyfoot[C]{\\small Page \\thepage}
\\renewcommand{\\headrulewidth}{0.4pt}

\\setlist[itemize]{noitemsep, topsep=3pt, leftmargin=1.4em, parsep=0pt}
\\setlist[enumerate]{noitemsep, topsep=3pt, leftmargin=1.4em, parsep=0pt}

\\lstset{
  basicstyle=\\ttfamily\\small,
  backgroundcolor=\\color{black!5},
  frame=single,
  framesep=4pt,
  breaklines=true,
  columns=flexible,
}

% Allow extra inter-word stretch to prevent overfull hboxes for long URLs/words
\\setlength{\\emergencystretch}{2em}
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
\\needspace{5\\baselineskip}
\\vspace{0.8em}
\\noindent{\\color{instrNavy}\\rule{\\linewidth}{1.5pt}}\\par\\nopagebreak[4]%
{\\color{instrNavy}\\large\\textbf{${roman}. ${texEscape(title)}}}\\par\\nopagebreak[4]%
\\noindent{\\color{instrNavy}\\rule{\\linewidth}{0.4pt}}
\\vspace{0.3em}
`;
}

function texPlainSection(title) {
  return `
\\needspace{4\\baselineskip}
\\vspace{0.8em}
\\noindent{\\color{instrNavy}\\rule{\\linewidth}{1.5pt}}\\par\\nopagebreak[4]%
{\\color{instrNavy}\\large\\textbf{${texEscape(title)}}}\\par\\nopagebreak[4]%
\\noindent{\\color{instrNavy}\\rule{\\linewidth}{0.4pt}}
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
  if (!CALLOUT_CONFIG[label]) {
    console.warn(`tex-helpers: unknown callout label "${label}", falling back to KEY`);
  }
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
  skipbelow=4pt,
  nobreak=true
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
    .map((row) => {
      const cells = row.slice(0, n);
      while (cells.length < n) cells.push("");
      return cells.map((cell) => texEscape(cell)).join(" & ") + " \\\\\\hline";
    })
    .join("\n");
  return `
\\vspace{4pt}
\\noindent\\begin{tabularx}{\\linewidth}{${colSpec}}
\\hline
\\rowcolor{instrNavy}
${headerRow} \\\\\\hline
${dataRows}
\\end{tabularx}
\\vspace{4pt}
`;
}

// Escape str for LaTeX, but detect bare URLs and wrap them in \url{} so the
// url package can break them at safe characters (hyphens, slashes, etc.).
function texEscapeWithUrls(str) {
  const parts = String(str || "").split(/(https?:\/\/[^\s]+)/);
  return parts.map((part, i) => (i % 2 === 1 ? `\\url{${part}}` : texEscape(part))).join("");
}

function texBulletList(items) {
  if (!items || items.length === 0) return "";
  return `\\begin{itemize}\n${items.map((item) => `  \\item ${texEscapeWithUrls(item)}`).join("\n")}\n\\end{itemize}\n`;
}

function texCodeBlock(lines, lang) {
  const langOpt = lang ? `language=${lang},` : "";
  return `\\begin{lstlisting}[${langOpt}frame=single]\n${lines.join("\n")}\n\\end{lstlisting}\n`;
}

// Dense quick-ref briefing layout for a single lecture section.
// Navy filled header strip for instant visual anchoring.
// Bullet points followed by a compact left-bar amber talking-points block.
// Single column — no minipages, no overflow.
function texBriefingSection(title, index, minutes, overview, points, talkingPoints) {
  const roman = toRoman(index);
  const minuteStr = minutes ? ` (${minutes} min)` : "";
  const hasTP = talkingPoints && talkingPoints.length > 0;
  const hasPoints = points && points.length > 0;

  const parts = [];

  // Navy filled header strip — snaps to section on fast glance
  parts.push(`\\needspace{5\\baselineskip}
\\vspace{5pt}
\\begin{mdframed}[
  backgroundcolor=instrNavy,
  linewidth=0pt,
  innertopmargin=4pt,
  innerbottommargin=4pt,
  innerleftmargin=7pt,
  innerrightmargin=7pt,
  skipabove=4pt,
  skipbelow=0pt,
  nobreak=true
]
{\\color{white}\\textbf{\\normalsize ${roman}. ${texEscape(title)}${texEscape(minuteStr)}}}
\\end{mdframed}
\\nopagebreak[4]`);

  // Overview — navy italic, visually quieter than body points
  if (overview) {
    parts.push(`\\noindent{\\small\\color{instrNavy}\\itshape ${texEscape(overview)}}\\par\\nopagebreak[4]`);
  }

  // Content bullet points
  if (hasPoints) {
    const ptItems = points.map((pt) => `  \\item ${texEscape(pt)}`).join("\n");
    parts.push(`\\begin{itemize}[noitemsep,topsep=2pt,leftmargin=1.4em,parsep=0pt]\n${ptItems}\n\\end{itemize}`);
  }

  // Talking points — amber left-bar, compact and tight
  if (hasTP) {
    const tpItems = talkingPoints.map((tp) => `  \\item ${texEscape(tp)}`).join("\n");
    parts.push(`\\begin{talkingbarenv}
{\\small\\textbf{\\color{instrAmber}TALKING POINTS}}
{\\small
\\begin{itemize}[noitemsep,topsep=2pt,leftmargin=1.2em,parsep=0pt]
${tpItems}
\\end{itemize}
}
\\end{talkingbarenv}`);
  }

  return parts.join("\n");
}

function compileLatex(texPath, outputDir) {
  const args = ["-interaction=nonstopmode", "-output-directory", outputDir, texPath];
  spawnSync("pdflatex", args, { stdio: "ignore" });
  spawnSync("pdflatex", args, { stdio: "ignore" }); // second pass for refs
  const pdfPath = path.join(outputDir, path.basename(texPath).replace(/\.tex$/, ".pdf"));
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`pdflatex did not produce a PDF: ${pdfPath}. Check the .tex file for errors.`);
  }
  return pdfPath;
}

module.exports = {
  compileLatex,
  texBriefingSection,
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
