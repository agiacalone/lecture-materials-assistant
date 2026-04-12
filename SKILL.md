---
name: lecture-materials-assistant
description: >
  Generates complete lecture material sets for CS professors: lecture notes (.docx),
  Cornell note-taking handouts (.docx), study questions (.docx), pop quizzes (.docx),
  GitHub Classroom README assignments (.md), and slide decks (.pptx). Use this skill
  whenever a user asks to generate, create, or update any lecture materials, course
  handouts, slides, quizzes, or GitHub Classroom assignments — even partial requests
  like "make me a Cornell handout for X", "add questions to the README", or "write a
  pop quiz on Y". Enforces strict style consistency, Cornell ↔ slide alignment
  auditing, and tiered difficulty question design. Always use this skill for any CS
  lecture content generation task.
---

# Lecture Materials Assistant

Generates styled, production-ready lecture materials for CS courses. All artifacts
follow a strict style guide. See `references/style-guide.md` for complete specs.

**Read `references/style-guide.md` before generating any artifact.**

---

## Installation (Claude Code)

Place this skill directory at `~/.claude/skills/lecture-materials-assistant/` or
reference it in your project's `CLAUDE.md`:

```markdown
## Skills
- Use the lecture materials assistant skill at ./lecture-materials-assistant/SKILL.md
  for all lecture content generation.
```

Start each session with:
```
Read CLAUDE.md and the lecture-materials-assistant skill, then generate materials
for [TOPIC] in [COURSE].
```

Output files are written to the current working directory. Organize by course repo/folder.

---

## Capturing Course Context

Before generating, confirm these four fields. Once provided in a session, remember
them — never re-ask.

| Field | Example |
|---|---|
| **Course code + name** | CECS 326 — Operating Systems |
| **Student level** | Upper-division CS majors; strong C/systems programming background |
| **Lecture length** | ~75 minutes |
| **Assessment format** | GitHub Classroom (Markdown), in-class activities |
| **Adversarial thinking** | yes (Security) / no (OS, Distributed Systems) |

If any field is missing from the request, ask for it before proceeding.
`adversarial-thinking` defaults to **no** if not specified.

---

## What to Generate

| Artifact | File | When |
|---|---|---|
| Lecture notes | `[topic]_lecture_notes.docx` | Full instructor copy with speaker notes, timing, callouts |
| Cornell handout | `[topic]_cornell_handout.docx` | 2-page student sheet with strategic blanks |
| Study questions | `[topic]_study_questions.docx` | 10 tiered questions for out-of-class review |
| Pop quiz | `[topic]_quiz.docx` | 5-question in-class quiz with instructor answer key |
| Question bank | `[topic]_question_bank.md` | ~50 tagged questions (mc/tf/code/fib/sa), scoped to full topic (2–4 sessions) |
| Exam | `[course]-exam-[n]-[term].pdf` | Assembled from bank(s), compiled via pdflatex; `.tex` source retained; answer key via `\ifanswers` toggle + recompile |
| GitHub README | `README.md` | GitHub Classroom assignment (reading or lab/programming variant) |
| Slide deck | `[topic]_slides.pptx` | 14–18 slides, CS Modern dark slate theme |

**Default (generate everything — single session):**
> "Generate lecture materials for [TOPIC] in [COURSE]. Cover: [KEY CONCEPTS]. Case studies: [EXAMPLES]. ~[N] minutes."

**Subset:** "Generate lecture notes and slides only for [TOPIC]."

**Update existing:** "Reusing [TOPIC] lecture — add section on [NEW CONCEPT]. Add 2 README questions covering it."

**Question bank (topic-wide, multi-session):**
> "Generate a question bank for [TOPIC] in [COURSE]. Sessions covered: [SUBTOPIC 1], [SUBTOPIC 2], [SUBTOPIC 3]. Total material: ~[N] hours."

The question bank requires the full topic scope — all subtopics and sessions — before
generating. If subtopics are not provided, ask for them before proceeding.

**Exam (assembled from 2–3 topic banks):**
> "Assemble an exam for [COURSE] [TERM], [EXAM NAME], [N] pts. Draw from: [bank1.md], [bank2.md], [bank3.md]. MC: [N] questions × [pts] pts. Essay: [N] questions × [pts] pts. Difficulty: ★ [N]%, ★★ [N]%, ★★★ [N]%. Randomize: yes/no."

Exams typically span 2–3 lecture topics. If topics had unequal session counts,
weight question selection proportionally (e.g. a 3-session topic gets more
questions than a 2-session topic in the same exam).

