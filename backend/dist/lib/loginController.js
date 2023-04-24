"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = void 0;
const User_1 = __importDefault(require("../models/User"));
function loginController(userid, ctx) {
    User_1.default.findOne({ telegramId: userid })
        .then(async (user) => {
        if (user) {
        }
        else {
            const user = new User_1.default({
                telegramId: userid,
            });
            await user.save();
        }
    })
        .catch((error) => {
        console.error(error);
    });
    ctx.replyWithHTML(`Please login with Notion using this button to use this bot.`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Login to Notion",
                        url: `https://telegram-notes.vercel.app/login?tgId=${userid}`,
                    },
                ],
            ],
        },
    });
}
exports.loginController = loginController;
//# sourceMappingURL=loginController.js.map