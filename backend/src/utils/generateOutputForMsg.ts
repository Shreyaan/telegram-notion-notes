export function generateOutputForMsg(textToSend: {
  summary: string;
  textToSummarize: string;
}) {
  return `${textToSend.summary}
            
transcript:
${textToSend.textToSummarize}`;
}
