"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendHelpCommands = void 0;
function sendHelpCommands(ctx) {
    // you can send voice note to get it transcribed and summarized
    ctx.reply(`You can send a voice note to get it transcribed and summarized.
    \n
to use this bot you need to login using /login command.

/selectNotionDb command to select a Notion database to save your notes to.`);
}
exports.sendHelpCommands = sendHelpCommands;
//# sourceMappingURL=sendHelpCommands.js.map