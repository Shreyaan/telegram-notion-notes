import fs from "fs";
const path = require("path");

export function createTmepDir(messageId: string) {
  const tempDir = "./temp";
  const dir = path.join(tempDir, messageId);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
}
