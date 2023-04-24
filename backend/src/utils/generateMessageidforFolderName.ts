export function generateMessageidforFOlderName(ctx: any) {
  let messageId = `${ctx.message.message_id}${ctx.message.chat.id}${ctx.message.date}`;
  console.log(ctx.message.message_id, ctx.message.chat.id, ctx.message.date);
  return messageId;
}
