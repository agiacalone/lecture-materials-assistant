#!/usr/bin/env node
"use strict";

// Accessibility audit-chain runner (issue #5).
//
// Stage 1 — palette contrast: audit every student/instructor color pair against
// a WCAG target and exit non-zero on any failure, so generation and CI can gate
// on it. Future stages (tagged-PDF / reading-order via veraPDF, alt-text lint,
// table headers) hang off this same runner.
//
// Usage:
//   node lib/a11y/verify.js [--level AA|AAA]
//
// CommonJS to match the lib/ directory convention.

const { projectColorPairs } = require("./project-palette.js");
const { auditColorPairs } = require("./palette-audit.js");

function formatReport(report, { level }) {
  const lines = [];
  lines.push(`ADA Title II / WCAG ${level} — palette contrast audit`);
  lines.push("=".repeat(52));
  for (const r of report.results) {
    const mark = r.pass ? "PASS" : "FAIL";
    const ratio = `${r.ratio.toFixed(2)}:1`.padStart(7);
    const need = `(needs ${r.required}:1, ${r.size})`;
    lines.push(`  [${mark}] ${ratio}  ${r.name}  ${r.fg} on ${r.bg} ${r.pass ? "" : need}`.trimEnd());
  }
  lines.push("-".repeat(52));
  lines.push(`  ${report.passed} passed · ${report.failed} failed · ${report.results.length} total`);
  lines.push(report.ok ? "  RESULT: PASS — palette meets the target" : "  RESULT: FAIL — fix the pairs above");
  return lines.join("\n");
}

function parseLevel(argv) {
  const i = argv.indexOf("--level");
  if (i >= 0 && argv[i + 1]) {
    const lvl = argv[i + 1].toUpperCase();
    if (lvl === "AA" || lvl === "AAA") return lvl;
    throw new Error(`--level must be AA or AAA, got ${argv[i + 1]}`);
  }
  return "AA";
}

function main(argv) {
  const level = parseLevel(argv);
  const report = auditColorPairs(projectColorPairs(), { level });
  process.stdout.write(formatReport(report, { level }) + "\n");
  return report.ok ? 0 : 1;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { formatReport, main };
