const fs = require("fs");
const path = require("path");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeText(outputDir, fileName, content) {
  ensureDir(outputDir);
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

module.exports = {
  ensureDir,
  writeText,
};
