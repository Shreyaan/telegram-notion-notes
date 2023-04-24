import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { Context, Markup, Telegraf } from "telegraf";
import { Update } from "typegram";
import { message } from "telegraf/filters";
import fs from "fs";
const path = require("path");
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
ffmpeg.setFfmpegPath(ffmpegPath);
import { processAudioFileToText } from "./processAudioFileToText";
import { deleteTempFolder } from "./utils/deleteTempFolder";
import { sendHelpCommands } from "./utils/sendHelpCommands";


const bot: Telegraf<Context<Update>> = new Telegraf(
  process.env.BOT_TOKEN as string
);

export let isTempBeingUsed = {
  inuse: false,
};

bot.start((ctx) => {
  ctx.reply("Hello " + ctx.from.first_name + "! Send /help to get started");
});
bot.help((ctx) => {
  sendHelpCommands(ctx);
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

setInterval(() => {
  if (!isTempBeingUsed.inuse) {
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
