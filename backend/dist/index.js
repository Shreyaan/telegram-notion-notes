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
const fs_1 = __importDefault(require("fs"));
const path = require("path");
const processAudioFileToText_1 = require("./lib/processAudioFileToText");
const createTempDir_1 = require("./utils/createTempDir");
const generateMessageidforFolderName_1 = require("./utils/generateMessageidforFolderName");
const deleteTempFolder_1 = require("./lib/deleteTempFolder");
const sendHelpCommands_1 = require("./utils/sendHelpCommands");
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("./models/User"));
const downloadFile_1 = require("./lib/downloadFile");
const client_1 = require("@notionhq/client");
const generateOutputForMsg_1 = require("./utils/generateOutputForMsg");
const saveToNotion_1 = require("./lib/saveToNotion");
const loginController_1 = require("./lib/loginController");
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
    let username = ctx.from.username || ctx.from.first_name;
    console.log(userid, username);
    if (userid === undefined) {
        ctx.reply("Something went wrong");
        return;
    }
    (0, loginController_1.loginController)(userid, ctx);
});
bot.on("audio", async (ctx) => {
    try {
        let userid = ctx.from.id;
        let messageid = ctx.message.message_id;
        const file = await ctx.telegram.getFile(ctx.message.audio.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
        const fileExtension = path.extname(file.file_path);
        //if mp3/wav/m4a then process
        if (fileExtension === ".mp3" ||
            fileExtension === ".wav" ||
            fileExtension === ".m4a") {
            User_1.default.findOne({ telegramId: userid })
                .then(async (user) => {
                if (user?.token) {
                    if ((user.isPremium === false && user.numberOfUses <= 5) ||
                        user.isPremium === true) {
                        ctx.telegram.sendMessage(ctx.message.chat.id, "Processing audio file ...");
                        const dir = (0, createTempDir_1.createTmepDir)((0, generateMessageidforFolderName_1.generateMessageidforFOlderName)(ctx));
                        await (0, downloadFile_1.downloadFile)(fileUrl, dir + "/audio" + fileExtension);
                        let textToSend = await (0, processAudioFileToText_1.generateText)(dir + "/audio" + fileExtension);
                        ctx.telegram.sendMessage(ctx.message.chat.id, (0, generateOutputForMsg_1.generateOutputForMsg)(textToSend));
                        if (user.isPremium === false) {
                            user.numberOfUses += 1;
                            await user.save();
                        }
                        fs_1.default.rmdirSync(dir, { recursive: true });
                    }
                    if (user.isPremium === false && user.numberOfUses > 5) {
                        ctx.reply("You have reached your limit of 5 free uses. Please upgrade to premium to use this bot.");
                    }
                }
                else {
                    ctx.reply("Please login to use this bot. Send /login to login.");
                }
            })
                .catch((error) => {
                console.error(error);
            });
        }
        else {
            ctx.reply("Please send an audio file in mp3, wav or m4a format");
            return;
        }
    }
    catch (error) {
        console.log(error);
        ctx.telegram.sendMessage(ctx.message.chat.id, "Something went wrong");
    }
});
bot.on("voice", async (ctx) => {
    try {
        let userid = ctx.from.id;
        User_1.default.findOne({ telegramId: userid })
            .then(async (user) => {
            if (user?.token) {
                if ((user.isPremium === false && user.numberOfUses <= 5) ||
                    user.isPremium === true) {
                    ctx.telegram.sendMessage(ctx.message.chat.id, "Processing voice message ...");
                    let textToSend = await (0, processAudioFileToText_1.processAudioFileToText)(ctx);
                    ctx.telegram.sendMessage(ctx.message.chat.id, (0, generateOutputForMsg_1.generateOutputForMsg)(textToSend));
                    //save to notion
                    if (user.pageId === undefined) {
                        return ctx.reply("Save to notion failed because you have not selected a Notion database yet. Please select a database using /selectNotionDb command");
                    }
                    else if (typeof user.pageId === "string") {
                        (0, saveToNotion_1.saveToNotion)(user, textToSend, ctx);
                    }
                    user.numberOfUses += 1;
                    await user.save();
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
bot.command("selectNotionDb", async (ctx) => {
    let userid = ctx.from.id;
    User_1.default.findOne({ telegramId: userid })
        .then(async (user) => {
        if (user?.token) {
            const notion = new client_1.Client({ auth: user.token });
            (async () => {
                const response = await notion.search({
                    filter: {
                        value: "database",
                        property: "object",
                    },
                    sort: {
                        direction: "ascending",
                        timestamp: "last_edited_time",
                    },
                });
                ctx.reply("Select a database to use");
                console.log(response);
                response.results.forEach((page) => {
                    (async () => {
                        const databaseId = page.id;
                        const response = (await notion.databases.retrieve({
                            database_id: databaseId,
                        }));
                        console.log(response);
                        ctx.replyWithHTML(`<b>${response.title[0].plain_text}</b>`, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "Select",
                                            callback_data: `selectDb:${databaseId}`,
                                        },
                                    ],
                                ],
                            },
                        });
                    })();
                });
            })();
        }
        else {
            ctx.reply("Please login first using /login command");
        }
    })
        .catch((error) => {
        console.error(error);
    });
});
bot.action(/^selectDb:(.+)$/, async (ctx) => {
    const databaseId = ctx.match[1];
    const userId = ctx.from?.id;
    // TODO: Save the selected database ID for the user
    try {
        User_1.default.findOne({ telegramId: userId }).then(async (user) => {
            if (user?.token) {
                user.pageId = databaseId;
                await user.save();
            }
        });
        await ctx.reply(`You selected database ${databaseId}`);
    }
    catch (error) {
        console.log(error);
        ctx.reply("Something went wrong");
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