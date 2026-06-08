// Exam reading-list generator — consolidates SEVERAL lecture topics into ONE
// per-exam study guide (the multi-topic companion to the single-topic
// reading-list). Driven by lectern's `reg-exam-readinglist` via an exam→topics
// manifest (option A: the exam declares which topics it covers).
//
// For each topic's _lecture_main.md it pulls: vocabulary (term + [citation::]),
// per-section Cornell cues ([cue::]/derived + [citation::]), the Self-Quiz, and
// the References block — and assembles the cue→source study-guide format used
// by the hand-authored final_third_reading_list.

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const LETTERS = ['A','B','C','D','E','F','G','H'];

function vocabTerm(item) {
  const t = item.text || '';
  const m = /^\*\*([^*]+)\*\*/.exec(t) || /^([^—–-]+?)\s*[—–-]/.exec(t);
  return m ? m[1].trim() : t.split(/\s+/).slice(0, 3).join(' ');
}
function deriveCue(item) {
  const c = item.fields && item.fields.get && item.fields.get('cue');
  if (c) return c;
  const t = (item.text || '').replace(/[*_`]+/g, '').trim();
  const head = t.slice(0, 32);
  const m = /^([^.,;:!?]{3,30})[.,;:!?]/.exec(head);
  if (m) return m[1].trim();
  const w = t.split(/\s+/).slice(0, 3).join(' ');
  return w.length > 30 ? w.slice(0, 28) + '…' : w;
}
function cite(item) {
  return (item.fields && item.fields.get && item.fields.get('citation')) || '';
}
function chapterOf(parsed, citationKey) {
  const re = new RegExp(citationKey || 'tanenbaum', 'i');
  // Prefer the curated textbook line in ## References — it names the canonical
  // chapters; inline citations include incidental cross-chapter references.
  const tbLine = extractReferences(parsed.body).find((r) => re.test(r));
  if (tbLine) {
    const chs = [...tbLine.matchAll(/\bch(?:apter)?s?\.?\s*(\d+)/gi)].map((x) => Number(x[1]));
    if (chs.length) return [...new Set(chs)].sort((a, b) => a - b);
  }
  // Fallback: scan inline citations for the leading chapter number.
  const chaps = new Set();
  for (const it of parsed.items || []) {
    const c = cite(it);
    if (!re.test(c)) continue;
    const m = /(\d+)(?:\.\d+)*/.exec(c);
    if (m) chaps.add(Number(m[1]));
  }
  return [...chaps].sort((a, b) => a - b);
}
function extractReferences(body) {
  if (!body) return [];
  const lines = body.split('\n');
  const i = lines.findIndex((l) => /^##\s+References\s*$/.test(l));
  if (i < 0) return [];
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^#{1,2}\s+/.test(lines[j])) break;
    const m = /^-\s+(.+?)\s*$/.exec(lines[j]);
    if (m) out.push(m[1]);
  }
  return out;
}
function sectionTitle(parsed, key) {
  const re = new RegExp(`^##\\s+${key}\\.\\s+(.+?)(?:\\s+\\(\\d+\\s*min\\))?\\s*$`, 'm');
  const m = re.exec(parsed.body || '');
  return m ? m[1].trim() : key;
}
function romanKeys(parsed) {
  return [...parsed.bySection.keys()]
    .filter((k) => /^[IVXLCDM]+$/.test(k))
    .sort((a, b) => ROMAN.indexOf(a) - ROMAN.indexOf(b));
}

function topicPart(parsed, letter) {
  const title = (parsed.frontmatter || {}).title || 'Topic';
  const out = [`# Part ${letter} — ${title}`, ''];

  const vocab = parsed.byRole.get('vocab') || [];
  if (vocab.length) {
    out.push(`## ${letter}. Vocabulary`, '');
    out.push('| Term | Where it’s defined |', '|---|---|');
    for (const v of vocab) out.push(`| **${vocabTerm(v)}** | ${cite(v) || '(see lecture)'} |`);
    out.push('');
  }

  romanKeys(parsed).forEach((key, idx) => {
    const blanks = (parsed.bySection.get(key) || []).filter((it) => it.tags.has('blank'));
    if (!blanks.length) return;
    out.push(`## ${letter}.${ROMAN[idx]} — ${sectionTitle(parsed, key)}`, '');
    out.push('| Cue from handout | Read here |', '|---|---|');
    for (const b of blanks) out.push(`| **${deriveCue(b)}** | ${cite(b) || '(see lecture)'} |`);
    out.push('');
  });

  const sq = parsed.byRole.get('self-quiz') || [];
  if (sq.length) {
    out.push(`## ${letter}.Self-Quiz`, '');
    for (const q of sq) out.push(`- ${String(q.text || '').replace(/^`?Q\d+\.`?\s*/, '').replace(/^#adversarial\s*/, '')}`);
    out.push('');
  }

  out.push(`## ${letter}.Summary`, '');
  out.push(`In your own words, write three sentences that capture the core ideas of **${title}**.`, '');
  return out.join('\n');
}

export function generateExamReadingList(topics, opts = {}) {
  const examName = opts.examName || 'Exam';
  const course = opts.course || '';
  const term = opts.term || '';
  const textbook = opts.textbook || 'Tanenbaum & Bos, *Modern Operating Systems*, 4th/5th ed.';
  const citationKey = opts.citationKey || 'tanenbaum';
  const note = opts.note || '';
  const noteTitle = opts.noteTitle || 'Beyond the textbook';
  const titles = topics.map((t) => (t.parsed.frontmatter || {}).title).filter(Boolean);

  const out = [];
  out.push('---');
  out.push(`title: ${course ? course + ' — ' : ''}${examName} Reading List (${titles.join(' + ')})`);
  if (course) out.push(`course: ${course}`);
  out.push('type: reading-list');
  out.push('companion-to:');
  for (const t of topics) {
    const fm = t.parsed.frontmatter || {};
    const slug = fm.topicSlug || fm['topic-slug'];
    if (slug) out.push(`  - "[[${slug}_cornell_handout]]"`);
  }
  out.push('tags:');
  out.push('  - reading-list');
  out.push('  - study-guide');
  out.push('  - exam-study-guide');
  out.push('icon: LiGraduationCap');
  out.push('iconColor: var(--text-normal)');
  out.push('generated-by: reg-exam-readinglist');
  out.push('---');
  out.push('');
  out.push(`# ${course ? course + ' — ' : ''}${examName} Reading List`);
  out.push('');
  out.push(`**${[course, term].filter(Boolean).join(' — ')}${course || term ? ' · ' : ''}${examName}**`);
  out.push('');
  out.push('> [!info] How to use this document');
  out.push(`> Pair this side-by-side with your ${titles.map((t) => `**${t}**`).join(' and ')} Cornell handout(s). For each blank you didn’t fill in during lecture, this map points to where in the assigned reading the answer lives. Read the cited section, fill the blank in your own words, then redo the Self-Quiz and Summary strips.`);
  out.push('');
  out.push('> [!source] Primary source');
  out.push(`> ${textbook}`);
  for (const t of topics) {
    const ch = chapterOf(t.parsed, citationKey);
    out.push(`> - **${(t.parsed.frontmatter || {}).title}** — Chapter ${ch.join(', ') || '?'}`);
  }
  out.push('>');
  out.push('> Section numbers in the tables below refer to those chapters.');
  out.push('');
  if (note) {
    out.push(`> [!warning] ${noteTitle}`);
    for (const line of String(note).split('\n')) out.push(`> ${line}`);
    out.push('');
  }
  out.push('---');
  out.push('');

  topics.forEach((t, i) => {
    out.push(topicPart(t.parsed, LETTERS[i]));
    out.push('---', '');
  });

  out.push('## References', '');
  out.push(`**Textbook:** ${textbook}`, '');
  const skipRe = new RegExp('^' + citationKey, 'i');
  const seen = new Set();
  for (const t of topics) {
    for (const r of extractReferences(t.parsed.body)) {
      if (skipRe.test(r)) continue; // collapse the textbook / per-section chapter pointers (header already states it)
      if (!seen.has(r)) { seen.add(r); out.push(`- ${r}`); }
    }
  }
  out.push('');
  return out.join('\n');
}

export default generateExamReadingList;
