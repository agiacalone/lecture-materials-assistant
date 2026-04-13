const { slugifyTopic } = require("./context");

function parseList(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSpecArgs(argv) {
  const args = {
    help: false,
    output: "",
    prompt: "",
    topic: "",
    courseCode: "",
    courseName: "",
    studentLevel: "",
    minutes: "",
    format: "",
    summary: "",
    objectives: "",
    concepts: "",
    sections: "",
    cases: "",
    activities: "",
    questions: "",
    adversarial: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    const next = argv[index + 1] || "";
    switch (token) {
      case "--output":
        args.output = next;
        index += 1;
        break;
      case "--prompt":
        args.prompt = next;
        index += 1;
        break;
      case "--topic":
        args.topic = next;
        index += 1;
        break;
      case "--course-code":
        args.courseCode = next;
        index += 1;
        break;
      case "--course-name":
        args.courseName = next;
        index += 1;
        break;
      case "--student-level":
        args.studentLevel = next;
        index += 1;
        break;
      case "--minutes":
        args.minutes = next;
        index += 1;
        break;
      case "--format":
        args.format = next;
        index += 1;
        break;
      case "--summary":
        args.summary = next;
        index += 1;
        break;
      case "--objectives":
        args.objectives = next;
        index += 1;
        break;
      case "--concepts":
        args.concepts = next;
        index += 1;
        break;
      case "--sections":
        args.sections = next;
        index += 1;
        break;
      case "--cases":
        args.cases = next;
        index += 1;
        break;
      case "--activities":
        args.activities = next;
        index += 1;
        break;
      case "--questions":
        args.questions = next;
        index += 1;
        break;
      case "--adversarial":
        args.adversarial = next;
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument "${token}". Use --help for usage.`);
    }
  }

  return args;
}

function defaultSection(sectionTitle, concept, minutes) {
  return {
    title: sectionTitle,
    minutes,
    overview: `Explain ${sectionTitle.toLowerCase()} and connect it to ${concept || "the lecture objectives"}.`,
    points: [
      `Define the core idea behind ${sectionTitle.toLowerCase()}.`,
      `Show one concrete example that makes ${sectionTitle.toLowerCase()} operational.`,
      `Link ${sectionTitle.toLowerCase()} back to the lecture’s main tradeoffs.`,
    ],
    activities: [
      `Ask students to explain ${sectionTitle.toLowerCase()} in their own words.`,
    ],
    blanks: [
      {
        cue: sectionTitle,
        template: `${sectionTitle}: _______`,
      },
    ],
  };
}

function createSections(sectionNames, concepts, totalMinutes) {
  const names = sectionNames.length > 0 ? sectionNames : ["Opening Hook", "Core Mechanics", "Tradeoffs and Cases"];
  const sectionMinutes = Math.max(10, Math.floor((Number(totalMinutes) || 75) / names.length));
  return names.map((name, index) => defaultSection(name, concepts[index] || concepts[0], sectionMinutes));
}

function createSpecFromArgs(args) {
  const topic = args.topic.trim();
  const objectives = parseList(args.objectives);
  const concepts = parseList(args.concepts);
  const sections = parseList(args.sections);
  const caseStudies = parseList(args.cases);
  const activities = parseList(args.activities);
  const questions = parseList(args.questions);

  return {
    course: {
      code: args.courseCode || "COURSE 000",
      name: args.courseName || "Course Name",
      studentLevel: args.studentLevel || "Target student level",
      lectureLengthMinutes: Number(args.minutes) || 75,
      assessmentFormat: args.format || "GitHub Classroom and in-class activities",
      adversarialThinking: String(args.adversarial || "no").toLowerCase() === "yes",
    },
    lecture: {
      topic,
      slug: slugifyTopic(topic),
      summary: args.summary || `Introduce ${topic} and build a lecture around the provided concepts, examples, and discussion prompts.`,
      openingHook: `Open with a concrete problem that makes ${topic} necessary rather than abstract.`,
      objectives: objectives.length > 0 ? objectives : [
        `Explain the core idea behind ${topic}.`,
        `Apply ${topic} to a practical computing scenario.`,
        `Evaluate the tradeoffs and failure modes around ${topic}.`,
      ],
      keyConcepts: concepts.length > 0 ? concepts : [topic, "core mechanism", "tradeoffs"],
      caseStudies: caseStudies,
      activities: activities,
      takeaways: objectives.length > 0 ? objectives : [
        `${topic} solves a real engineering problem with concrete tradeoffs.`,
        `Students should be able to explain and defend the main design choices.`,
      ],
      discussionQuestions: questions,
      references: [],
      vocabulary: concepts.length > 0 ? concepts : [topic],
      sections: createSections(sections, concepts, args.minutes),
    },
  };
}

function printSpecHelp() {
  process.stdout.write(
    [
      "Usage:",
      "  node init-spec.js --topic \"Virtual Memory\" [options]",
      "",
      "Required:",
      "  --topic <name>                 Lecture topic",
      "",
      "Options:",
      "  --output <file>               Output JSON path",
      "  --prompt <text>               Freeform lecture request to parse",
      "  --course-code <text>          Course code",
      "  --course-name <text>          Course name",
      "  --student-level <text>        Student level",
      "  --minutes <n>                 Lecture length in minutes",
      "  --format <text>               Assessment format",
      "  --summary <text>              Lecture summary",
      "  --objectives <a|b|c>          Pipe-delimited objectives",
      "  --concepts <a|b|c>            Pipe-delimited key concepts",
      "  --sections <a|b|c>            Pipe-delimited section titles",
      "  --cases <a|b|c>               Pipe-delimited case studies",
      "  --activities <a|b|c>          Pipe-delimited activities",
      "  --questions <a|b|c>           Pipe-delimited discussion questions",
      "  --adversarial <yes|no>        Whether attacker-mindset content is required",
      "",
      "Example:",
      "  node init-spec.js --prompt \"Generate lecture materials for Virtual Memory in CECS 326. Cover: address translation, TLBs, page faults. Sections: why VM exists|page translation|thrashing.\"",
      "",
      "Flag-based example:",
      "  node init-spec.js --topic \"Virtual Memory and Paging\" \\",
      "    --course-code \"CECS 326\" \\",
      "    --course-name \"Operating Systems\" \\",
      "    --concepts \"virtual address space|page table translation|TLB locality\" \\",
      "    --sections \"Why VM exists|Address translation|Page faults and thrashing\"",
    ].join("\n"),
  );
}

module.exports = {
  createSpecFromArgs,
  parseSpecArgs,
  printSpecHelp,
};
