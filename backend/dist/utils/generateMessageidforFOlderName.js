"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMessageidforFOlderName = void 0;
function generateMessageidforFOlderName(ctx) {
    let messageId = `${ctx.message.message_id}${ctx.message.chat.id}${ctx.message.date}`;
    console.log(ctx.message.message_id, ctx.message.chat.id, ctx.message.date);
    return messageId;
}
exports.generateMessageidforFOlderName = generateMessageidforFOlderName;
//# sourceMappingURL=generateMessageidforFolderName.js.map