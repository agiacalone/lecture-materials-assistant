# Generator Overhaul Design
**Date:** 2026-04-12
**Status:** Approved

## Problem

The current generators produce output that doesn't match the target document structure
demonstrated in `examples/deadlock_lecture.docx` and `examples/deadlock_handout_fillin.docx`.
Specific issues:

- Lecture notes lack Roman numeral sections, `[HOOK]` callouts, and `[TALKING POINTS]` blocks.
- The Cornell handout uses its own section taxonomy (Opening Hook, Framework, Taxonomy/Concepts)
  instead of mirroring the lecture's sections directly.
- Most generators output `.docx` via the `docx` npm package — verbose, hard to debug, far
  more JS than necessary.
- The `defaultSection()` scaffold in `spec.js` produces template-generic content that looks
  plausible but isn't substantive.

## Approach: Hybrid — Generator Structure + Optional Spec Fields

Update generators to always produce the deadlock-style structure. Add two optional spec fields
that enhance output when present; fall back gracefully when absent. Existing specs produce
better output immediately. Richer specs produce output that closely matches the deadlock examples.

## Output Format Changes

| Generator           | Old format | New format     |
|---------------------|------------|----------------|
| `lecture-notes.js`  | `.docx`    | `.tex` + `.pdf` |
| `study-questions.js`| `.docx`    | `.tex` + `.pdf` |
| `quiz.js`           | `.docx`    | `.tex` + `.pdf` |
| `cornell-handout.js`| `.docx`    | `.docx` (keep) |
| `slides.js`         | `.pptx`    | `.pptx` (keep — syncs with Google Slides) |
| `question-bank.js`  | `.md`      | `.md` (unchanged) |
| `readme.js`         | `.md`      | `.md` (unchanged) |

The exam generator (LaTeX) is out of scope — it already works correctly.

## Spec Changes (Minimal)

Two new optional fields added to each section object:

```json
{
  "title": "Section Title",
  "talkingPoints": [
    "Instructor-facing bullet rendered in a [TALKING POINTS] block.",
    "Preferred over speakerNotes when both are present; both accepted."
  ],
  "table": {
    "headers": ["Column A", "Column B", "Column C"],
    "rows": [
      ["Row 1A", "Row 1B", "Row 1C"],
      ["Row 2A", "Row 2B", "Row 2C"]
    ]
  }
}
```

- `talkingPoints` — instructor-facing bullet points. Generators prefer this over the existing
  `speakerNotes`; both are accepted for backward compatibility.
- `table` — a comparison table (e.g., Coffman Conditions, strategy comparison). In lecture
  notes: full comparison table. In Cornell handout: multi-column fill-in table with highlighted
  cells. Optional — 2-column Cornell format is the default when absent.

`spec.js` `defaultSection()` template strings replaced with explicit placeholder comments so
scaffolded specs are clearly incomplete rather than plausibly complete.

## New Library: `lib/tex-helpers.js`

Shared by all three LaTeX generators. Exports functions that return LaTeX strings — no object
trees, no nested constructors.

### Preamble

`texPreamble(title, course, options)` — emits `\documentclass[12pt]{article}`, package imports,
color definitions, and custom environments.

### Color Philosophy

Two distinct palettes serve two distinct jobs.

**Instructor lecture notes — fast-glance optimized:**

The instructor is standing at the front of the room under pressure. The document must be
locatable by color pattern, not by reading. Each content type gets a strongly saturated,
semantically distinct color. Colors are more saturated than they appear on screen to compensate
for print washout (printed colors run ~20–30% less vivid).

| Element | Background | Text | Semantic signal |
|---|---|---|---|
| Section banner | Navy `#1F3864` | White | Structural skeleton — anchors position on page |
| Hook block | Teal `#0D9488` | White | "Start here" — distinct warm-cool contrast |
| `[TALKING POINTS]` | Amber `#D97706` | White | What to say — warm, high-saturation, eye-catching |
| KEY callout badge | Navy `#1F3864` | White | Definitional anchor |
| KEY callout body | `#DBEAFE` | Navy | — |
| ASK callout badge | Indigo `#4F46E5` | White | Discussion prompt |
| ASK callout body | `#EEF2FF` | Indigo | — |
| DEMO callout badge | Green `#15803D` | White | "Go" — live demo or activity |
| DEMO callout body | `#DCFCE7` | Green | — |
| THESIS callout badge | Orange `#C2410C` | White | Central argument — alert tone |
| THESIS callout body | `#FFEDD5` | Dark orange | — |
| Regular content | White | Black | Colored blocks stand out against white |

Traffic signal logic: **Amber = instructor voice** (talking points), **Teal/Green = action**
(hook, demo), **Navy/Indigo = structural or definitional**, **Orange = high-importance anchor**.

**Student Cornell handout — accessible, not fast-glance:**

The student is seated, reading at their own pace, filling in blanks. Accessibility (WCAG AA
contrast, colorblind-safe choices, no red/green combinations) matters more than instant
visual differentiation. Colors are subdued and functional.

| Element | Background | Text | Purpose |
|---|---|---|---|
| Section banner | Medium blue `#2563EB` | White | Clear section structure |
| Cue column | Light blue-gray `#F1F5F9` | Navy `#1F3864` | Subtle, readable label area |
| Fill-in cell | Yellow `#FEF9C3` | Black | Universal "fill this in" convention |
| Scaffolded text cell | White | Dark gray `#374151` | Not a blank — pre-filled context |
| Summary strip | Light blue `#EFF6FF` | Navy | Calm, distinct from body |
| Table header row | Medium blue `#2563EB` | White | Matches section banner |

