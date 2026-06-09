// Accessibility audit-chain stage: contrast-check a set of foreground/background
// color pairs against a WCAG conformance target (issue #5).
//
// Each pair: { name, fg, bg, level?, size? }  (hex bare or with '#').
// Per-pair level/size override the report-wide defaults.
//
// Returns a structured report (no throwing on a failing pair — failures are
// data, so the caller can render them and set an exit code):
//   { results: [{ name, fg, bg, ratio, required, level, size, pass }],
//     failures: [...results where !pass],
//     passed, failed, ok }
//
// CommonJS to match the lib/ directory convention.

const { contrastRatio, thresholdFor } = require("./contrast.js");

function auditColorPairs(pairs, { level = "AA", size = "normal" } = {}) {
  const results = (pairs || []).map((p) => {
    const lvl = p.level || level;
    const sz = p.size || size;
    const ratio = contrastRatio(p.fg, p.bg);
    const required = thresholdFor({ level: lvl, size: sz });
    return {
      name: p.name,
      fg: p.fg,
      bg: p.bg,
      level: lvl,
      size: sz,
      ratio,
      required,
      pass: ratio >= required,
    };
  });

  const failures = results.filter((r) => !r.pass);
  return {
    results,
    failures,
    passed: results.length - failures.length,
    failed: failures.length,
    ok: failures.length === 0,
  };
}

module.exports = { auditColorPairs };
