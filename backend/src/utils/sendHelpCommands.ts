import { Context, NarrowedContext } from "telegraf";
import { Message, Update } from "typegram";

export function sendHelpCommands(
  ctx: NarrowedContext<
    Context<Update>,
    {
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }
  >
) {
  ctx.reply("Send /start to receive a greeting");
  ctx.reply("Send /keyboard to receive a message with a keyboard");
  ctx.reply("Send /quit to stop the bot");
}
