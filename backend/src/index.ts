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
import { generateText, processAudioFileToText } from "./processAudioFileToText";
import { createTmepDir } from "./utils/createTempDir";
import { generateMessageidforFOlderName } from "./utils/generateMessageidforFolderName";
import { deleteTempFolder } from "./utils/deleteTempFolder";
import { sendHelpCommands } from "./utils/sendHelpCommands";
import mongoose from "mongoose";
import User from "./models/User";
import { downloadFile } from "./utils/downloadFile";
import { Client } from "@notionhq/client";

interface NotionDatabase {
  object: 'database';
  id: string;
  cover: null;
  icon: null;
  created_time: string;
  created_by: {
    object: 'user';
    id: string;
  };
  last_edited_by: {
    object: 'user';
    id: string;
  };
  last_edited_time: string;
  title: [
    {
      type: 'text';
      text: {
        content: string;
      };
      annotations: {
        [key: string]: boolean;
      };
      plain_text: string;
      href: null;
    }
  ];
  description: [];
  is_inline: false;
  properties: {
    [key: string]: {
      id: string;
      name: string;
      type: string;
      [key: string]: any;
    };
  };
  parent: {
    type: 'workspace';
    workspace: true;
  };
  url: string;
  archived: boolean;
}

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
  console.log(userid, username);

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
    `Please login with Notion using this button to use this bot.`,
    {
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
    }
  );
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
              ctx.telegram.sendMessage(ctx.message.chat.id, textToSend);
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
            ctx.telegram.sendMessage(ctx.message.chat.id, textToSend);
            
            if (user.isPremium === false) {
              user.numberOfUses += 1;
              await user.save();
            }
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

bot.command("selectNotionDb", async (ctx) => {
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
              const response  = await notion.databases.retrieve({
                database_id: databaseId,
              }) as unknown as NotionDatabase
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
  const userId = ctx.from?.id

  // TODO: Save the selected database ID for the user

try {
    User.findOne({ telegramId: userId })
      .then(async (user) => {
        if (user?.token) {
          user.pageId = databaseId
          await user.save()
        }
      })
  
    await ctx.reply(`You selected database ${databaseId}`);
} catch (error) {
    console.log(error);
    ctx.reply("Something went wrong")
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

