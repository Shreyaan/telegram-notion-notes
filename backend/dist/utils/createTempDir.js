"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTmepDir = void 0;
const fs_1 = __importDefault(require("fs"));
const path = require("path");
function createTmepDir(messageId) {
    const tempDir = "./temp";
    const dir = path.join(tempDir, messageId);
    if (!fs_1.default.existsSync(tempDir)) {
        fs_1.default.mkdirSync(tempDir);
    }
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir);
    }
    return dir;
}
exports.createTmepDir = createTmepDir;
//# sourceMappingURL=createTempDir.js.map