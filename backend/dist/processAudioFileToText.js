"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAudioFileToText = exports.openai = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path = require("path");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const _1 = require(".");
const openai_1 = require("openai");
const configuration = new openai_1.Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
exports.openai = new openai_1.OpenAIApi(configuration);
async function generateText(inputFileName) {
    console.log("generating text");
    const resp = await exports.openai.createTranscription(fs_1.default.createReadStream(inputFileName), "whisper-1");
    let textToSummarize = resp.data.text;
    const completion = await exports.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            {
                role: "user",
                content: `please summarize this text and give it in bullet points \n ${textToSummarize},`,
            },
        ],
    });
    const summary = completion.data.choices[0].message?.content;
    console.log(textToSummarize);
    return `${summary}
  
transcript:
${textToSummarize}


  `;
}
async function audioConversion(inputFileName, messageId) {
    const outputFileName = `./temp/${messageId}/audio.mp3`;
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)()
            .input(inputFileName)
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
async function saveStream(voiceMessageStream, messageId) {
    // create temporary directory
    const tempDir = "./temp";
    const dir = path.join(tempDir, messageId);
    if (!fs_1.default.existsSync(tempDir)) {
        fs_1.default.mkdirSync(tempDir);
    }
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir);
    }
    const filePath = path.join(dir, "audio.ogg");
    const fileStream = fs_1.default.createWriteStream(filePath);
    voiceMessageStream.pipe(fileStream);
    return new Promise((resolve, reject) => {
        fileStream.on("finish", () => {
            console.log("File saved successfully");
            resolve(filePath);
        });
        fileStream.on("error", (err) => {
            console.error(`Error saving file: ${err.message}`);
            reject("error");
        });
    });
}
async function processAudioFileToText(ctx) {
    _1.isTempBeingUsed.inuse = true;
    let textToSend = "";
    try {
        const { href: fileUrl } = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const { data: voiceMessageStream } = await (0, axios_1.default)(fileUrl, {
            responseType: "stream",
        });
        let messageId = `${ctx.message.message_id}${ctx.message.chat.id}${ctx.message.date}`;
        console.log(ctx.message.message_id, ctx.message.chat.id, ctx.message.date);
        const filePath = (await saveStream(voiceMessageStream, messageId));
        textToSend = await generateText(await audioConversion(filePath, messageId));
        //delete folder
        fs_1.default.rmdirSync(`./temp/${messageId}`, { recursive: true });
        _1.isTempBeingUsed.inuse = false;
    }
    catch (error) {
        textToSend = "Something went wrong";
        _1.isTempBeingUsed.inuse = false;
    }
    return textToSend;
}
exports.processAudioFileToText = processAudioFileToText;
//# sourceMappingURL=processAudioFileToText.js.map