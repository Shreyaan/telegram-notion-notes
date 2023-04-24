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
  // you can send voice note to get it transcribed and summarized
  ctx.reply(
    `You can send a voice note to get it transcribed and summarized.
    \n
to use this bot you need to login using /login command.

/selectNotionDb command to select a Notion database to save your notes to.`
  );
}
