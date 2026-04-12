# lecture-materials-assistant

A [Claude Code](https://claude.ai/code) skill for generating production-ready lecture materials for university CS courses.

This repo is the skill definition and reference material. In a course repo, Claude
uses it to generate JavaScript-based artifact generators, which then produce the
lecture materials.

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
| Exam | `.pdf` + `.tex` | Assembled from question bank(s); produces student and key versions |

## Installation

Choose the platform path that matches your Claude Code machine.

### macOS

Install the base tools:

```bash
brew install git node
```

For exam PDF generation, install a LaTeX distribution:

```bash
brew install --cask mactex-no-gui

# or a smaller install
brew install basictex
sudo tlmgr install enumitem listings geometry
```

### Fedora Server

Install the base tools:

```bash
sudo dnf install -y git nodejs npm
```

For exam PDF generation, install LaTeX:

```bash
sudo dnf install -y texlive-scheme-basic texlive-enumitem texlive-listings texlive-geometry
```

### Fedora Kinoite with Distrobox

Install and use the skill inside your Distrobox container rather than on the immutable host.

Create a container if needed:

```bash
distrobox create --name lecture-materials-assistant --image fedora:latest
```

Enter the container and install the base tools:

```bash
distrobox enter lecture-materials-assistant
sudo dnf install -y git nodejs npm
```

For exam PDF generation inside the container:

```bash
sudo dnf install -y texlive-scheme-basic texlive-enumitem texlive-listings texlive-geometry
```

### Ubuntu / Debian

Install the base tools:

```bash
sudo apt update
sudo apt install -y git nodejs npm
```

For exam PDF generation, install LaTeX:

```bash
sudo apt install -y texlive-latex-base texlive-latex-recommended texlive-latex-extra
```

### Skill Setup

**1. Install the skill into Claude's skills directory:**

```bash
mkdir -p ~/.claude/skills
git clone <this-repo> ~/.claude/skills/lecture-materials-assistant
```

**2. In your course repo, create `CLAUDE.md` from the example template:**

```bash
cp ~/.claude/skills/lecture-materials-assistant/CLAUDE.md.example ./CLAUDE.md
```

Fill in the five course context fields in `CLAUDE.md`.

**3. Reference the installed skill from your course repo's `CLAUDE.md`:**

```markdown
## Skills
- Use the lecture-materials-assistant skill at ~/.claude/skills/lecture-materials-assistant/SKILL.md
  for all lecture content generation requests.
```

## Dependencies

In each course repo where you generate materials, install the JS dependencies:

```bash
npm install docx pptxgenjs
npm install markdown-it
```

## Course Context

Before generating, provide these five fields in your initial prompt or in
`CLAUDE.md` when they matter for the requested artifact:

| Field | Example |
|---|---|
| Course code + name | `CECS 326 — Operating Systems` |
| Student level | `Upper-division CS majors; strong C/systems background` |
| Lecture length | `~75 minutes` |
| Assessment format | `GitHub Classroom (Markdown), in-class activities` |
| Adversarial thinking | `yes` (Security courses) / `no` (default) |

`Adversarial thinking` defaults to `no`, so it should not block generation by itself.

## Usage

Typical flow:

1. Put the skill on Claude's path and reference it from your course repo's `CLAUDE.md`.
2. Provide course context once.
3. Ask Claude to generate a lecture set, a question bank, or an exam.
4. Run the generated JS entrypoint(s) in your course repo.

### Generating lecture materials

> Generate lecture materials for [TOPIC] in [COURSE]. Cover: [KEY CONCEPTS]. Case studies: [EXAMPLES]. ~[N] minutes.

The skill generates JavaScript-based artifact generators in your working directory.
Those generators then produce the lecture materials.

```
generate.js              # CLI orchestrator for the standard lecture set
lib/
  palette.js
  docx-helpers.js
  pptx-helpers.js
  bank-helpers.js
  exam-helpers.js
generators/
  lecture-notes.js
  cornell-handout.js
  study-questions.js
  quiz.js
  readme.js
  slides.js
  question-bank.js
  exam.js
```

Run the standard lecture set at once, or regenerate a single artifact:

```bash
node generate.js                      # standard six-artifact lecture set
node generate.js --slides             # slides only
node generate.js --cornell            # Cornell handout only
node generators/slides.js             # same, standalone
```

### Generating a question bank

> Generate a question bank for [TOPIC] in [COURSE]. Sessions covered: [SUBTOPIC 1], [SUBTOPIC 2], [SUBTOPIC 3].

Question banks are topic-wide and append-only. Claude should read the existing bank
first, avoid duplicates, and assign the next sequence number per question type.

```bash
node generators/question-bank.js
```

### Assembling an exam

> Assemble an exam for [COURSE] [TERM], Exam [N], [X] pts. Draw from: [bank1.md], [bank2.md]. MC: 20 questions × 2 pts. Essay: 2 questions × 5 pts. Difficulty: ★ 40%, ★★ 35%, ★★★ 25%. Randomize: yes.

Exam assembly reads 2–3 bank files, weights question selection by topic coverage if
needed, writes `[course_num]-exam-[n]-[term].tex`, compiles the student PDF, then
toggles `\answerstrue` and recompiles to produce the key PDF.

```bash
node generators/exam.js
```

## References

- `references/style-guide.md` — complete style specifications for all artifacts
- `references/reference_exam.tex` — structural LaTeX template for exam generation

Generated code, generated course materials, and other outputs created by using this
repository are owned by the user who generates them. Those outputs are not required
to be licensed under this repository's license unless they copy substantial portions
of this repository itself.

## License

[MIT](LICENSE)
