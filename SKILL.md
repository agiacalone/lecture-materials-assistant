---
name: lecture-materials-assistant
description: >
  Generates complete lecture material sets for CS professors: lecture notes (.docx),
  Cornell note-taking handouts (.docx), study questions (.docx), pop quizzes (.docx),
  GitHub Classroom README assignments (.md), topic-wide question banks (.md),
  assembled exams (.tex/.pdf), and slide decks (.pptx). Use this skill whenever a
  user asks to generate, create, assemble, revise, or extend any lecture materials,
  course handouts, slides, quizzes, study questions, question banks, exams, or
  GitHub Classroom assignments — even partial requests like "make me a Cornell
  handout for X", "add questions to the README", "write a pop quiz on Y", "append
  to the question bank", or "assemble exam 1 from these banks". Enforces strict
  style consistency, Cornell ↔ slide alignment auditing, and tiered difficulty
  question design. Always use this skill for any CS lecture content generation task.
---

# Lecture Materials Assistant

Generates styled, production-ready lecture materials for CS courses. All artifacts
follow a strict style guide. See `references/style-guide.md` for complete specs.

**Read `references/style-guide.md` before generating any artifact.**

---

Output files are written to the current working directory unless the user specifies
another target.

---

## Capturing Course Context

Before generating, confirm these five fields when they matter for the requested
artifact. Once provided in a session, remember them — never re-ask unless the user
changes them.

| Field | Example |
|---|---|
| **Course code + name** | CECS 326 — Operating Systems |
| **Student level** | Upper-division CS majors; strong C/systems programming background |
| **Lecture length** | ~75 minutes |
| **Assessment format** | GitHub Classroom (Markdown), in-class activities |
| **Adversarial thinking** | yes (Security) / no (OS, Distributed Systems) |

If a required field is missing for the requested artifact, ask for it before
proceeding. `adversarial-thinking` defaults to **no** if not specified, so do not
block on that field alone.

---

## What to Generate

| Artifact | File | When |
|---|---|---|
| Lecture notes | `[topic]_lecture_notes.docx` | Full instructor copy with speaker notes, timing, callouts |
| Cornell handout | `[topic]_cornell_handout.docx` | 2-page student sheet with strategic blanks |
| Study questions | `[topic]_study_questions.docx` | 10 tiered questions for out-of-class review |
| Pop quiz | `[topic]_quiz.docx` | 5-question in-class quiz with instructor answer key |
| Question bank | `[topic]_question_bank.md` | ~50 tagged questions (mc/tf/code/fib/sa), scoped to full topic (2–4 sessions) |
| Exam | `[course_num]-exam-[n]-[term].pdf` | Assembled from bank(s), compiled via pdflatex; `.tex` source retained; generator toggles `\answerstrue` and recompiles for the key |
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

Generate files in the current working directory unless the user specifies a target
folder. For Claude Code, implement artifact generation through reusable Node.js
scripts written in the working directory. This applies to the standard lecture set,
topic-wide question banks, and exam assembly. The scripts are the generation system;
the generated lecture materials are outputs of those scripts.

**Dependencies** (install once per course repo, as needed):
```bash
npm install docx pptxgenjs
npm install markdown-it
```

For exams, ensure a LaTeX toolchain is available:
```bash
pdflatex --version
```

**Suggested script structure (modular — one file per artifact family):**

```
generate.js              # CLI orchestrator for the standard lecture set
lib/
  palette.js             # shared color constants (docx + pptx)
  docx-helpers.js        # shared docx construction helpers
  pptx-helpers.js        # createSlideHelpers() factory
  bank-helpers.js        # question-bank parsing / dedupe / numbering
  exam-helpers.js        # exam assembly / weighting / shuffle helpers
generators/
  lecture-notes.js       # → [topic]_lecture_notes.docx
  cornell-handout.js     # → [topic]_cornell_handout.docx
  study-questions.js     # → [topic]_study_questions.docx
  quiz.js                # → [topic]_quiz.docx
  readme.js              # → README.md
  slides.js              # → [topic]_slides.pptx
  question-bank.js       # → [topic]_question_bank.md
  exam.js                # → [course_num]-exam-[n]-[term].tex + .pdf
```

**Execution model:**
- Standard single-session lecture set: lecture notes, Cornell handout, study questions, quiz, README, and slides
- Topic-wide bank generation: create or append to `[topic]_question_bank.md`
- Exam assembly: read 2–3 bank files, generate `.tex`, compile the student PDF, then toggle `\answerstrue` and recompile the key PDF

**Running (examples):**
```bash
node generate.js                      # standard six-artifact lecture set
node generate.js --slides             # one artifact only
node generators/question-bank.js      # topic-wide bank
node generators/exam.js               # assembled exam
```

**Packages:**
- `.docx` → `docx` npm package (v9+)
- `.pptx` → `pptxgenjs` npm package (v4+)
- `.md` question bank / README → plain text or Markdown helpers as needed
- `.tex` / `.pdf` exam → LaTeX toolchain (`pdflatex`)

When updating existing materials, read the current artifact first and preserve its
scope, numbering, and file naming unless the user asks for a restructure. For
question banks, never overwrite an existing bank: append only after checking for
duplicates and assigning the next sequence number per type.

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

Use `references/style-guide.md` for all artifact-specific formatting and content
rules. In particular, check it for:

- lecture-note callout types and section order
- Cornell blank density, blank audit, and diagram rules
- study-question tier counts and required question variety
- quiz timing, answer-key format, and question constraints
- question-bank schema, numbering, dedupe, and tagging
- exam structure, LaTeX rules, randomization, and file naming
- GitHub README boilerplate and Markdown rules
- slide palette, required slide chrome, and standard deck structure
