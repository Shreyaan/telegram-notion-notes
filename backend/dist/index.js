"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTempBeingUsed = void 0;
const dotenv = __importStar(require("dotenv")); // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
const telegraf_1 = require("telegraf");
const path = require("path");
const ffmpeg_1 = require("@ffmpeg-installer/ffmpeg");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.path);
const processAudioFileToText_1 = require("./processAudioFileToText");
const deleteTempFolder_1 = require("./utils/deleteTempFolder");
const sendHelpCommands_1 = require("./utils/sendHelpCommands");
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("./models/User"));
if (process.env.MONGODB_URI === undefined) {
    throw new Error("MONGODB_URI not defined");
}
mongoose_1.default
    .connect(process.env.MONGODB_URI, {})
    .then(() => {
    console.log("Connected to MongoDB");
})
    .catch((err) => {
    console.log("Error connecting to MongoDB: ", err.message);
});
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
exports.isTempBeingUsed = {
    inuse: false,
};
bot.start((ctx) => {
    ctx.reply("Hello " + ctx.from.first_name + "! Send /help to get started");
});
bot.help((ctx) => {
    (0, sendHelpCommands_1.sendHelpCommands)(ctx);
});
//login
bot.command("login", async (ctx) => {
    let userid = ctx.from.id;
    let username = ctx.from.username;
    console.log(userid, username);
    if (userid === undefined || username === undefined) {
        ctx.reply("Something went wrong");
        return;
    }
    //check if user exists
    // Find a user by their email
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
    // ctx.replyWithHTML(
    //   `Please <a href="https://anosher.com/${userid}">login with Notion</a> to use this bot.`
    // );
    ctx.replyWithHTML(`looged in as ${username}.`);
});
bot.on("voice", async (ctx) => {
    try {
        let userid = ctx.from.id;
        User_1.default.findOne({ telegramId: userid })
            .then(async (user) => {
            if (user) {
                if ((user.isPremium === false && user.numberOfUses <= 5) ||
                    user.isPremium === true) {
                    ctx.telegram.sendMessage(ctx.message.chat.id, "Processing voice message ...");
                    let textToSend = await (0, processAudioFileToText_1.processAudioFileToText)(ctx);
                    ctx.telegram.sendMessage(ctx.message.chat.id, textToSend);
                    if (user.isPremium === false) {
                        user.numberOfUses += 1;
                        await user.save();
                    }
                }
                if (user.isPremium === false && user.numberOfUses > 5) {
                    ctx.reply("You have reached your limit of 5 free uses. Please upgrade to premium to use this bot.");
                }
            }
            else {
                ctx.reply("Please login first using /login command");
            }
        })
            .catch((error) => {
            console.error(error);
        });
    }
    catch (error) {
        console.log(error);
        ctx.telegram.sendMessage(ctx.message.chat.id, "Something went wrong");
    }
});
bot.command("cleartemp", (ctx) => {
    if (!exports.isTempBeingUsed.inuse) {
        (0, deleteTempFolder_1.deleteTempFolder)();
    }
    ctx.reply("Temp folder cleared");
});
setInterval(() => {
    if (!exports.isTempBeingUsed.inuse) {
        (0, deleteTempFolder_1.deleteTempFolder)();
    }
}, 1000 * 60 * 60);
let domain = process.env.DOMAIN;
let port = process.env.PORT;
if (domain === undefined) {
    domain = "localhost";
}
if (port === undefined) {
    port = "3000";
}
if (process.env.NODE_ENV === "production") {
    console.log("Starting bot in webhook mode");
    bot.launch({
        webhook: {
            domain: domain,
            port: parseInt(port),
        },
    });
}
else {
    bot.launch();
}
//# sourceMappingURL=index.js.map