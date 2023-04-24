import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";
import fs from "fs";
const path = require("path");
import {
  generateText,
  processAudioFileToText,
} from "./lib/processAudioFileToText";
import { createTmepDir } from "./utils/createTempDir";
import { generateMessageidforFOlderName } from "./utils/generateMessageidforFolderName";
import { deleteTempFolder } from "./lib/deleteTempFolder";
import { sendHelpCommands } from "./utils/sendHelpCommands";
import mongoose from "mongoose";
import User from "./models/User";
import { downloadFile } from "./lib/downloadFile";
import { Client } from "@notionhq/client";
import { generateOutputForMsg } from "./utils/generateOutputForMsg";
import { saveToNotion } from "./lib/saveToNotion";
import { NotionDatabase } from "./index.d";
import { loginController } from "./lib/loginController";

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
  let username = ctx.from.username || ctx.from.first_name;
  console.log(userid, username);

  if (userid === undefined) {
    ctx.reply("Something went wrong");
    return;
  }
  loginController(userid, ctx);
});

bot.on("audio", async (ctx) => {
  try {
    let userid = ctx.from.id;
    let messageid = ctx.message.message_id;
    const file = await ctx.telegram.getFile(ctx.message.audio.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
    const fileExtension = path.extname(file.file_path);
    //if mp3/wav/m4a then process
    if (
      fileExtension === ".mp3" ||
      fileExtension === ".wav" ||
      fileExtension === ".m4a"
    ) {
      User.findOne({ telegramId: userid })
        .then(async (user) => {
          if (user?.token) {
            if (
              (user.isPremium === false && user.numberOfUses <= 5) ||
              user.isPremium === true
            ) {
              ctx.telegram.sendMessage(
                ctx.message.chat.id,
                "Processing audio file ..."
              );

              const dir = createTmepDir(generateMessageidforFOlderName(ctx));
              await downloadFile(fileUrl, dir + "/audio" + fileExtension);

              let textToSend = await generateText(
                dir + "/audio" + fileExtension
              );
              ctx.telegram.sendMessage(
                ctx.message.chat.id,
                generateOutputForMsg(textToSend)
              );
              if (user.isPremium === false) {
                user.numberOfUses += 1;
                await user.save();
              }
              fs.rmdirSync(dir, { recursive: true });
            }

            if (user.isPremium === false && user.numberOfUses > 5) {
              ctx.reply(
                "You have reached your limit of 5 free uses. Please upgrade to premium to use this bot."
              );
            }
          } else {
            ctx.reply("Please login to use this bot. Send /login to login.");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      ctx.reply("Please send an audio file in mp3, wav or m4a format");
      return;
    }
  } catch (error) {
    console.log(error);
    ctx.telegram.sendMessage(ctx.message.chat.id, "Something went wrong");
  }
});

bot.on("voice", async (ctx) => {
  try {
    let userid = ctx.from.id;
    User.findOne({ telegramId: userid })
      .then(async (user) => {
        if (user?.token) {
          if (
            (user.isPremium === false && user.numberOfUses <= 5) ||
            user.isPremium === true
          ) {
            ctx.telegram.sendMessage(
              ctx.message.chat.id,
              "Processing voice message ..."
            );
            let textToSend = await processAudioFileToText(ctx);
            ctx.telegram.sendMessage(
              ctx.message.chat.id,
              generateOutputForMsg(textToSend)
            );
            //save to notion
            if (user.pageId === undefined) {
              return ctx.reply(
                "Save to notion failed because you have not selected a Notion database yet. Please select a database using /selectnotiondb command"
              );
            } else if (typeof user.pageId === "string") {
              saveToNotion(user, textToSend, ctx);
            }

            user.numberOfUses += 1;
            await user.save();
          }

          if (user.isPremium === false && user.numberOfUses > 5) {
            ctx.reply(
              "You have reached your limit of 5 free uses. Please upgrade to premium to use this bot."
            );
          }
        } else {
          ctx.reply("Please login first using /login command");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {
    console.log(error);
    ctx.telegram.sendMessage(ctx.message.chat.id, "Something went wrong");
  }
});

bot.command("selectnotiondb", async (ctx) => {
  let userid = ctx.from.id;
  User.findOne({ telegramId: userid })
    .then(async (user) => {
      if (user?.token) {
        const notion = new Client({ auth: user.token });

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
              })) as unknown as NotionDatabase;
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
      } else {
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
    User.findOne({ telegramId: userId }).then(async (user) => {
      if (user?.token) {
        user.pageId = databaseId;
        await user.save();
      }
    });

    await ctx.reply(`You selected database ${databaseId}`);
  } catch (error) {
    console.log(error);
    ctx.reply("Something went wrong");
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
