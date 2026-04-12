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
| Open line with italic hint | `*Key IOC to spot* _______` |
| Synthesis bullets | `Key lesson: _______` |

**Blank density:** ~40% blank / 60% scaffolded by default.
- More scaffolded → intro topics or weaker students
- More open → advanced topics or strong students

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

Every blank must have a declared source. Audit before declaring the handout complete.

| Blank type | Required source |
|---|---|
| Specific fact (%, name, dollar amount) | Must appear on a slide |
| Definition or concept | Must appear on a slide or stated verbally |
| Process / attack chain step | Must appear on a case study or process slide |
| Synthesis / open-ended | No source needed — mark cue column *(synthesis)* |
| Verbal-only content | Mark cue column *(verbal)* so professor knows to say it |

**Never leave silent gaps.** If a blank's answer is only in the lecture notes,
either add it to a slide or flag it *(verbal)*.

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

### Color Palette — "Threat Intelligence" Dark Theme

| Role | Color |
|---|---|
| Background | deep navy `0D1B2A` |
| Panel / card background | `152536` |
| Secondary panel | `1A2D42` |
| Primary accent | threat red `C0392B` / bright red `E74C3C` |
| Body text | ice white `D6E4F0` |
| Muted text | `8BA5BF` |
| Warning / stat | gold `F39C12` |
| Defense / positive | green `27AE60` |
| Calm accent | blue `2980B9` |

### Layout

- 16×9, 10" × 5.625"
- Calibri Black for titles (36–40pt)
- Calibri for body (11–14pt)

### Every Content Slide Must Have

- Red top stripe (6pt, full width)
- Section tag badge (red rectangle, white all-caps label, top-left)
- Slide title (large, white or red, Calibri Black)
- Footer: `[COURSE] — [Topic]   |   N / TOTAL` centered, muted, 8pt

### Card / Panel Pattern

Dark panel `152536` with shadow; left accent bar in section color for emphasis rows.

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
| 7–10 | Case studies (4-column attack/process chain cards + key lesson bar) |
| 11 | Human factors or "why this matters" |
| 12 | Activity slide (forensics, scenario, or live demo) |
| 13–14 | Defense or resolution strategies |
| 15 | Discussion questions |
| 16 | Closing / key takeaways + reading list |
