import { Context, NarrowedContext } from "telegraf";
import { Message, Update } from "typegram";
import axios from "axios";
import fs from "fs";
const path = require("path");
import ffmpeg from "fluent-ffmpeg";
import { isTempBeingUsed } from ".";
import { Configuration, OpenAIApi } from "openai";


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
export const openai = new OpenAIApi(configuration);

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

export async function processAudioFileToText(
  ctx: NarrowedContext<
    Context<Update>,
    {
      message: Update.New & Update.NonChannel & Message.VoiceMessage;
      update_id: number;
    }
  >
) {
  isTempBeingUsed.inuse = true;
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
    isTempBeingUsed.inuse = false;
  } catch (error) {
    textToSend = "Something went wrong";
    isTempBeingUsed.inuse = false;
  }
  return textToSend;
}
