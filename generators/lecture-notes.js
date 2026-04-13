const path = require("path");
const { topicSlug } = require("../lib/context");
const { bullet, callout, heading, labelValue, paragraph, sectionBanner, writeDocx } = require("../lib/docx-helpers");

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

  children.push(sectionBanner("Learning Objectives", "concept"));
  lecture.objectives.forEach((objective) => children.push(bullet(objective)));

  children.push(sectionBanner("Opening Hook", "takeaway"));
  children.push(paragraph(lecture.openingHook || `Frame ${lecture.topic} as a practical systems problem before introducing formal vocabulary.`));

  children.push(sectionBanner("Framework", "structure"));
  lecture.keyConcepts.forEach((concept) => children.push(bullet(concept)));

  children.push(sectionBanner("Taxonomy / Concepts", "structure"));
  lecture.sections.forEach((section) => {
    children.push(heading(`${section.title} (${section.minutes || "TBD"} min)`, { size: 24 }));
    if (section.overview) {
      children.push(paragraph(section.overview));
    }
    (section.points || []).forEach((point) => children.push(bullet(point)));
    (section.callouts || []).forEach((item) => children.push(callout(item.label, item.text, item.tint)));
    (section.speakerNotes || []).forEach((note) => children.push(paragraph(`Speaker note: ${note}`, { italics: true, color: "555555" })));
  });

  children.push(sectionBanner("Case Studies", "analysis"));
  (lecture.caseStudies || []).forEach((item) => children.push(bullet(item)));

  children.push(sectionBanner("Activities", "practice"));
  (lecture.activities || []).forEach((item) => children.push(bullet(item)));

  children.push(sectionBanner("Defense / Takeaways", "takeaway"));
  (lecture.takeaways || lecture.objectives).forEach((item) => children.push(bullet(item)));

  children.push(sectionBanner("Discussion Questions", "concept"));
  (lecture.discussionQuestions || []).forEach((item) => children.push(bullet(item)));

  children.push(sectionBanner("References", "reference"));
  (lecture.references || []).forEach((item) => children.push(bullet(item)));

  await writeDocx(filePath, children, { title: `LECTURE NOTES - ${lecture.topic}` });
  return filePath;
}

module.exports = { generate };
