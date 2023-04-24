import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { Context, Markup, NarrowedContext, Telegraf } from "telegraf";
import { Message, Update } from "typegram";
import { message } from "telegraf/filters";
import { Configuration, OpenAIApi } from "openai";
import axios from "axios";
import fs from "fs";
const path = require("path");
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath);

const bot: Telegraf<Context<Update>> = new Telegraf(
  process.env.BOT_TOKEN as string
);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

let isTempBeingUsed = false;

const openai = new OpenAIApi(configuration);

async function generateText(inputFileName: any) {
  console.log("generating text");

  const resp = await openai.createTranscription(
    fs.createReadStream(inputFileName),
    "whisper-1"
  );
  let textToSummarize = resp.data.text;
  const completion = await openai.createChatCompletion({
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

async function audioConversion(inputFileName: string, messageId: string) {
  const outputFileName = `./temp/${messageId}/audio.mp3`;
  return new Promise((resolve, reject) => {
    ffmpeg()
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

async function saveStream(
  voiceMessageStream: { pipe: (arg0: fs.WriteStream) => void },
  messageId: string
) {
  // create temporary directory
  const tempDir = "./temp";
  const dir = path.join(tempDir, messageId);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const filePath: string = path.join(dir, "audio.ogg");
  const fileStream = fs.createWriteStream(filePath);
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
    ctx.telegram.sendMessage(
      ctx.message.chat.id,
      "Processing voice message ..."
    );
    let textToSend = await processAudioFileToText(ctx);
    ctx.telegram.sendMessage(ctx.message.chat.id, textToSend);
  } catch (error) {
    console.log(error);
    ctx.telegram.sendMessage(ctx.message.chat.id, "Something went wrong");
  }
});

bot.command("cleartemp", (ctx) => {
  try {
    const tempDir = "./temp";
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    const subdirs = fs
      .readdirSync(tempDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    subdirs.forEach((subdir) => {
      const subdirPath = path.join(tempDir, subdir);
      const stats = fs.statSync(subdirPath);
      const lastModifiedTime = stats.mtime.getTime();
      if (true) {
        fs.rmdirSync(subdirPath, { recursive: true });
        console.log(`Deleted directory: ${subdirPath}`);
      }
    });
  } catch (err: any) {
    console.error(`Error deleting temporary directory: ${err.message}`);
  }
  ctx.reply("Temp folder cleared");
});

function deleteTempFolder() {
  try {
    const tempDir = "./temp";
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    const subdirs = fs
      .readdirSync(tempDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    subdirs.forEach((subdir) => {
      const subdirPath = path.join(tempDir, subdir);
      const stats = fs.statSync(subdirPath);
      const lastModifiedTime = stats.mtime.getTime();
      if (lastModifiedTime < cutoffTime) {
        fs.rmdirSync(subdirPath, { recursive: true });
        console.log(`Deleted directory: ${subdirPath}`);
      }
    });
  } catch (err: any) {
    console.error(`Error deleting temporary directory: ${err.message}`);
  }
}

setInterval(() => {
  if (!isTempBeingUsed) {
    deleteTempFolder();
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
} else {
  bot.launch();
}

async function processAudioFileToText(
  ctx: NarrowedContext<
    Context<Update>,
    {
      message: Update.New & Update.NonChannel & Message.VoiceMessage;
      update_id: number;
    }
  >
) {
  isTempBeingUsed = true;
  let textToSend = "";

  try {
    const { href: fileUrl } = await ctx.telegram.getFileLink(
      ctx.message.voice.file_id
    );
    const { data: voiceMessageStream } = await axios(fileUrl, {
      responseType: "stream",
    });

    let messageId = `${ctx.message.message_id}${ctx.message.chat.id}${ctx.message.date}`;
    console.log(ctx.message.message_id, ctx.message.chat.id, ctx.message.date);

    const filePath = (await saveStream(
      voiceMessageStream,
      messageId
    )) as string;
    textToSend = await generateText(await audioConversion(filePath, messageId));
    //delete folder
    fs.rmdirSync(`./temp/${messageId}`, { recursive: true });
    isTempBeingUsed = false;
  } catch (error) {
    textToSend = "Something went wrong";
    isTempBeingUsed = false;
  }
  return textToSend;
}
