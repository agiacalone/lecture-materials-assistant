import { describe, test, expect } from 'vitest';
import { auditColorPairs } from './palette-audit.js';

describe('auditColorPairs', () => {
  test('passes a high-contrast pair and records the ratio', () => {
    const report = auditColorPairs([{ name: 'title', fg: '000000', bg: 'FFFFFF' }]);
    expect(report.ok).toBe(true);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(0);
    expect(report.results[0].ratio).toBeCloseTo(21, 1);
    expect(report.results[0].pass).toBe(true);
    expect(report.results[0].required).toBe(4.5); // AA normal default
  });

  test('fails a low-contrast pair and reports it', () => {
    const report = auditColorPairs([{ name: 'faint', fg: 'CCCCCC', bg: 'FFFFFF' }]);
    expect(report.ok).toBe(false);
    expect(report.failed).toBe(1);
    expect(report.results[0].pass).toBe(false);
  });

  test('aggregates mixed pairs — ok only when every pair passes', () => {
    const report = auditColorPairs([
      { name: 'good', fg: '000000', bg: 'FFFFFF' },
      { name: 'bad', fg: 'DDDDDD', bg: 'FFFFFF' },
    ]);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.ok).toBe(false);
    expect(report.failures.map((f) => f.name)).toEqual(['bad']);
  });

  test('honors a per-pair size override (large text → 3:1 threshold)', () => {
    // A pair that clears 3:1 (large) but not 4.5:1 (normal).
    const pair = { name: 'heading', fg: '767676', bg: 'FFFFFF' };
    const asNormal = auditColorPairs([pair]);
    const asLarge = auditColorPairs([{ ...pair, size: 'large' }]);
    expect(asNormal.results[0].required).toBe(4.5);
    expect(asLarge.results[0].required).toBe(3);
    expect(asLarge.results[0].pass).toBe(true);
  });

  test('honors AAA level via options', () => {
    // ~5.9:1 clears AA(4.5) but not AAA(7).
    const pair = { name: 'amber', fg: 'B45309', bg: 'FFFFFF' };
    expect(auditColorPairs([pair], { level: 'AA' }).ok).toBe(true);
    expect(auditColorPairs([pair], { level: 'AAA' }).ok).toBe(false);
  });

  test('empty input is vacuously ok', () => {
    const report = auditColorPairs([]);
    expect(report.ok).toBe(true);
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(0);
  });
});
