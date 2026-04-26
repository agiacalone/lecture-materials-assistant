---
name: lecture-materials-assistant
description: >
  Generates lecture material sets for CS professors: lecture notes (.pdf),
  Cornell note-taking handouts (.pdf), study questions (.md), pop quizzes (.pdf),
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

Generates styled, production-ready lecture materials for CS courses. Student-facing
lecture materials are intentionally partial: they replace distributing slides, but
should expose only about 40% of slide content so attendance is still required. All
artifacts follow a strict style guide. See `references/style-guide.md` for complete specs.
Printed student handouts and instructor lecture notes should use color
intentionally as a live navigation aid that reads clearly at a glance during lecture.

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
| Lecture notes | `[topic]_lecture_notes.pdf` (`.tex` retained) | Instructor copy with speaker notes, timing, and callouts; not student-facing |
| Cornell handout | `[topic]_cornell_handout.pdf` + `[topic]_cornell_handout_key.pdf` (`.tex` retained) | Student guided notes with roughly 40% slide coverage and strategic omissions; section colors keyed to section "kind". Key PDF reveals `blanks[].answers` and `vocabulary[].definition` in red bold inside the yellow cells, with a red "ANSWER KEY — INSTRUCTOR USE ONLY" banner at the top |
| Study questions | `[topic]_study_questions.md` | 10 tiered review questions that reinforce the lecture without recreating it (kept-form Markdown; no print form yet) |
| Pop quiz | `[topic]_quiz.pdf` + `[topic]_quiz_key.pdf` (`.tex` retained) | 5-question in-class quiz with separate instructor answer-key PDF |
| Question bank | `[topic]_question_bank.md` | ~50 tagged questions (mc/tf/code/fib/sa), scoped to full topic (2–4 sessions) |
| Exam | `[course_num]-exam-[n]-[term].pdf` | Assembled from bank(s), compiled via pdflatex; `.tex` source retained; generator toggles `\answerstrue` and recompiles for the key |
| GitHub README | `README.md` | GitHub Classroom assignment (reading or lab/programming variant) |
| Slide deck | `[topic]_slides.pptx` | 14–18 slides, CS Modern dark slate theme |

All printed-handout artifacts (lecture notes, Cornell handout, pop quiz, exam) render to PDF via `pdflatex`. The `.docx` format is no longer emitted by any generator.

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
folder. For Claude Code, use the existing reusable Node.js scripts in this repo.
Do not regenerate the JavaScript toolchain on each run. Instead:

1. Read `references/style-guide.md`
2. Gather or update the lecture spec JSON with the topic, course context, and content
3. Use `init-spec.js` to scaffold the spec when starting from a prompt and no spec exists yet
4. Run the checked-in generator CLI against that spec

**Dependencies** (install once per course repo, as needed):
```bash
npm install docx pptxgenjs
npm install markdown-it
```

A LaTeX toolchain with `pdflatex` is required for the lecture-notes, Cornell, quiz,
and exam PDFs. Required TeX packages: `texlive-needspace`, `texlive-ec`,
`texlive-tabulary`, `texlive-mdframed`, `texlive-collection-fontsrecommended`
(for `lmodern`):
```bash
pdflatex --version
```

**Existing script structure (modular — one file per artifact family):**

```
init-spec.js             # scaffold a lecture spec from prompt-like inputs
generate.js              # CLI orchestrator for the standard lecture set
examples/
  deadlock-spec.json     # sample lecture input
lib/
  tex-helpers.js         # shared LaTeX preamble + helpers + pdflatex driver
  cornell-tex.js         # Cornell-handout LaTeX palette + helpers
  pptx-helpers.js        # slide helpers
generators/
  lecture-notes.js       # → [topic]_lecture_notes.tex + .pdf
  cornell-handout.js     # → [topic]_cornell_handout.tex + .pdf
  study-questions.js     # → [topic]_study_questions.md
  quiz.js                # → [topic]_quiz.tex/.pdf + [topic]_quiz_key.tex/.pdf
  readme.js              # → README.md
  slides.js              # → [topic]_slides.pptx
  question-bank.js       # → [topic]_question_bank.md
  exam.js                # → [course_num]-exam-[n]-[term].tex + .pdf
```

**Execution model:**
- Standard single-session lecture set: lecture notes, Cornell handout, study questions, quiz, README, and slides
- Topic-wide bank generation: create or append to `[topic]_question_bank.md`
- Exam assembly: read the exam section of the config, generate `.tex`, and optionally compile it downstream

**Running (examples):**
```bash
node init-spec.js --prompt "Generate lecture materials for Virtual Memory and Paging in CECS 326. Cover: virtual address space, page table translation, TLB locality."
node init-spec.js --topic "Virtual Memory and Paging" --course-code "CECS 326"
node generate.js --config examples/lecture-spec.json
node generate.js --config examples/lecture-spec.json --artifact slides
node generate.js --config examples/lecture-spec.json --artifact bank
node generate.js --config examples/lecture-spec.json --artifact exam
```

## Prompt-To-Spec Translation

When the user asks for lecture materials from a topic and some content, translate the
request into the lecture spec JSON rather than writing generator code.

- Topic line maps to `lecture.topic`
- Course context maps to `course.*`
- Covered concepts map to `lecture.keyConcepts`
- Requested agenda or subtopics map to `lecture.sections`
- Examples or case studies map to `lecture.caseStudies`
- In-class exercises map to `lecture.activities`
- Review prompts or homework questions map to `lecture.discussionQuestions`

If a user request is incomplete, scaffold the spec with the best available defaults,
then fill gaps conservatively instead of regenerating new `.js` files.

**Toolchain:**
- `.tex` / `.pdf` (lecture notes, Cornell handout, quiz, exam) → LaTeX (`pdflatex`)
- `.pptx` (slide deck) → `pptxgenjs` npm package (v4+)
- `.md` (question bank, README, study questions) → plain Markdown

When updating existing materials, update the lecture spec first and preserve scope,
numbering, and file naming unless the user asks for a restructure. For question
banks, never overwrite an existing bank blindly: read it first, then append or
merge intentionally.

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
- student-facing coverage limits and omission requirements
- printed color usage for handouts and instructor notes
- study-question tier counts and required question variety
- quiz timing, answer-key format, and question constraints
- question-bank schema, numbering, dedupe, and tagging
- exam structure, LaTeX rules, randomization, and file naming
- GitHub README boilerplate and Markdown rules
- slide palette, required slide chrome, and standard deck structure
