# lecture-designer

A [Claude Code](https://claude.ai/code) skill for generating production-ready lecture materials for university CS courses. Designed for upper-division coursework in Operating Systems, Distributed Systems, and Computer Security.

## What It Generates

| Artifact | Format | Description |
|---|---|---|
| Lecture notes | `.docx` | Instructor copy with speaker notes, timing, and callout boxes |
| Cornell handout | `.docx` | Pre-distributed guided notes; students fill blanks from projected slides |
| Study questions | `.docx` | 10 tiered questions (Recall / Apply / Analyze) |
| Pop quiz | `.docx` | 5-question in-class quiz with instructor answer key |
| Slide deck | `.pptx` | 14–18 slides, CS Modern dark slate theme |
| GitHub README | `.md` | GitHub Classroom assignment (reading or lab variant) |
| Question bank | `.md` | Persistent tagged question pool (mc / tf / code / fib / sa) |
| Exam | `.pdf` + `.tex` | Assembled from question bank(s); answer key via `\ifanswers` toggle |

## Installation

Place this directory at `~/.claude/skills/lecture-materials-assistant/`, or reference it from your course project's `CLAUDE.md`:

```markdown
## Skills
- Use the lecture materials assistant skill at ./lecture-materials-assistant/SKILL.md
  for all lecture content generation requests.
```

Copy `CLAUDE.md.example` to your course project directory, rename it `CLAUDE.md`, and fill in the five course context fields.

## Dependencies

Install once per course repo:

```bash
npm install docx pptxgenjs
```

For exam PDF compilation:

```bash
# macOS
brew install --cask mactex-no-gui

# or minimal install
brew install basictex && sudo tlmgr install enumitem listings geometry
```

## Usage

### Generating lecture materials

```
Generate lecture materials for [TOPIC] in [COURSE].
Cover: [KEY CONCEPTS]. Case studies: [EXAMPLES]. ~[N] minutes.
```

The skill generates a modular script structure in your working directory:

```
generate.js              # CLI orchestrator
lib/
  palette.js
  docx-helpers.js
  pptx-helpers.js
generators/
  lecture-notes.js
  cornell-handout.js
  study-questions.js
  quiz.js
  slides.js
  readme.js
```

Run all artifacts at once or regenerate a single one:

```bash
node generate.js              # all six artifacts
node generate.js --slides     # slides only
node generate.js --cornell    # Cornell handout only
node generators/slides.js     # same, standalone
```

### Generating a question bank

```
Generate a question bank for [TOPIC] in [COURSE].
Sessions covered: [SUBTOPIC 1], [SUBTOPIC 2], [SUBTOPIC 3].
```

### Assembling an exam

```
Assemble an exam for [COURSE] [TERM], Exam [N], [X] pts.
Draw from: [bank1.md], [bank2.md].
MC: 20 questions × 2 pts. Essay: 2 questions × 5 pts.
Difficulty: ★ 40%, ★★ 35%, ★★★ 25%. Randomize: yes.
```

Produces `[course]-exam-[n]-[term].pdf` (student copy) and retains the `.tex` source. For the answer key, set `\answerstrue` in the `.tex` and recompile:

```bash
pdflatex 326-exam-1-sp26.tex   # student copy
# edit: \answersfalse → \answerstrue
pdflatex 326-exam-1-sp26.tex   # answer key → rename to 326-exam-1-sp26-key.pdf
```

## Course Context Fields

| Field | Example |
|---|---|
| Course code + name | `CECS 326 — Operating Systems` |
| Student level | `Upper-division CS majors; strong C/systems background` |
| Lecture length | `~75 minutes` |
| Assessment format | `GitHub Classroom (Markdown), in-class activities` |
| Adversarial thinking | `yes` (Security courses) / `no` (OS, Distributed Systems) |

## References

- `references/style-guide.md` — complete style specifications for all artifacts
- `references/reference_exam.tex` — structural LaTeX template for exam generation

## License

[GPL-3.0](LICENSE)
