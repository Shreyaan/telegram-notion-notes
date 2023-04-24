import fs from "fs";
const path = require("path");

export function deleteTempFolder() {
  try {
    const tempDir = "./temp";
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    const subdirs = fs
      .readdirSync(tempDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    subdirs.forEach((subdir) => {
      const subdirPath = path.join(tempDir, subdir);
      const stats = fs.statSync(subdirPath);
      const lastModifiedTime = stats.mtime.getTime();
      if (lastModifiedTime < cutoffTime) {
        fs.rmdirSync(subdirPath, { recursive: true });
        console.log(`Deleted directory: ${subdirPath}`);
      }
    });
  } catch (err: any) {
    console.error(`Error deleting temporary directory: ${err.message}`);
  }
}
