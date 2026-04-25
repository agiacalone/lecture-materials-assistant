# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**lecture-materials-assistant** is a document-generation system for production-ready
CS lecture materials. The checked-in Node.js code is the stable generator. The skill
is the interface layer that turns a user request into a structured lecture spec and
then runs that generator. It should not regenerate JavaScript files on each run.
Student-facing lecture materials are intentionally partial replacements for
distributing slides: target roughly 40% of slide content and omit key explanatory
elements so students must attend lecture.
Printed student handouts and instructor lecture notes should use color
intentionally so the materials are easy to navigate at a glance during lecture.

## Living Notes — What is Kept vs What is Disposable

This skill builds a **living-notes** system around the generated materials. Every
artifact is produced fresh each semester from the spec + the latest priors, but
the formats split into two tiers:

- **Kept (canonical, lives in the vault):** open, diffable, queryable text formats
  — Markdown for prose (`notes-md`, `cornell-md`, `quiz-md`, `study-questions`,
  `readme`), Markdown or CSV for tabular data (`question-bank`), JSON for structured
  intake (`spec.json`). These accumulate across semesters. Anthony edits them in
  the vault, adds notes in the margins, cross-links them into work-journals. When
  planning the next semester's version, he reads the kept form first — it IS the
  prior.
- **Disposable (regenerated fresh each semester):** the print/display artifacts
  that students actually receive — `.pdf` (instructor notes, quiz + key, exam),
  `.docx` (Cornell handout, study questions in printable form), `.pptx` (slide
  deck). Hand these out, throw away the old ones, regenerate when the content
  updates.

**Practical cycle:**
1. Read the kept `.md` artifacts from last semester to recall what changed and
   what to update.
2. Update `spec.json` with new stats, new case studies, corrections.
3. Run `generate.js --all` — overwrites both kept and disposable outputs from
   the refreshed spec.
4. Diff the regenerated `.md` against last semester's (the vault is the prior)
   to validate updates propagated. Copy to `<vault>/classes/<course>/` if
   not already there.
5. Print / distribute the disposables.

**Preferred formats by artifact type:**

| Data shape | Preferred kept format |
|---|---|
| Narrative prose (lecture notes, handouts, quizzes) | Markdown |
| Tabular data (question banks, grade rubrics) | Markdown table or CSV (prefer CSV when column count is large or sort/filter matters) |
| Structured intake / config | JSON |
| Assembled assessments | regenerated `.pdf` — the kept form is the bank + exam spec |

Never add a "kept" format in a proprietary or tool-specific binary — the
principle is open, easy-to-track, tool-agnostic text. The disposables are the
print/projector deliverables: `.pdf` (lecture notes, Cornell handout, quiz, exam)
for hand-out and `.pptx` for the projector.

## Skill Invocation

Users invoke the skill from a course project directory that has a `CLAUDE.md` referencing this skill:

```markdown
- Use the lecture materials assistant skill at ~/.claude/skills/lecture-materials-assistant/SKILL.md
```

When deployed as a skill, the entry point is `SKILL.md`. When invoked, Claude must
read `references/style-guide.md`, translate the user's request into a lecture spec
JSON, and use the existing CLI in this repo to compile outputs from that spec.

## Architecture

```
lecture-materials-assistant/
├── SKILL.md                       # Skill metadata, workflow, artifact specs, file naming
├── CLAUDE.md.example              # Template users copy to their course project directory
├── generate.js                    # Stable CLI entrypoint
├── examples/
│   └── lecture-spec.json          # Sample structured lecture input
├── generators/                    # Reusable artifact generators
├── lib/                           # Shared helpers for docx/pptx/text generation
├── references/
│   ├── style-guide.md             # Complete style specs — MUST read before generating
│   └── reference_exam.tex         # Structural reference for LaTeX exam generation
└── assets/                        # Placeholder for course-specific assets
```

**Generation flow:**
1. The user provides a structured or semi-structured lecture request.
2. Claude reads `SKILL.md` + `references/style-guide.md`.
3. Claude creates or updates a lecture spec JSON in the user's working directory.
4. Claude runs the stable generator against that spec.

**CLI entrypoints:**
- `node init-spec.js --prompt "..."` to scaffold a spec from a freeform request
- `node init-spec.js --topic "..." ...` to scaffold a spec from explicit flags
- `node generate.js --config /path/to/lecture-spec.json`
- `node generate.js --config /path/to/lecture-spec.json --artifact slides`
- `node generate.js --config /path/to/lecture-spec.json --artifact bank`
- `node generate.js --config /path/to/lecture-spec.json --artifact exam`

For exam generation, Claude still reads `references/reference_exam.tex` as a
structural reference, but exam output is produced through the checked-in
`generators/exam.js`.

## Output Artifacts

| File | Format | Key constraints |
|------|--------|-----------------|
| `[topic]_lecture_notes.pdf` | Lecture notes | LaTeX, Computer Modern, navy/teal/amber/indigo callouts; `.tex` source retained |
| `[topic]_cornell_handout.pdf` | Student handout | 2-col Cornell layout, ~40% slide-content coverage, section-kind colors (motivation=teal / concept=navy / synthesis=amber / strategy=indigo / application=green / case-study=purple / pitfall=rose) anchor each section's banner, cue-tint, and KEY callout; `.tex` retained |
| `[topic]_study_questions.md` | Study questions | 10 questions: 2 Recall, 3 Apply, 5 Analyze; Markdown only — no print form generated |
| `[topic]_quiz.pdf` + `[topic]_quiz_key.pdf` | Pop quiz | 5 questions (~10 min), MC+short answer, separate key PDF; `.tex` retained |
| `[topic]_question_bank.md` | Question bank | ~50 tagged questions (mc/tf/code/fib/sa · ★/★★/★★★ · subtopic); source of truth for exam assembly |
| `[course_num]-exam-[n]-[term].pdf` | Exam | Assembled from bank(s), compiled to PDF via pdflatex; `.tex` source retained alongside; generator toggles `\answerstrue` and recompiles for the key |
| `README.md` | GitHub Classroom README | Rigid boilerplate — copy structure exactly |
| `[topic]_slides.pptx` | Slide deck | 14–18 slides, CS Modern dark slate theme, mandatory indigo stripe + badge |

