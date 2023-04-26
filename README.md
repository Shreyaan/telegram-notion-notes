# Telegram Notion Notes

## Overview

Telegram Notion Notes is a Node.js application that allows you to easily transcribe and summarize voice notes sent to a Telegram bot, and save them to a Notion database of your choice. The application uses MongoDB to store user information and Notion API for database operations. The transcription and summarization of the voice notes are powered by OpenAI's Whisper API and ChatGPT respectively.

## Technologies Used

- Node.js
- MongoDB
- Telegram API
- Notion API
- Whisper API
- ChatGPT
- Next.js
- TypeScript

## Features

The main features of Telegram Notion Notes are:

- User authentication using the `/login` command
- Notion database selection using the `/selectnotiondb` command
- Voice note transcription and summarization
- Saving transcribed and summarized notes to a Notion database
- Next.js frontend for a better user experience

## Usage

To use Telegram Notion Notes, follow these steps:

1. Start a chat with the Telegram bot by clicking on this [link](t.me/notion_notes2_bot).
2. Use the `/login` command to create a new user in MongoDB and get a link to the Next.js webpage.
3. Use the webpage to authorize access to your Notion account and select the database where you want to save your notes.
4. Use the `/selectnotiondb` command to fetch the list of databases that you've authorized access to and select the one you want to use.
5. Send a voice note to the bot, and it will automatically transcribe and summarize it for you.
6. The bot will then send you the transcribed and summarized notes on Telegram, and also save them to the selected Notion database.

## Contributing

If you want to contribute to Telegram Notion Notes, feel free to submit a pull request or open an issue. We welcome contributions of all kinds, including bug fixes, new features, and documentation improvements.

## Conclusion

Thank you for your interest in Telegram Notion Notes! We hope you find it useful in your day-to-day life. If you have any questions, comments, or feedback, please don't hesitate to get in touch.
