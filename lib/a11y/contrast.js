// WCAG 2.1 contrast math — the deterministic backbone of the accessibility
// audit chain (issue #5). Pure functions, no I/O, no dependencies.
//
// Palette tokens in lib/cornell-tex.js (stud*) and lib/tex-helpers.js (instr*)
// store bare 6-digit hex (no leading '#'), so hexToRgb accepts both forms.
//
// CommonJS to match the lib/ directory convention (lib/package.json: commonjs).
//
// Refs: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
//       https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio

const HEX6 = /^#?([0-9a-fA-F]{6})$/;

function hexToRgb(hex) {
  const m = typeof hex === "string" && hex.match(HEX6);
  if (!m) throw new Error(`Malformed hex color: ${JSON.stringify(hex)}`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

// Linearize one 0–255 channel per the WCAG sRGB formula.
function linearizeChannel(c) {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// Minimum contrast thresholds by conformance level and text size.
const THRESHOLDS = {
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 },
};

function thresholdFor({ level = "AA", size = "normal" } = {}) {
  const byLevel = THRESHOLDS[level];
  if (!byLevel) throw new Error(`Unknown WCAG level: ${level}`);
  const threshold = byLevel[size];
  if (threshold === undefined) throw new Error(`Unknown text size: ${size}`);
  return threshold;
}

function meetsWCAG(ratio, opts = {}) {
  return ratio >= thresholdFor(opts);
}

module.exports = { hexToRgb, relativeLuminance, contrastRatio, meetsWCAG, thresholdFor };
