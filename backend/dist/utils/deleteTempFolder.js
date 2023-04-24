"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTempFolder = void 0;
const fs_1 = __importDefault(require("fs"));
const path = require("path");
function deleteTempFolder() {
    try {
        const tempDir = "./temp";
        const cutoffTime = Date.now() - 60 * 1000; // 24 hours ago
        const subdirs = fs_1.default
            .readdirSync(tempDir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
        subdirs.forEach((subdir) => {
            const subdirPath = path.join(tempDir, subdir);
            const stats = fs_1.default.statSync(subdirPath);
            const lastModifiedTime = stats.mtime.getTime();
            if (lastModifiedTime < cutoffTime) {
                fs_1.default.rmdirSync(subdirPath, { recursive: true });
                console.log(`Deleted directory: ${subdirPath}`);
            }
        });
    }
    catch (err) {
        console.error(`Error deleting temporary directory: ${err.message}`);
    }
}
exports.deleteTempFolder = deleteTempFolder;
//# sourceMappingURL=deleteTempFolder.js.map