# Style Guide — Lecture Materials Assistant

Full style specifications for all five artifact types.

---

## Lecture Notes (.docx)

- **Font:** Arial throughout
- **Colors:** Navy headers `1F3864`, blue accent `2E5FA3`, body text black
- **Page size:** US Letter, 1" margins
- **Header:** "LECTURE NOTES — [Topic]" with blue bottom border
- **Footer:** "Instructor Copy — Not for Distribution" + page X of Y

### Callout Boxes

2-column table: colored left badge (label) + tinted right cell (content).

| Badge | Background | Use |
|---|---|---|
| `ASK` | blue `EBF3FB` | Audience engagement prompts |
| `THESIS` | gold `FFF8E7` | Core arguments to state explicitly |
| `DEMO` | green `F0FAF0` | Live demonstration suggestions |
| `KEY` | gold `FFF8E7` | Takeaway statements |

### Speaker Notes

Indented, italic, prefixed with 📢, muted gray `555555`.

### Timing

Each major section labeled with approximate minutes.

### Section Order

1. Opening Hook
2. Framework
3. Taxonomy / Concepts
4. Case Studies
5. Activities
6. Defense / Takeaways
7. Discussion Questions
8. References

### Tables

Dark navy header `1F3864` white text; alternating white / `F0F4FA` rows.

---

## Cornell Handout (.docx)

**Design premise:** The handout is distributed before class via Canvas. Students bring
it to lecture and fill in blanks from the projected slides. The professor adds verbal
explanation beyond the slides — this is not blanked out, but assessed separately through
short answer questions.

This creates a deliberate two-layer system:
- **Blanks** → answered from projected slides; confirm attendance; shareable notes are an accepted outcome
- **Short answer assessments** → test comprehension of verbal explanation; cannot be answered from blanks alone

Students do not receive a personal copy of the slides. The completed handout
(blanks filled from slides + scaffolded context) serves as their study document.
Key frameworks and diagrams from slides must be represented in the handout as
partial structures so students can orient themselves during lecture and have a
complete reference afterward.

### Layout

