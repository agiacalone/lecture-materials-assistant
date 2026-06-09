import { describe, test, expect } from 'vitest';
import { hexToRgb, relativeLuminance, contrastRatio, meetsWCAG } from './contrast.js';

describe('hexToRgb', () => {
  test('parses a 6-digit hex with leading #', () => {
    expect(hexToRgb('#4F46E5')).toEqual({ r: 0x4f, g: 0x46, b: 0xe5 });
  });

  test('parses a 6-digit hex without leading # (palette tokens store bare hex)', () => {
    expect(hexToRgb('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  test('is case-insensitive', () => {
    expect(hexToRgb('aabbcc')).toEqual(hexToRgb('AABBCC'));
  });

  test('throws on malformed hex', () => {
    expect(() => hexToRgb('xyz')).toThrow();
  });
});

describe('relativeLuminance (WCAG 2.1 reference values)', () => {
  test('white is 1', () => {
    expect(relativeLuminance('FFFFFF')).toBeCloseTo(1, 5);
  });

  test('black is 0', () => {
    expect(relativeLuminance('000000')).toBeCloseTo(0, 5);
  });
});

describe('contrastRatio (WCAG 2.1 reference values)', () => {
  test('black on white is 21:1', () => {
    expect(contrastRatio('000000', 'FFFFFF')).toBeCloseTo(21, 2);
  });

  test('is symmetric (order does not matter)', () => {
    expect(contrastRatio('4F46E5', 'EEF2FF')).toBeCloseTo(contrastRatio('EEF2FF', '4F46E5'), 5);
  });

  test('identical colors are 1:1', () => {
    expect(contrastRatio('123456', '123456')).toBeCloseTo(1, 5);
  });
});

describe('meetsWCAG', () => {
  test('AA normal text needs >= 4.5:1', () => {
    expect(meetsWCAG(4.5, { level: 'AA', size: 'normal' })).toBe(true);
    expect(meetsWCAG(4.49, { level: 'AA', size: 'normal' })).toBe(false);
  });

  test('AA large text needs >= 3:1', () => {
    expect(meetsWCAG(3, { level: 'AA', size: 'large' })).toBe(true);
    expect(meetsWCAG(2.99, { level: 'AA', size: 'large' })).toBe(false);
  });

  test('AAA normal text needs >= 7:1', () => {
    expect(meetsWCAG(7, { level: 'AAA', size: 'normal' })).toBe(true);
    expect(meetsWCAG(6.99, { level: 'AAA', size: 'normal' })).toBe(false);
  });

  test('defaults to AA normal', () => {
    expect(meetsWCAG(4.5)).toBe(true);
    expect(meetsWCAG(4.0)).toBe(false);
  });
});
