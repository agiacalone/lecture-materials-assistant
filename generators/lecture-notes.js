const path = require("path");
const { topicSlug } = require("../lib/context");
const { bullet, callout, heading, labelValue, paragraph, writeDocx } = require("../lib/docx-helpers");

async function generate(config, options) {
  const slug = topicSlug(config);
  const filePath = path.join(options.outputDir, `${slug}_lecture_notes.docx`);
  const children = [];
  const { course, lecture } = config;

  children.push(paragraph(lecture.summary));
  children.push(labelValue("Course", `${course.code} - ${course.name}`));
  children.push(labelValue("Student level", course.studentLevel));
  children.push(labelValue("Lecture length", `${course.lectureLengthMinutes} minutes`));
  children.push(labelValue("Assessment format", course.assessmentFormat));

  children.push(heading("Learning Objectives"));
  lecture.objectives.forEach((objective) => children.push(bullet(objective)));

  children.push(heading("Opening Hook"));
  children.push(paragraph(lecture.openingHook || `Frame ${lecture.topic} as a practical systems problem before introducing formal vocabulary.`));

  children.push(heading("Framework"));
  lecture.keyConcepts.forEach((concept) => children.push(bullet(concept)));

  children.push(heading("Taxonomy / Concepts"));
  lecture.sections.forEach((section) => {
    children.push(heading(`${section.title} (${section.minutes || "TBD"} min)`, { size: 24 }));
    if (section.overview) {
      children.push(paragraph(section.overview));
    }
    (section.points || []).forEach((point) => children.push(bullet(point)));
    (section.callouts || []).forEach((item) => children.push(callout(item.label, item.text, item.tint)));
    (section.speakerNotes || []).forEach((note) => children.push(paragraph(`Speaker note: ${note}`, { italics: true, color: "555555" })));
  });

  children.push(heading("Case Studies"));
  (lecture.caseStudies || []).forEach((item) => children.push(bullet(item)));

  children.push(heading("Activities"));
  (lecture.activities || []).forEach((item) => children.push(bullet(item)));

  children.push(heading("Defense / Takeaways"));
  (lecture.takeaways || lecture.objectives).forEach((item) => children.push(bullet(item)));

  children.push(heading("Discussion Questions"));
  (lecture.discussionQuestions || []).forEach((item) => children.push(bullet(item)));

  children.push(heading("References"));
  (lecture.references || []).forEach((item) => children.push(bullet(item)));

  await writeDocx(filePath, children, { title: `LECTURE NOTES - ${lecture.topic}` });
  return filePath;
}

module.exports = { generate };