2-column table, full width:
- **Left cue column:** 2880 DXA (~2"), blue `F0F4FA` background, bold navy cue keywords
- **Right notes column:** 6480 DXA (~4.5"), white background, content + blanks
- **Vertical divider:** solid blue `2E5FA3`, 8pt weight

### Blank Types (mix deliberately)

| Type | Example |
|---|---|
| Fill-in-the-blank mid-sentence | `exploits _______, not software` |
| Open bullet with label | `• Cognitive load — attacks timed for _______` |
| Open line with italic hint | `*Key concept* _______` |
| Synthesis bullets | `Key lesson: _______` |

**Blank density:** ~40% blank / 60% scaffolded by default.
- More scaffolded → intro topics or weaker students
- More open → advanced topics or strong students

### Diagrams and Visual Content

For any framework, process chain, state diagram, or taxonomy that appears on a slide,
include a representation in the handout:
- Labeled outline or partial diagram with blank labels for students to fill in
- Pre-drawn structure (boxes, arrows) with content removed
- Table with row/column headers intact but cells blanked

Do not leave major visual concepts slide-only. If it matters enough to be on a slide,
it belongs in the handout in some form.

### Section Headers

Full-width dark navy `1F3864` rows spanning both columns.

### Summary Boxes

Blue-tinted `EBF3FB` header + white lines, one at bottom of each page.

### Self-Quiz Section

4 review questions at end of page 2, answered after class.

### Vocabulary Section

Key terms with blank definitions.

---

## Blank Audit (MANDATORY)

Every blank must be answerable from a projected slide during class. This is the
attendance mechanism — students fill blanks by watching the lecture, not by guessing.

| Blank type | Required source |
|---|---|
| Specific fact (%, name, value) | Must appear on a slide — cite slide number in audit |
| Definition or concept | Must appear on a slide |
| Process / chain step | Must appear on a slide (process diagram, chain card, or table row) |
| Synthesis / open-ended | No slide source needed — mark cue column *(synthesis)* |

**Verbal explanation is not a blank source.** If the professor elaborates verbally
beyond a slide, that content belongs in the scaffolded text of the handout, not as
a blank — and it should be assessed through short answer questions, not fill-in.

Mark the cue column *(verbal)* only as a professor reminder to say something
explicitly. The corresponding notes-column cell must be scaffolded, not blank.

**Never leave silent gaps.** Every blank must map to a readable answer on a specific
projected slide. If no slide covers it, either add it to a slide or convert the blank
to scaffolded text.

---

## Study Questions (.docx)

- **Count:** 10 questions
- **Tiers:**
  - `[Recall]` green `2E7D32` — 2 questions — direct from lecture
  - `[Apply]` blue `1565C0` — 3 questions — use concepts in new scenarios
  - `[Analyze]` purple `6A1B9A` — 5 questions — synthesize, evaluate, argue

### Format Per Question

- Bold `Q#.` prefix in navy
- Question text in normal weight
- Colored difficulty badge inline
- Optional italic hint in gray `888888`
- Answer lines sized to expected response length

### Required Design Rules

- At least 1 question requires attacker-mindset or adversarial thinking
- At least 1 has no single correct answer (graded on reasoning quality)
- At least 1 references a specific case study from lecture
- Multi-part questions use lettered sub-items (a, b, c)

### Collaboration Note

> "You may work with one or two partners but all students must submit individually"

---

## Pop Quiz (.docx)

- **Count:** 5 questions
- **Time:** ~10 minutes
- **Font / page:** Arial, US Letter, 1" margins — matches lecture notes

### Header Block (top of page)

```
POP QUIZ — [Topic in ALL CAPS]
[Course Code] — [Course Name]
Name: ______________________________    Date: ___________
```

Course code line in navy `1F3864`, bold. Name/Date line in body text.

### Question Types and Distribution

| # | Type | Tier |
|---|---|---|
| Q1–Q2 | Multiple choice (4 options A–D) | Recall |
| Q3 | Fill-in-the-blank (1–2 blanks) | Recall / Apply |
| Q4 | Short answer (2–3 sentences expected) | Apply |
| Q5 | Short answer (3–5 sentences expected) | Analyze |

- MC options each on their own line, indented, labeled `A.` `B.` `C.` `D.`
- Short-answer questions followed by ruled answer lines sized to expected response
- All questions drawn from slide content or stated lecture material — no curveballs

### Format Per Question

- Bold `Q#.` prefix in navy `1F3864`
- Question text in normal weight
- No difficulty badge (unlike study questions — keep the quiz feel clean)
- Ruled lines below short-answer questions: 3 lines for Apply, 5 lines for Analyze

### Answer Key

Page break after Q5. Separate page with red header:

```
ANSWER KEY — NOT FOR DISTRIBUTION
[Course Code] — [Topic]
```

Header background red `C0392B`, white text. Each answer listed `Q1: [answer]` in bold,
followed by a brief explanation (1–2 sentences) that could serve as a grading rubric.
MC answers include why the distractors are wrong.

### Design Rules

- Every question must have an unambiguous correct answer (or clear rubric for short answer)
- MC distractors must be plausible — no throwaway wrong answers
- Do not reuse questions verbatim from the study questions document
- Quiz should be completable in 10 minutes by a prepared student

---

## Question Bank (.docx)

A reusable pool of questions for exam and quiz authoring. Scoped to a **full lecture
topic**, which may span 2–4 class sessions (2–4 hours of content). Organized by
question type — the instructor selects and assembles their own assessments from it.

- **Font / page:** Arial, US Letter, 1" margins — matches lecture notes
- **Total questions:** ~50 across four sections
- **Input required:** full topic name + list of subtopics/sessions covered

### Header Block

```
QUESTION BANK — [Topic in ALL CAPS]
[Course Code] — [Course Name]
Sessions covered: [Subtopic 1] | [Subtopic 2] | [Subtopic 3] …
```

Course code line in navy `1F3864`, bold. Sessions line in muted gray `888888`, italic.
Subtitle in body text: `For instructor use only. Select questions to assemble quizzes and exams.`

### Sections and Question Counts

Each section opens with a full-width dark navy `1F3864` header row (white text, bold).
Questions are numbered continuously within each section (MC-1, MC-2 … TF-1, TF-2 …).

| Section | Header label | Count |
|---|---|---|
| Multiple Choice | `MULTIPLE CHOICE` | 20 |
| True / False | `TRUE / FALSE` | 12 |
| Fill-in-the-Blank | `FILL IN THE BLANK` | 10 |
| Short Answer | `SHORT ANSWER` | 8 |

### Subtopic Grouping

Within each section, questions are grouped by subtopic. Each subtopic opens with a
shaded divider row (light blue `EBF3FB`, navy bold text) spanning the column:

```
  ── Authentication Fundamentals ──
MC-1  …
MC-2  …
  ── Password Attacks ──
MC-3  …
```

Distribute questions proportionally across subtopics — no subtopic should have fewer
than 2 or more than 40% of a section's questions.

### Difficulty Tag

Every question carries an inline difficulty tag in muted gray `888888` after the question number:

- `[★]` — Recall
- `[★★]` — Apply
- `[★★★]` — Analyze

Distribute difficulty across each section; do not cluster all hard questions at the end.
Target mix per section: ~40% Recall, ~35% Apply, ~25% Analyze.

### Format by Type

**Multiple Choice**
- Stem on its own line
- Options on separate lines: `A.` `B.` `C.` `D.`
- Distractors must be plausible — no throwaway wrong answers
- One unambiguous correct answer per question

**True / False**
- Statement only — no hints in the phrasing
- Balance: roughly half true, half false across the section
- Avoid absolute qualifiers ("always", "never") unless they are the point being tested

**Fill-in-the-Blank**
- 1–2 blanks per sentence, represented as `_______`
- Blanks target key terms, values, or process steps from lecture
- Sentence must be unambiguous with the blank removed

**Short Answer**
- One focused question; 3–5 sentence response expected
- Include a parenthetical scope hint: *(2–3 sentences)*
- Mix factual, applied, and analytical prompts; at least 2 must require synthesis across subtopics

### Answer Key

Page break after the last Short Answer question. Separate page with red header:

```
ANSWER KEY — NOT FOR DISTRIBUTION
[Course Code] — [Topic]
```

Header background red `C0392B`, white text. Answers grouped by section, matching the
question prefix labels (MC-1, MC-2 …).

- **MC / T/F / Fill-in:** Answer only, plus a one-sentence explanation
- **Short Answer:** A model response (3–5 sentences) usable as a grading rubric

### Design Rules

- All questions must be answerable from lecture content or assigned readings — no outside knowledge
- Do not reuse questions verbatim from the study questions or pop quiz documents
- Coverage must be proportional — every subtopic must appear in at least two question types
- Short answer questions must not duplicate each other in what they assess

---

## GitHub Assignment (README.md)

### Structure

```markdown
# [COURSE] Reading Assignment: [Topic]

### Assignment Description
Answer the following questions from the [Chapter X] reading...
[collaboration note]

1. Question text

2. Question text

   1. Sub-question
   2. Sub-question

3. Question with code block:

   ``` language
   code here
   ```

### Deliverables
[standard boilerplate — copy verbatim]

#### Please note:
[standard boilerplate — copy verbatim]
```

### Rules

- Numbered questions only (no bullets at top level)
- Sub-questions: nested `1.` / `2.` / `3.` indented 4 spaces
- Code blocks: triple backticks with language hint
- Figures: `![Alt text](filename.png "Title")`
- Blockquotes (`>`) for notes, warnings, contextual callouts
- Deliverables and "Please note" sections are **verbatim boilerplate — never change**

### Standard Deliverables Boilerplate (copy exactly)

```
### Deliverables

Commit the answers to the questions in a readable file to your git repository by the
due date and time indicated with your repository on GitHub Classroom. The only approved
file submission format is Markdown. Other formats will only be accepted with explicit
approval.

#### Please note:

* Your writeup file *must* be done in [Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) format and must be included in the repository as a separate file. View the file [`README.md`](README.md?plain=1) for an example of Markdown.
* Any included images or screenshots should be done in `*.jpg`, `*.png`, or `*.gif` formats, and be included individually as files in your repository (i.e. no binary 'document' with the images pasted inside).
* Screenshots or images *may* be linked in your Markdown file writeup if you wish to do so.
```

---

## Slide Deck (.pptx)

### Color Palette — "CS Modern" Dark Theme

| Role | Color |
|---|---|
| Background | deep slate `0F172A` |
| Panel / card background | `1E293B` |
| Secondary panel | `334155` |
| Primary accent | indigo `6366F1` |
| Bright accent (hover / highlight) | `818CF8` |
| Body text | `F1F5F9` |
| Muted text | `94A3B8` |
| Warning / stat | amber `F59E0B` |
| Positive / success | emerald `22C55E` |
| Secondary accent | sky `38BDF8` |

### Layout

- 16×9, 10" × 5.625"
- Calibri Black for titles (36–40pt)
- Calibri for body (11–14pt)

### Every Content Slide Must Have

- Indigo top stripe (6pt, full width, `6366F1`)
- Section tag badge (indigo rectangle `6366F1`, white all-caps label, top-left)
- Slide title (large, white or indigo, Calibri Black)
- Footer: `[COURSE] — [Topic]   |   N / TOTAL` centered, muted, 8pt

### Card / Panel Pattern

Dark panel `1E293B` with shadow; left accent bar in section color for emphasis rows.

### Icons

`react-icons`, rasterized to PNG via `sharp` at 256px minimum.

### No accent lines under titles — use whitespace or background color.

### Standard Slide Structure

| Slide | Content |
|---|---|
| 1 | Title (topic, subtitle, 3 stat callouts in bottom bar) |
| 2 | Agenda (6-card grid with numbered sections) |
| 3 | Opening hook / motivation |
| 4 | Core thesis / central argument |
| 5–6 | Framework or taxonomy (tables, grids, icon rows) |
| 7–10 | Case studies (4-column process/event chain cards + key lesson bar) |
| 11 | Real-world context / implications |
| 12 | Activity slide (problem, scenario, or live demo) |
| 13–14 | Solutions / best practices |
| 15 | Discussion questions |
| 16 | Closing / key takeaways + reading list |