The `.docx` format is no longer emitted by any generator — all printed handouts render to PDF via `pdflatex`.

## Required npm/pip Dependencies (user installs once)

```bash
npm install
```

## Preferred Skill Behavior

When the user gives a lecture request in natural language, Claude should:
1. Extract the topic, course context, key concepts, sections, case studies, and questions.
2. Create or update a lecture spec JSON, using `init-spec.js` for a first scaffold when useful.
3. Refine that JSON to satisfy `references/style-guide.md`.
4. Run `generate.js` against the final spec.

The intended mental model is:
- Input: a lecture request
- Intermediate representation: a lecture spec JSON
- Output: compiled lecture documents

The skill is not the generator itself. The checked-in `.js` toolchain is the
generator; the skill is how Claude maps requests into that toolchain consistently.

## Current Note

The end-to-end workflow has been exercised successfully with the `Virtual Memory and
Paging` example:
- freeform prompt -> spec JSON
- spec JSON -> compiled `.docx`, `.md`, and `.pptx` outputs

Current limitation: the prompt parser still needs refinement. It produces usable
specs, but some extracted fields and generated phrasing still need cleanup before
the outputs should be considered production-ready without review.

Scripts use `docx` v9+ and `pptxgenjs` v4+. Exams also require a LaTeX toolchain
with `pdflatex` available on `PATH`.

## QA for Slides

```bash
soffice --headless --convert-to pdf [topic]_slides.pptx
pdftoppm -jpeg -r 150 [topic]_slides.pdf slide
# inspect slide-*.jpg
```

## Code and Diagrams (all artifacts)

- **Inline code**: Menlo, gray background `F5F5F5`. **Code blocks**: same in .docx; dark panel `1E293B` with limited syntax highlighting in slides; fenced blocks in .md; `\begin{lstlisting}` in .tex.
- **Pseudocode**: use when language-independent; label as `pseudocode`; prefer over real code in handouts and study questions unless the course requires reading real source.
- **Code blanks in handout**: replace target token/line with `_______`, keep surrounding structure intact, one blank per logical unit.
- **Diagrams in .docx**: approximate with structured tables and bordered boxes — the `docx` package cannot render vector graphics. Every diagram gets a bold **Figure:** caption.
- **Partial diagrams in handout**: full structure drawn, all labels blank — students fill in from projected slide.
- **Diagrams in slides**: boxes as rounded rectangles (`334155` fill, indigo `6366F1` border), arrows in sky `38BDF8`.

## Critical Style Rules (enforced by style-guide.md)

- **Cornell handout**: Pre-distributed via Canvas before class. Students fill blanks from projected slides during lecture — blanks must map to a specific slide (cite in audit). Verbal explanation is never a blank source; it is scaffolded text in the handout and assessed through short answer questions. Keep student-facing coverage to roughly 40% of the slide content and omit key labels, examples, and conclusions so the handout does not recreate the deck. Key diagrams/frameworks from slides must appear in the handout as partial structures.
- **Printed `.docx` materials**: Use color as a functional lecture cue. Handouts and instructor notes should preserve colored headers, cue regions, dividers, and callout fills so the printed pages are easy to scan instantly in the middle of a live lecture.
- **Slides**: Theme colors are slate `#0F172A`, indigo `#6366F1`, amber `#F59E0B`. Every content slide needs an indigo stripe and section badge.
- **Study questions**: Open-ended and case-study reference questions are always required. Attacker-mindset question required only when `adversarial-thinking: yes` (Security courses). Defaults to `no`.
- **Pop quiz**: All questions must come from slide/lecture content — no curveballs. MC distractors must be plausible. Answer key is a separate page with red header; include grading rubric notes per question. Do not reuse study question wording verbatim.
- **Question bank**: Persistent, append-only Markdown file — never overwrite, only add. Types: `mc` (4-option), `tf` (T/F), `code` (code-interpretation T/F), `fib` (quiz/handout only, never exams), `sa` (short answer). Type + difficulty (★/★★/★★★) are the two scoring dimensions used by exam assembly. Read the file before adding to avoid duplicates and assign the next sequence number per type.
- **Exam**: Generate `.tex` from bank `.md` files, then run `pdflatex` automatically — PDF is the final deliverable, `.tex` is retained as editable source. MC section mixes `mc`+`tf`+`code` — no separate T/F section. `fib` never in exams. The generator produces both student and key PDFs by toggling `\answerstrue` and recompiling. Parallel sections: `randomize: yes` + section suffix (e.g. `-A`, `-B`). File naming: `[course_num]-exam-[n]-[term]`.
- **GitHub README**: Two variants — reading assignment (answer questions from a chapter) and lab/programming assignment (build something, verifiable requirements). Choose based on `assessment format` in course context. Deliverables and "Please note" boilerplate must be copied exactly in both variants.
