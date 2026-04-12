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
├── SKILL.md                  # Skill metadata, workflow, artifact specs, file naming
├── CLAUDE.md.example         # Template users copy to their course project directory
├── references/
│   └── style-guide.md        # Complete style specs — MUST read before generating
└── assets/                   # Placeholder for course-specific assets
```

**Generation flow:**
1. User specifies topic + 4 course context fields (course code, student level, lecture length, assessment format)
2. Claude reads `SKILL.md` + `style-guide.md`
3. Claude writes a Node.js script (`[topic]_generate.js`) in the user's working directory
4. User runs `node [topic]_generate.js` → produces 5 output files

## Output Artifacts

| File | Format | Key constraints |
|------|--------|-----------------|
| `[topic]_notes.docx` | Lecture notes | Arial, navy/blue headers, 8 callout types |
| `[topic]_cornell.docx` | Student handout | 2-col layout, ~40% blank density, blank audit required |
| `[topic]_questions.docx` | Study questions | 10 questions: 2 Recall, 3 Apply, 5 Analyze |
| `[topic]_quiz.docx` | Pop quiz | 5 questions (~10 min), MC+short answer, answer key on last page |
| `[topic]_question_bank.docx` | Question bank | ~50 questions: 20 MC, 12 T/F, 10 fill-in-the-blank, 8 short answer; scoped to full topic (2–4 sessions); subtopic grouping within each section |
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

## Critical Style Rules (enforced by style-guide.md)

- **Cornell handout**: Students do not receive slides — the handout is their only reference during and after class. Key frameworks, diagrams, and process chains from slides must be represented in the handout (as partial diagrams or structured scaffolding). Every blank answer must reach students via verbal delivery or handout context — there is no "check the slide" fallback. Run a blank audit before finalizing.
- **Slides**: Theme colors are slate `#0F172A`, indigo `#6366F1`, amber `#F59E0B`. Every content slide needs an indigo stripe and section badge.
- **Study questions**: Attacker mindset, open-ended, and case-study reference are mandatory across the 10 questions.
- **Pop quiz**: All questions must come from slide/lecture content — no curveballs. MC distractors must be plausible. Answer key is a separate page with red header; include grading rubric notes per question. Do not reuse study question wording verbatim.
- **Question bank**: Topic-wide scope (2–4 sessions) — requires full subtopic list before generating; ask if not provided. Questions numbered by type prefix (MC-1, TF-1, etc.) and grouped by subtopic within each section. Every question carries a `[★]`/`[★★]`/`[★★★]` difficulty tag (~40% Recall, ~35% Apply, ~25% Analyze). Every subtopic must appear in at least two question types. Do not reuse questions verbatim from study questions or pop quiz.
- **GitHub README**: The Deliverables and "Please note" boilerplate must be copied exactly — do not paraphrase.
