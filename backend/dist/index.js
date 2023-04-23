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
const dotenv = __importStar(require("dotenv")); // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
const telegraf_1 = require("telegraf");
const openai_1 = require("openai");
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const ffmpeg_1 = require("@ffmpeg-installer/ffmpeg");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.path);
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
const configuration = new openai_1.Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new openai_1.OpenAIApi(configuration);
async function generateText(inputFileName) {
    const resp = await openai.createTranscription(fs_1.default.createReadStream(inputFileName), "whisper-1");
    return resp.data.text;
}
async function audioConversion(inputFileName) {
    const outputFileName = "./output.mp3";
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputFileName)
            .format("mp3")
            .output(outputFileName)
            .on("end", () => {
            console.log("Conversion complete");
            resolve(outputFileName);
        })
            .on("error", (err) => {
            console.error(`Error converting file: ${err.message}`);
            reject("error");
        })
            .run();
    });
}
bot.start((ctx) => {
    ctx.reply("Hello " + ctx.from.first_name + "!");
});
bot.help((ctx) => {
    ctx.reply("Send /start to receive a greeting");
    ctx.reply("Send /keyboard to receive a message with a keyboard");
    ctx.reply("Send /quit to stop the bot");
});
bot.on("voice", async (ctx) => {
    try {
        ctx.telegram.sendMessage(ctx.message.chat.id, "Processing voice message ...");
        const { href: fileUrl } = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const { data: voiceMessageStream } = await (0, axios_1.default)(fileUrl, {
            responseType: "stream",
        });
        const filePath = "audio.ogg"; // Change the file path and name as you like
        const fileStream = fs_1.default.createWriteStream(filePath);
        voiceMessageStream.pipe(fileStream);
        let text = await generateText(await audioConversion(filePath));
        ctx.telegram.sendMessage(ctx.message.chat.id, text);
    }
    catch (error) {
        console.log(error);
        ctx.telegram.sendMessage(ctx.message.chat.id, "Something went wrong");
    }
});
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