**Colors defined in `tex-helpers.js` preamble** (instructor palette):
- `instrNavy` → `#1F3864`
- `instrTeal` → `#0D9488`
- `instrAmber` → `#D97706`
- `instrIndigo` → `#4F46E5`
- `instrGreen` → `#15803D`
- `instrOrange` → `#C2410C`
- Supporting tints as above

**Colors defined in `docx-helpers.js`** (student handout palette):
- `handoutBlue` → `#2563EB`
- `handoutCueBg` → `#F1F5F9`
- `handoutFillIn` → `#FEF9C3`
- `handoutSummary` → `#EFF6FF`

**Custom environments** (instructor LaTeX preamble only):
- `talkingpoints` — amber background box, bold `[TALKING POINTS]` header, bullet list
- `hookblock` — teal background box for the opening hook callout
- `calloutenv` — two-column minipage: badge label left, content right

### Helper Functions

```
texSectionBanner(title, level)      → \section or \subsection with colored rule
texTalkingPoints(items)             → talkingpoints environment with \item list
texHook(text)                       → hookblock environment
texCallout(label, text)             → calloutenv two-column minipage
texComparisonTable(headers, rows)   → booktabs \tabular
texBulletList(items)                → \begin{itemize} … \end{itemize}
texCodeBlock(lines, lang)           → listings lstlisting
compileLatex(texPath, outputDir)    → spawns pdflatex twice, returns pdf path
```

`compileLatex` runs `pdflatex` twice (standard practice for resolving internal references).
The `.tex` source is retained alongside the `.pdf`.

## Component Designs

### `generators/lecture-notes.js` — LaTeX article

Mirrors the structure of `examples/deadlock_lecture.docx`:

```
Title (topic)
"Lecture Notes — with Talking Points"
Course code | Course name

[ HOOK — open with this story ]
openingHook text

\section*{Learning Objectives}
  bullet list

\section{I. Title}          ← Roman numeral from LaTeX \Roman counter
  overview paragraph
  bullet points
  [TALKING POINTS] block    ← section.talkingPoints or section.speakerNotes
  callouts                  ← section.callouts
  comparison table          ← section.table (optional)
  discussion prompts        ← inline within section.talkingPoints

... repeat for each section ...

\section*{Case Studies}
\section*{Summary}
\section*{References}
```

Roman numerals from LaTeX's built-in counter — no manual numbering in JS.
`.tex` written to output dir; `pdflatex` run twice; `.pdf` returned as primary artifact.

---

### `generators/cornell-handout.js` — `.docx` restructure

Mirrors the structure of `examples/deadlock_handout_fillin.docx`.

```
Title (topic, large navy)
"Fill in the highlighted cells and blank lines during lecture.
 Complete the Summary strip afterward."

For each section (I, II, III...):

  If section.table present:
    → Multi-column fill-in table
      Headers row: navy fill, white text
      Data rows: highlighted cells (blue tint) = fill-in
      Non-fill cells: scaffolded text

  Default (no section.table):
    → 2-column Cornell cue/notes table
      Rows from section.blanks (cue + template)
      Additional rows from key points with _______ slots
      Cue column: blue tint, bold label
      Notes column: light tint, text + blanks

References (small bullet list)

Summary strip (full-width shaded box)
  "Summary — write this after class in your own words"
  3 blank lines
```

Key change: the generator no longer maintains its own section taxonomy. It follows the lecture's
sections directly — same titles, same Roman numerals, same order. The Cornell 2-column format is
the default; `section.table` triggers multi-column fill-in.

---

### `generators/study-questions.js` — LaTeX article

```
Course code | Course name
Topic — Study Questions
Brief instruction text

\section*{Recall}    (2 questions)
  Q1. ...  \vspace{2em}
  Q2. ...  \vspace{2em}

\section*{Apply}     (3 questions)
  Q3–Q5   \vspace{3em}

\section*{Analyze}   (5 questions)
  Q6–Q10  \vspace{4em}
```

`\vspace` sized by Bloom's level — Recall gets less space, Analyze gets more.
`lecture.studyQuestions` used directly if present; otherwise derived from `keyConcepts`,
`sections`, and `caseStudies` as before.
Adversarial-thinking Q9 substitution carries over unchanged.

---

### `generators/quiz.js` — LaTeX article

```
Course code | Course name
Topic — Pop Quiz
Date: ___________   Name: ___________

~5 questions (MC + short answer, ~10 min)
  MC: lettered options (a)(b)(c)(d)
  Short answer: \vspace below for response

\newpage
RED HEADER: ANSWER KEY — INSTRUCTOR COPY
Each answer with grading rubric note
```

`\newpage` separates the answer key so it prints on a separate sheet.
The exam generator uses `\answerstrue` to compile two versions from one source; the quiz
is simpler — the key is a fixed second page, not a conditional recompile.

---

### `generators/slides.js` — minor

Keep `.pptx` output (syncs with Google Slides). Verify that `section.talkingPoints` and
`section.table` fields are not accidentally rendered into student-facing slide content.
No structural changes.

---

### `generators/question-bank.js` — unchanged

Already outputs `.md` with correct tag/difficulty structure. No changes.

---

### `generators/readme.js` — unchanged

No changes.

## Cornell Note-taking System — Context

The handout structure is a pre-distributed variant of the Cornell Note-taking System (Walter
Pauk, Cornell University, 1950s). The classic layout: narrow cue column left, wide notes column
right, summary strip at the bottom.

In the pre-distributed variant used here, cue labels are pre-filled and the notes column
contains strategic blanks — students fill from projected slides during lecture rather than
transcribing everything. This is pedagogically stronger than blank sheets for technical content
where students can fall behind.

## Out of Scope

- Exam generator (already LaTeX, works correctly)
- `readme.js` (no changes needed)
- `question-bank.js` (no changes needed)
- Converting the Cornell handout to LaTeX (possible future work, not now)
