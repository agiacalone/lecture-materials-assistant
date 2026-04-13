const path = require("path");
const { topicSlug } = require("../lib/context");
const { addBulletList, addChrome, addPanel, createDeck } = require("../lib/pptx-helpers");

async function generate(config, options) {
  const slug = topicSlug(config);
  const filePath = path.join(options.outputDir, `${slug}_slides.pptx`);
  const deck = createDeck(`${config.lecture.topic} Slides`);

  const title = deck.addSlide();
  addChrome(title, config.lecture.topic, config.course.code);
  addPanel(title, "Summary", config.lecture.summary, 0.8, 1.4, 5.7, 2.0);
  addPanel(title, "Learning objectives", config.lecture.objectives.map((item) => `• ${item}`).join("\n"), 6.7, 1.4, 5.5, 2.4);
  addPanel(title, "Key concepts", config.lecture.keyConcepts.map((item) => `• ${item}`).join("\n"), 0.8, 3.7, 11.4, 2.5);

  const agenda = deck.addSlide();
  addChrome(agenda, "Agenda", "Framework");
  addBulletList(
    agenda,
    config.lecture.sections.map((section) => `${section.title} (${section.minutes || "TBD"} min)`),
    { y: 1.5, h: 4.8 },
  );

  config.lecture.sections.forEach((section, index) => {
    const slide = deck.addSlide();
    addChrome(slide, section.title, `Section ${index + 1}`);
    addPanel(slide, "Overview", section.overview || "Use this slide to anchor the section before expanding details.", 0.8, 1.4, 5.3, 2.1);
    addPanel(
      slide,
      "Teaching points",
      (section.points || []).map((item) => `• ${item}`).join("\n"),
      6.3,
      1.4,
      5.7,
      2.8,
    );
    addPanel(
      slide,
      "Discussion / activity",
      (section.activities || section.discussionQuestions || ["Prompt students to defend the tradeoff on this slide."]).map((item) => `• ${item}`).join("\n"),
      0.8,
      3.9,
      11.2,
      2.4,
    );
  });

  const closing = deck.addSlide();
  addChrome(closing, "Takeaways", "Wrap-up");
  addBulletList(closing, config.lecture.takeaways || config.lecture.objectives, { y: 1.6, h: 3.8 });
  addPanel(
    closing,
    "Discussion questions",
    (config.lecture.discussionQuestions || []).map((item) => `• ${item}`).join("\n"),
    0.8,
    5.0,
    11.2,
    1.5,
  );

  await deck.writeFile({ fileName: filePath });
  return filePath;
}

module.exports = { generate };
