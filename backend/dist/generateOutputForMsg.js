"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOutputForMsg = void 0;
function generateOutputForMsg(textToSend) {
    return `${textToSend.summary}
            
transcript:
${textToSend.textToSummarize}`;
}
exports.generateOutputForMsg = generateOutputForMsg;
//# sourceMappingURL=generateOutputForMsg.js.map