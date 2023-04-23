import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { Context, Markup, Telegraf } from "telegraf";
import { Update } from "typegram";
import { message } from "telegraf/filters";
import { Configuration, OpenAIApi } from "openai";
import axios from "axios";
import fs from "fs";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath);

const bot: Telegraf<Context<Update>> = new Telegraf(
  process.env.BOT_TOKEN as string
);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function generateText(inputFileName: any) {
  const resp = await openai.createTranscription(
    fs.createReadStream(inputFileName),
    "whisper-1"
  );
  return resp.data.text;
}

async function audioConversion(inputFileName: string, messageId: string) {
  const outputFileName = `./${messageId}/audio.mp3`;
  return new Promise((resolve, reject) => {
    ffmpeg(inputFileName)
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

function saveStream(
  voiceMessageStream: { pipe: (arg0: fs.WriteStream) => void },
  messageId: string
) {
  // create folder with messageId name
  const dir = `./${messageId}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const filePath = `${dir}/audio.ogg`;
  const fileStream = fs.createWriteStream(filePath);
  voiceMessageStream.pipe(fileStream);
  return filePath;
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
    const { href: fileUrl } = await ctx.telegram.getFileLink(
      ctx.message.voice.file_id
    );
    const { data: voiceMessageStream } = await axios(fileUrl, {
      responseType: "stream",
    });

    let messageId = `${ctx.message.message_id}${ctx.message.chat.id}${ctx.message.date}`;
    console.log(ctx.message.message_id, ctx.message.chat.id, ctx.message.date);

    const filePath = saveStream(voiceMessageStream, messageId);

    let text = await generateText(await audioConversion(filePath, messageId));
    //delete folder
    fs.rmdirSync(`./${messageId}`, { recursive: true });
    ctx.telegram.sendMessage(ctx.message.chat.id, text);
  } catch (error) {
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
} else {
  bot.launch();
}
