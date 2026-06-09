// Accessibility audit-chain stage: turn the project's real LaTeX palettes into
// the canonical set of foreground/background contrast pairs to audit (issue #5).
//
// Single source of truth: the palettes exported from lib/tex-helpers.js
// (instructor) and lib/cornell-tex.js (student Cornell handout). This module
// never copies hex values — it resolves token names against the live palettes,
// so a palette edit is reflected in the audit automatically.
//
// Size classification follows how each color is used in print:
//   - callout/section *badges* and section track colors render at heading size → 'large' (≥3:1)
//   - callout body text, functional accents, and body/muted text → 'normal' (≥4.5:1)
//
// CommonJS to match the lib/ directory convention.

const WHITE = "FFFFFF";
const HEX6 = /^#?[0-9a-fA-F]{6}$/;

// Resolve a value that is either a palette token name or already a hex literal.
function resolve(colors, value) {
  const v = colors[value] != null ? colors[value] : value;
  return typeof v === "string" ? v.replace(/^#/, "") : v;
}

function isHex(v) {
  return typeof v === "string" && HEX6.test(v);
}

// Fixed student functional/neutral pairs — emitted only when both tokens exist
// in the palette (keeps the builder robust to partial/synthetic palettes).
//
// Role-accurate size classification:
//   - objectives/vocab/summary accents render ONLY as bold section headings +
//     box borders → 3:1 large/non-text threshold ('large'), never body text.
//   - body/muted text → body-size 'normal' (4.5:1).
// (studYellowDk is a defined-but-unused token — no rendered role, so no pair.)
const STUDENT_FUNCTIONAL = [
  { name: "stud/objectives", fg: "studObjAccent", bg: "studObjBg", size: "large" },
  { name: "stud/vocab", fg: "studVocabAcc", bg: "studVocabBg", size: "large" },
  { name: "stud/summary", fg: "studSummaryAcc", bg: "studSummaryBg", size: "large" },
  { name: "stud/body-text", fg: "studText", bg: WHITE, size: "normal" },
  { name: "stud/muted-text", fg: "studMuted", bg: WHITE, size: "normal" },
];

function buildPalettePairs({ instrColors = {}, instrCallouts = {}, studColors = {}, studKinds = {} } = {}) {
  const pairs = [];
  const push = (name, fgRaw, bgRaw, size, colors) => {
    const fg = resolve(colors, fgRaw);
    const bg = resolve(colors, bgRaw);
    if (isHex(fg) && isHex(bg)) pairs.push({ name, fg, bg, size });
  };

  // Instructor callouts: badge (heading) + body text, both on the callout body fill.
  for (const [role, cfg] of Object.entries(instrCallouts)) {
    push(`instr/callout-${role}-text`, cfg.bodyText, cfg.body, "normal", instrColors);
    push(`instr/callout-${role}-badge`, cfg.badge, cfg.body, "large", instrColors);
  }

  // Student section tracks: track color at heading size on its cue tint.
  for (const [kind, cfg] of Object.entries(studKinds)) {
    push(`stud/section-${kind}`, cfg.color, cfg.cueTint, "large", studColors);
  }

  // Student functional + neutral pairs.
  for (const spec of STUDENT_FUNCTIONAL) {
    push(spec.name, spec.fg, spec.bg, spec.size, studColors);
  }

  return pairs;
}

// Wire the real, live project palettes (single source of truth) into pairs.
function projectColorPairs() {
  const tex = require("../tex-helpers.js");
  const cornell = require("../cornell-tex.js");
  return buildPalettePairs({
    instrColors: tex.COLORS,
    instrCallouts: tex.CALLOUT_CONFIG,
    studColors: cornell.COLORS,
    studKinds: cornell.SECTION_KINDS,
  });
}

module.exports = { buildPalettePairs, projectColorPairs };
