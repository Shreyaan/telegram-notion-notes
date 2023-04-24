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
import mongoose from "mongoose";
import User from "./models/User";

if (process.env.MONGODB_URI === undefined) {
  throw new Error("MONGODB_URI not defined");
}
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB: ", err.message);
  });

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

//login
bot.command("login", async (ctx) => {
  let userid = ctx.from.id;
  let username = ctx.from.username;

  if (userid === undefined || username === undefined) {
    ctx.reply("Something went wrong");
    return;
  }
  //check if user exists
  // Find a user by their email
  User.findOne({ telegramId: userid })
    .then(async (user) => {
      if (user) {
        
      } else {
        const user = new User({
          telegramId: userid,
        });
        await user.save();
      }
    })
    .catch((error) => {
      console.error(error);
    });

  ctx.replyWithHTML(
    `Please <a href="https://anosher.com/${userid}">login with Notion</a> to use this bot.`
  );
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
  if (!isTempBeingUsed.inuse) {
    deleteTempFolder();
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
