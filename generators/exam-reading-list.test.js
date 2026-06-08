import { describe, it, expect } from 'vitest';
import { parse } from '../parser/index.js';
import { generateExamReadingList } from './exam-reading-list.js';

const FIXTURE = 'examples/file_systems_abstraction_lecture_main.md';

describe('exam-reading-list generator', () => {
  it('emits a study-guide markdown with frontmatter, source block, and references', () => {
    const parsed = parse({ path: FIXTURE });
    const md = generateExamReadingList([{ parsed }], {
      examName: 'Midterm 1',
      course: 'CECS 326',
      term: 'sp26',
    });
    expect(md).toMatch(/^---/); // YAML frontmatter
    expect(md).toContain('generated-by: reg-exam-readinglist');
    expect(md).toContain('# CECS 326 — Midterm 1 Reading List');
    expect(md).toContain('> [!source] Primary source');
    expect(md).toContain('## References');
    // The single topic renders as Part A with the lecture's title.
    expect(md).toMatch(/# Part A — File Systems/);
  });

  it('consolidates multiple topics into Part A / Part B sections', () => {
    const parsed = parse({ path: FIXTURE });
    const md = generateExamReadingList([{ parsed }, { parsed }], { examName: 'Final' });
    expect(md).toMatch(/# Part A — /);
    expect(md).toMatch(/# Part B — /);
  });

  it('honors a custom textbook + citation key in the source block', () => {
    const parsed = parse({ path: FIXTURE });
    const md = generateExamReadingList([{ parsed }], {
      examName: 'Midterm 1',
      textbook: 'Stallings & Brown, *Computer Security*, 4th ed.',
      citationKey: 'Stallings',
    });
    expect(md).toContain('Stallings & Brown, *Computer Security*, 4th ed.');
  });

  it('renders an optional instructor note as a warning callout', () => {
    const parsed = parse({ path: FIXTURE });
    const md = generateExamReadingList([{ parsed }], {
      examName: 'Midterm 1',
      note: 'Cues newer than the textbook.',
      noteTitle: 'Beyond the textbook',
    });
    expect(md).toContain('> [!warning] Beyond the textbook');
    expect(md).toContain('Cues newer than the textbook.');
  });
});
