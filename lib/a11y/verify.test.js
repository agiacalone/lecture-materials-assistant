import { describe, test, expect } from 'vitest';
import { formatReport } from './verify.js';
import { projectColorPairs } from './project-palette.js';
import { auditColorPairs } from './palette-audit.js';

describe('formatReport', () => {
  const report = auditColorPairs([
    { name: 'good', fg: '000000', bg: 'FFFFFF' },
    { name: 'bad', fg: 'DDDDDD', bg: 'FFFFFF' },
  ]);

  test('marks passing and failing pairs and prints the failure threshold', () => {
    const out = formatReport(report, { level: 'AA' });
    expect(out).toContain('[PASS]');
    expect(out).toContain('[FAIL]');
    expect(out).toContain('good');
    expect(out).toContain('needs 4.5:1');
  });

  test('summary line reflects the pass/fail counts and overall result', () => {
    const out = formatReport(report, { level: 'AA' });
    expect(out).toContain('1 passed · 1 failed · 2 total');
    expect(out).toContain('RESULT: FAIL');
  });
});

describe('projectColorPairs (real palette wiring)', () => {
  test('returns hex-resolved pairs from the live project palettes', () => {
    const pairs = projectColorPairs();
    expect(pairs.length).toBeGreaterThan(0);
    for (const p of pairs) {
      expect(p.fg).toMatch(/^[0-9A-Fa-f]{6}$/);
      expect(p.bg).toMatch(/^[0-9A-Fa-f]{6}$/);
      expect(['normal', 'large']).toContain(p.size);
    }
  });

  test('includes the known instructor callout and student section pairs', () => {
    const names = projectColorPairs().map((p) => p.name);
    expect(names).toContain('instr/callout-KEY-text');
    expect(names).toContain('stud/section-concept');
    expect(names).toContain('stud/body-text');
  });
});
