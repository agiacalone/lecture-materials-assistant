# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**lecture-designer** is a Claude Code skill that generates production-ready lecture materials for CS courses. It has no build system or runtime — its "code" is the skill definition and style guide that Claude reads to generate Node.js scripts on demand.

## Skill Invocation

Users invoke the skill from a course project directory that has a `CLAUDE.md` referencing this skill:

```markdown
- Use the lecture materials assistant skill at ~/.claude/skills/lecture-materials-assistant/SKILL.md
```

When deployed as a skill, the entry point is `SKILL.md`. When invoked, Claude must read `references/style-guide.md` before generating any artifact — this is mandatory, not optional.

## Architecture

```
lecture-designer/
├── SKILL.md                       # Skill metadata, workflow, artifact specs, file naming
├── CLAUDE.md.example              # Template users copy to their course project directory
├── references/
│   ├── style-guide.md             # Complete style specs — MUST read before generating
│   └── reference_exam.tex         # Structural reference for LaTeX exam generation
└── assets/                        # Placeholder for course-specific assets
```

**Generation flow:**
1. User specifies topic + 5 course context fields (course code, student level, lecture length, assessment format, adversarial-thinking)
2. Claude reads `SKILL.md` + `style-guide.md`
3. Claude writes a Node.js script (`[topic]_generate.js`) in the user's working directory
4. User runs `node [topic]_generate.js` → produces `.docx`/`.pptx`/`.md` artifacts

For exam generation, Claude reads `references/reference_exam.tex` as a structural
reference and assembles a `.tex` file directly (no Node.js script needed).
Compile with `pdflatex [filename].tex`.

## Output Artifacts

| File | Format | Key constraints |
|------|--------|-----------------|
| `[topic]_notes.docx` | Lecture notes | Arial, navy/blue headers, 8 callout types |
| `[topic]_cornell.docx` | Student handout | 2-col layout, ~40% blank density, blank audit required |
| `[topic]_questions.docx` | Study questions | 10 questions: 2 Recall, 3 Apply, 5 Analyze |
| `[topic]_quiz.docx` | Pop quiz | 5 questions (~10 min), MC+short answer, answer key on last page |
| `[topic]_question_bank.md` | Question bank | ~50 tagged questions (mc/tf/code/fib/sa · ★/★★/★★★ · subtopic); source of truth for exam assembly |
| `[course]-exam-[n]-[term].tex` | Exam | Assembled from bank(s); mc+tf+code mixed in MC section, sa in essay section; answer key via `\ifanswers` toggle |
| `[topic]_readme.md` | GitHub Classroom README | Rigid boilerplate — copy structure exactly |
| `[topic]_slides.pptx` | Slide deck | 14–18 slides, CS Modern dark slate theme, mandatory indigo stripe + badge |

## Required npm/pip Dependencies (user installs once)

```bash
npm install -g docx pptxgenjs react react-dom react-icons sharp
pip install "markitdown[docx,pptx]" --break-system-packages
```

Scripts use `docx` v9+ and `pptxgenjs` v4+. Icons are rasterized from `react-icons` via `sharp` at ≥256px.

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

- **Cornell handout**: Pre-distributed via Canvas before class. Students fill blanks from projected slides during lecture — blanks must map to a specific slide (cite in audit). Verbal explanation is never a blank source; it is scaffolded text in the handout and assessed through short answer questions. Key diagrams/frameworks from slides must appear in the handout as partial structures. Note-sharing is an accepted outcome — the short answer assessments are the comprehension gate, not the blanks.
- **Slides**: Theme colors are slate `#0F172A`, indigo `#6366F1`, amber `#F59E0B`. Every content slide needs an indigo stripe and section badge.
- **Study questions**: Open-ended and case-study reference questions are always required. Attacker-mindset question required only when `adversarial-thinking: yes` (Security courses). Defaults to `no`.
- **Pop quiz**: All questions must come from slide/lecture content — no curveballs. MC distractors must be plausible. Answer key is a separate page with red header; include grading rubric notes per question. Do not reuse study question wording verbatim.
- **Question bank**: Persistent, append-only Markdown file — never overwrite, only add. Types: `mc` (4-option), `tf` (T/F), `code` (code-interpretation T/F), `fib` (quiz/handout only, never exams), `sa` (short answer). Type + difficulty (★/★★/★★★) are the two scoring dimensions used by exam assembly. Read the file before adding to avoid duplicates and assign the next sequence number per type.
- **Exam**: Plain LaTeX `.tex` assembled from bank `.md` files. MC section mixes `mc`+`tf`+`code` — no separate T/F section. `fib` never in exams. Answer key via `\answerstrue` at top of file — same source, recompile for key. Parallel sections: `randomize: yes` + section suffix (e.g. `-A.tex`, `-B.tex`). File naming: `[course_num]-exam-[n]-[term].tex`. Compile: `pdflatex`.
- **GitHub README**: Two variants — reading assignment (answer questions from a chapter) and lab/programming assignment (build something, verifiable requirements). Choose based on `assessment format` in course context. Deliverables and "Please note" boilerplate must be copied exactly in both variants.