For two parallel sections needing different question sets, run assembly twice with
`randomize: yes` — same bank, different shuffle. Provide the section identifier so
file names are distinct (e.g. `326-exam-1-sp26-a.tex`, `326-exam-1-sp26-b.tex`).

**Exam file naming convention:**
- `[course_num]-exam-[n]-[term]` — e.g. `326-exam-1-sp26`
- Term format: `sp` / `fa` / `su` + 2-digit year (e.g. `sp26`, `fa25`)
- Parallel sections: append `-a`, `-b`, etc.
- Answer key PDF: append `-key` (e.g. `326-exam-1-sp26-key.pdf`)

---

## Generation Process

All files are generated via Node.js scripts written in the working directory.

**Dependencies** (install once per course repo):
```bash
npm install docx pptxgenjs
```

**Script structure (modular — one file per artifact):**

```
generate.js              # CLI orchestrator — run this
lib/
  palette.js             # shared color constants (docx + pptx)
  docx-helpers.js        # shared docx construction helpers
  pptx-helpers.js        # createSlideHelpers() factory
generators/
  lecture-notes.js       # → [topic]_lecture_notes.docx
  cornell-handout.js     # → [topic]_cornell_handout.docx
  study-questions.js     # → [topic]_study_questions.docx
  quiz.js                # → [topic]_quiz.docx
  slides.js              # → [topic]_slides.pptx
  readme.js              # → README.md
```

**Running:**
```bash
node generate.js              # all six artifacts
node generate.js --slides     # one artifact only
node generators/slides.js     # same, standalone
```

**Packages:**
- `.docx` → `docx` npm package (v9+)
- `.pptx` → `pptxgenjs` npm package (v4+)

**QA workflow for slides (run manually — Claude Code has no in-chat image display):**
```bash
soffice --headless --convert-to pdf [topic]_slides.pptx
pdftoppm -jpeg -r 150 [topic]_slides.pdf slide
# open slide-*.jpg in your image viewer, then report any layout issues back
```

Always perform Cornell ↔ slide alignment audit after generating both artifacts.
Do not declare the handout complete until every blank is audited. See the
**Blank Audit** section in `references/style-guide.md`.

---

## File Naming

Lowercase with underscores. Course code does **not** appear in filenames.

```
cryptography_lecture_notes.docx
cryptography_cornell_handout.docx
cryptography_study_questions.docx
cryptography_quiz.docx
cryptography_question_bank.md
cryptography_slides.pptx
README.md

# Exam (assembled from one or more banks):
326-exam-1-sp26.tex
```

---

## Style Reference

Full style specs are in `references/style-guide.md`. Read it before generating
any artifact. It covers:

- Lecture notes: fonts, colors, callout box types, speaker note format, section order
- Cornell handout: column layout, blank types, blank density, alignment audit rules
- Study questions: difficulty tiers, question design principles, format per question
- Pop quiz: question types, count, answer key format, timing
- Question bank: Markdown schema, question types (mc/tf/code/fib/sa), difficulty tagging, subtopic grouping
- Exam: assembly input spec, LyX formatting rules, section structure, randomization
- GitHub README: exact structure, boilerplate text (copy verbatim), Markdown rules
- Slide deck: color palette, typography, slide structure, card/panel patterns

---

## Quick-Reference Callout Types (Lecture Notes)

| Badge | Color | Use |
|---|---|---|
| `ASK` | blue `EBF3FB` | Audience engagement prompt |
| `THESIS` | gold `FFF8E7` | Core argument to state explicitly |
| `DEMO` | green `F0FAF0` | Live demo suggestion |
| `KEY` | gold `FFF8E7` | Takeaway statement |

---

## Study Question Tiers

| Label | Color | Count | Purpose |
|---|---|---|---|
| `[Recall]` | green `2E7D32` | 2 | Direct from lecture |
| `[Apply]` | blue `1565C0` | 3 | Use concepts in new scenarios |
| `[Analyze]` | purple `6A1B9A` | 5 | Synthesize, evaluate, argue |

Required design rules:
- If `adversarial-thinking: yes` — at least 1 question requires attacker-mindset / adversarial thinking
- At least 1 has no single correct answer (graded on reasoning quality)
- At least 1 references a specific case study from lecture
- Multi-part questions use lettered sub-items (a, b, c)

---

## Slide Deck Structure (14–18 slides)

1. Title (topic, subtitle, 3 stat callouts)
2. Agenda (6-card grid)
3. Opening hook / motivation
4. Core thesis
5–6. Framework or taxonomy
7–10. Case studies (4-column process/event chain + key lesson bar)
11. Real-world context / implications
12. Activity slide
13–14. Solutions / best practices
15. Discussion questions
16. Closing / key takeaways + reading list
