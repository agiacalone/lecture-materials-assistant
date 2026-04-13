const KNOWN_LABELS = [
  "Topic",
  "Course Code",
  "Course Name",
  "Course",
  "Student Level",
  "Lecture Length",
  "Minutes",
  "Assessment Format",
  "Summary",
  "Objectives",
  "Learning Objectives",
  "Concepts",
  "Key Concepts",
  "Cover",
  "Sections",
  "Agenda",
  "Subtopics",
  "Case Studies",
  "Examples",
  "Activities",
  "Exercises",
  "Questions",
  "Discussion Questions",
  "Adversarial Thinking",
];

function splitList(value) {
  return String(value || "")
    .split(/\s*\|\s*|\s*,\s*|\s*;\s*/)
    .map((item) => item.trim().replace(/[.]+$/g, ""))
    .filter(Boolean);
}

function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizePrompt(prompt) {
  let normalized = String(prompt || "").trim();
  for (const label of KNOWN_LABELS) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`([.!?])\\s*(${escaped}:)`, "gi");
    normalized = normalized.replace(pattern, "$1\n$2");
  }
  return normalized;
}

function extractLabeledValue(prompt, label) {
  const normalized = normalizePrompt(prompt);
  const pattern = new RegExp(`(?:^|\\n)${label}:\\s*([\\s\\S]*?)(?=\\n(?:${KNOWN_LABELS.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}):|$)`, "i");
  const match = normalized.match(pattern);
  return match ? match[1].trim() : "";
}

function sentenceList(text) {
  return String(text || "")
    .split(/\.\s+|\n+/)
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

function inferTopic(prompt) {
  const labeled = extractLabeledValue(prompt, "Topic");
  if (labeled) {
    return labeled;
  }

  const match = prompt.match(/(?:lecture materials|lecture|slides|handout|quiz)\s+(?:for|on)\s+([^.\n]+)/i);
  if (match) {
    return match[1]
      .replace(/\bin\s+[A-Z]{2,}\s*\d{2,3}[A-Z]?\b.*$/i, "")
      .replace(/[.]+$/g, "")
      .trim();
  }

  return "Lecture Topic";
}

function inferCourseCode(prompt) {
  const labeled = extractLabeledValue(prompt, "Course Code");
  if (labeled) {
    return labeled;
  }

  const match = prompt.match(/\b([A-Z]{2,}\s*\d{2,3}[A-Z]?)\b/);
  return match ? match[1].trim() : "";
}

function inferCourseName(prompt) {
  const labeled = extractLabeledValue(prompt, "Course Name");
  if (labeled) {
    return labeled;
  }

  const course = extractLabeledValue(prompt, "Course");
  if (course) {
    return course.replace(/^[A-Z]{2,}\s*\d{2,3}[A-Z]?\s*[-:]\s*/i, "").trim();
  }

  const match = prompt.match(/\bin\s+[A-Z]{2,}\s*\d{2,3}[A-Z]?\s+([^.\n]+)/i);
  if (match) {
    return match[1].trim().replace(/[.]+$/g, "");
  }

  return "";
}

function inferMinutes(prompt) {
  const labeled = extractLabeledValue(prompt, "Minutes") || extractLabeledValue(prompt, "Lecture Length");
  if (labeled) {
    const parsed = labeled.match(/\d+/);
    return parsed ? parsed[0] : "";
  }

  const match = prompt.match(/(?:~|about|around)?\s*(\d+)\s*minutes?/i);
  return match ? match[1] : "";
}

function inferAssessmentFormat(prompt) {
  const labeled = extractLabeledValue(prompt, "Assessment Format");
  if (labeled) {
    return labeled;
  }

  if (/reading assignment/i.test(prompt)) {
    return "Reading assignment";
  }
  if (/lab|programming assignment|github classroom/i.test(prompt)) {
    return "GitHub Classroom lab and in-class activities";
  }
  return "";
}

function inferStudentLevel(prompt) {
  return extractLabeledValue(prompt, "Student Level").replace(/[.]+$/g, "");
}

function inferSummary(prompt) {
  const labeled = extractLabeledValue(prompt, "Summary");
  if (labeled) {
    return labeled.replace(/[.]+$/g, "");
  }

  const cover = extractLabeledValue(prompt, "Cover");
  if (cover) {
    return `Cover ${cover.replace(/\s+/g, " ").trim().replace(/[.]+$/g, "")}.`;
  }

  return "";
}

function inferConcepts(prompt) {
  const labeled = extractLabeledValue(prompt, "Concepts") || extractLabeledValue(prompt, "Key Concepts") || extractLabeledValue(prompt, "Cover");
  if (labeled) {
    return splitList(labeled);
  }
  return [];
}

function inferSections(prompt, concepts) {
  const labeled = extractLabeledValue(prompt, "Sections") || extractLabeledValue(prompt, "Agenda") || extractLabeledValue(prompt, "Subtopics");
  if (labeled) {
    return splitList(labeled).map((item) => titleCase(item));
  }

  return concepts.slice(0, 4).map((concept) => titleCase(concept));
}

function inferCaseStudies(prompt) {
  const labeled = extractLabeledValue(prompt, "Case Studies") || extractLabeledValue(prompt, "Examples");
  return labeled ? splitList(labeled) : [];
}

function inferActivities(prompt) {
  const labeled = extractLabeledValue(prompt, "Activities") || extractLabeledValue(prompt, "Exercises");
  return labeled ? splitList(labeled) : [];
}

function inferQuestions(prompt) {
  const labeled = extractLabeledValue(prompt, "Questions") || extractLabeledValue(prompt, "Discussion Questions");
  if (labeled) {
    return splitList(labeled);
  }
  return [];
}

function inferObjectives(prompt, topic, concepts) {
  const labeled = extractLabeledValue(prompt, "Objectives") || extractLabeledValue(prompt, "Learning Objectives");
  if (labeled) {
    return splitList(labeled);
  }

  const concept = concepts[0] || topic;
  return [
    `Explain the core idea behind ${topic}.`,
    `Apply ${concept} to a practical computing scenario.`,
    `Evaluate the main tradeoffs and failure modes around ${topic}.`,
  ];
}

function inferAdversarial(prompt) {
  const labeled = extractLabeledValue(prompt, "Adversarial Thinking");
  if (labeled) {
    return /yes|true/i.test(labeled);
  }
  return /attacker|adversarial|security/i.test(prompt);
}

function parsePromptToArgs(prompt) {
  const topic = inferTopic(prompt);
  const concepts = inferConcepts(prompt);
  return {
    topic,
    courseCode: inferCourseCode(prompt),
    courseName: inferCourseName(prompt),
    studentLevel: inferStudentLevel(prompt),
    minutes: inferMinutes(prompt),
    format: inferAssessmentFormat(prompt),
    summary: inferSummary(prompt),
    objectives: inferObjectives(prompt, topic, concepts).join("|"),
    concepts: concepts.join("|"),
    sections: inferSections(prompt, concepts).join("|"),
    cases: inferCaseStudies(prompt).join("|"),
    activities: inferActivities(prompt).join("|"),
    questions: inferQuestions(prompt).join("|"),
    adversarial: inferAdversarial(prompt) ? "yes" : "no",
  };
}

module.exports = {
  parsePromptToArgs,
};
