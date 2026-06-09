import { describe, test, expect } from 'vitest';
import { buildPalettePairs } from './project-palette.js';

// Synthetic palettes shaped like the real ones, so the test locks the
// extraction logic without coupling to live hex values (which the audit,
// not this unit test, is responsible for guarding).
const sources = {
  instrColors: { navy: '1F3864', keyBody: 'DBEAFE' },
  instrCallouts: { KEY: { badge: 'navy', body: 'keyBody', bodyText: 'navy' } },
  studColors: {
    studText: '111827',
    studObjAccent: '16A34A',
    studObjBg: 'F0FDF4',
    studNavy: '1F3864',
  },
  studKinds: { concept: { color: 'studNavy', cueTint: 'EFF6FF' } },
};

describe('buildPalettePairs', () => {
  test('resolves an instructor callout into body-text and badge pairs', () => {
    const pairs = buildPalettePairs(sources);
    expect(pairs.find((p) => p.name === 'instr/callout-KEY-text')).toMatchObject({
      fg: '1F3864',
      bg: 'DBEAFE',
      size: 'normal',
    });
    expect(pairs.find((p) => p.name === 'instr/callout-KEY-badge')).toMatchObject({
      fg: '1F3864',
      bg: 'DBEAFE',
      size: 'large',
    });
  });

  test('resolves a student section kind as a heading-size pair on its cue tint', () => {
    const pairs = buildPalettePairs(sources);
    expect(pairs.find((p) => p.name === 'stud/section-concept')).toMatchObject({
      fg: '1F3864',
      bg: 'EFF6FF',
      size: 'large',
    });
  });

  test('emits the student objectives functional pair and body-text on white', () => {
    const pairs = buildPalettePairs(sources);
    // The objectives accent renders only as a bold heading + box border, both
    // governed by the 3:1 (large/non-text) threshold — not body-text 4.5:1.
    expect(pairs.find((p) => p.name === 'stud/objectives')).toMatchObject({
      fg: '16A34A',
      bg: 'F0FDF4',
      size: 'large',
    });
    expect(pairs.find((p) => p.name === 'stud/body-text')).toMatchObject({
      fg: '111827',
      bg: 'FFFFFF',
      size: 'normal',
    });
  });

  test('every emitted pair resolves to bare 6-digit hex (no leftover token names)', () => {
    const pairs = buildPalettePairs(sources);
    expect(pairs.length).toBeGreaterThan(0);
    for (const p of pairs) {
      expect(p.fg).toMatch(/^[0-9A-Fa-f]{6}$/);
      expect(p.bg).toMatch(/^[0-9A-Fa-f]{6}$/);
    }
  });

  test('omits functional pairs whose tokens are absent from the palette', () => {
    const pairs = buildPalettePairs(sources);
    // synthetic studColors has no vocab/summary tokens → those pairs skipped
    expect(pairs.find((p) => p.name === 'stud/vocab')).toBeUndefined();
    expect(pairs.find((p) => p.name === 'stud/summary')).toBeUndefined();
  });
});
