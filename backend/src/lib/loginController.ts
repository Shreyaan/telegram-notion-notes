import { Context, NarrowedContext } from "telegraf";
import { Message, Update } from "typegram";
import User from "../models/User";

export function loginController(
  userid: number,
  ctx: NarrowedContext<
    Context<Update>,
    {
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }
  >
) {
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
    `Please login with Notion using this button to use this bot. After logging in, please use /selectnotiondb command to select a Notion database to save your notes to.`,
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
}
