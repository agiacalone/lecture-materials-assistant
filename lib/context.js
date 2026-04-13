const fs = require("fs");
const path = require("path");

function parseCliArgs(argv) {
  const args = {
    artifacts: [],
    configPath: "",
    outputDir: "",
    help: false,
    all: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--config") {
      args.configPath = argv[index + 1] || "";
      index += 1;
    } else if (token === "--output") {
      args.outputDir = argv[index + 1] || "";
      index += 1;
    } else if (token === "--artifact") {
      const artifact = argv[index + 1];
      if (!artifact) {
        throw new Error("Missing artifact name after --artifact.");
      }
      args.artifacts.push(artifact);
      index += 1;
    } else if (token === "--all") {
      args.all = true;
    } else if (token === "--help" || token === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument "${token}". Use --help for usage.`);
    }
  }

  return args;
}

function loadConfig(configPath) {
  const resolved = path.resolve(configPath);
  const raw = fs.readFileSync(resolved, "utf8");
  return JSON.parse(raw);
}

function validateConfig(config) {
  const requiredTopLevel = ["course", "lecture"];
  for (const key of requiredTopLevel) {
    if (!config[key]) {
      throw new Error(`Config is missing "${key}".`);
    }
  }

  const requiredCourse = ["code", "name", "studentLevel", "lectureLengthMinutes", "assessmentFormat"];
  for (const key of requiredCourse) {
    if (!config.course[key]) {
      throw new Error(`Config course is missing "${key}".`);
    }
  }

  const requiredLecture = ["topic", "summary", "objectives", "keyConcepts", "sections"];
  for (const key of requiredLecture) {
    if (!config.lecture[key]) {
      throw new Error(`Config lecture is missing "${key}".`);
    }
  }

  if (!Array.isArray(config.lecture.sections) || config.lecture.sections.length === 0) {
    throw new Error("Config lecture.sections must contain at least one section.");
  }
}

function slugifyTopic(topic) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function topicSlug(config) {
  return config.lecture.slug || slugifyTopic(config.lecture.topic);
}

module.exports = {
  loadConfig,
  parseCliArgs,
  slugifyTopic,
  topicSlug,
  validateConfig,
};
