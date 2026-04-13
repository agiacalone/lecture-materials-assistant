const path = require("path");
const { topicSlug } = require("../lib/context");
const { bullet, paragraph, sectionBanner, summaryBox, twoColumnNotes, writeDocx } = require("../lib/docx-helpers");

function sectionAnchorRows(section) {
  const rows = [];

  rows.push({
    cue: `${section.title} anchor`,
    notes: section.cornellPrompt || `${section.title}: capture the anchor claim from the projected slide. Keep the high-value definition or conclusion for in-class completion.`,
    cueFill: "2E5FA3",
    cueColor: "FFFFFF",
    notesFill: "EBF3FB",
  });

  if (section.overview) {
    rows.push({
      cue: "Why it matters",
      notes: `${section.overview} Key conclusion: _______.`,
    });
  }

  (section.points || []).slice(0, 3).forEach((point, index) => {
    rows.push({
      cue: `Point ${index + 1}`,
      notes: `${point.replace(/\.$/, "")}: _______.`,
    });
  });

  (section.blanks || []).forEach((blank) => {
    rows.push({
      cue: blank.cue,
      notes: blank.template,
    });
  });

  return rows;
}

function buildOpeningRows(config) {
  return [
    {
      cue: "Opening hook",
      notes: `${config.lecture.openingHook || `Why does ${config.lecture.topic} matter in practice?`} Key setup: _______.`,
      cueFill: "2E5FA3",
      cueColor: "FFFFFF",
      notesFill: "EBF3FB",
    },
  ];
}

function buildFrameworkRows(config) {
  return (config.lecture.keyConcepts || []).map((concept, index) => ({
    cue: `Concept ${index + 1}`,
    notes: `${concept}: _______.`,
  }));
}

function buildBulletRows(items, cuePrefix, promptFactory) {
  return (items || []).map((item, index) => ({
    cue: `${cuePrefix} ${index + 1}`,
    notes: promptFactory(item),
  }));
}

function buildSummaryPrompts(topic, sections) {
  const first = sections[0] ? sections[0].title : topic;
  const last = sections[sections.length - 1] ? sections[sections.length - 1].title : topic;
  return [
    `Big idea: ${topic} matters because ________________________________.`,
    `Most important move from ${first}: ________________________________.`,
    `Connection to ${last}: ___________________________________________.`,
  ];
}

function buildTakeawayPrompts(items) {
  return (items || []).slice(0, 3).map((item, index) => `Takeaway ${index + 1}: ${item.replace(/\.$/, "")} -> _______.`);
}

async function generate(config, options) {
  const slug = topicSlug(config);
  const filePath = path.join(options.outputDir, `${slug}_cornell_handout.docx`);
  const children = [];
  const lecture = config.lecture;

  children.push(paragraph("Pre-distributed guided notes. This handout follows the lecture in order and captures only anchor content. Students fill omitted key elements from projected slides during lecture."));

  children.push(sectionBanner("Opening Hook", "takeaway"));
  children.push(twoColumnNotes(buildOpeningRows(config)));

  children.push(sectionBanner("Framework", "structure"));
  children.push(twoColumnNotes(buildFrameworkRows(config)));

  children.push(sectionBanner("Taxonomy / Concepts", "structure"));
  lecture.sections.forEach((section) => {
    children.push(sectionBanner(`${section.title} (${section.minutes || "TBD"} min)`, "concept"));
    children.push(twoColumnNotes(sectionAnchorRows(section)));
  });

  children.push(summaryBox("Page Summary", buildSummaryPrompts(lecture.topic, lecture.sections)));

  if ((lecture.caseStudies || []).length > 0) {
    children.push(sectionBanner("Case Studies", "analysis"));
    children.push(twoColumnNotes(buildBulletRows(lecture.caseStudies, "Case", (item) => `${item}: evidence from lecture -> _______.`)));
  }

  if ((lecture.activities || []).length > 0) {
    children.push(sectionBanner("Activities", "practice"));
    children.push(twoColumnNotes(buildBulletRows(lecture.activities, "Activity", (item) => `${item}: result / decision -> _______.`)));
  }

  children.push(sectionBanner("Defense / Takeaways", "takeaway"));
  children.push(twoColumnNotes(buildBulletRows(lecture.takeaways || lecture.objectives, "Takeaway", (item) => `${item.replace(/\.$/, "")}: _______.`)));

  if ((lecture.discussionQuestions || []).length > 0) {
    children.push(sectionBanner("Discussion Questions", "concept"));
    children.push(twoColumnNotes(buildBulletRows(lecture.discussionQuestions, "Question", (item) => `${item} Notes: ________________________________________________`)));
  }

  children.push(summaryBox("End-of-Lecture Summary", buildTakeawayPrompts(lecture.takeaways || lecture.objectives)));

  children.push(sectionBanner("Vocabulary", "concept"));
  (lecture.vocabulary || lecture.keyConcepts).forEach((term) => {
    const text = typeof term === "string" ? `${term}: _______` : `${term.term}: ${term.definitionBlank || "_______"}`;
    children.push(bullet(text));
  });

  children.push(sectionBanner("Self-Quiz", "takeaway"));
  (lecture.selfQuiz || lecture.discussionQuestions || []).slice(0, 4).forEach((question) => {
    children.push(bullet(question));
  });

  await writeDocx(filePath, children, { title: `CORNELL HANDOUT - ${lecture.topic}` });
  return filePath;
}

module.exports = { generate };
