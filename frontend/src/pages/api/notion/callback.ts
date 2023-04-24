import { NextApiRequest, NextApiResponse } from "next";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query;

  const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID;
  if (!NOTION_CLIENT_ID) {
    throw new Error(
      "NOTION_CLIENT_ID is not set in the environment variables. See .env.example file"
    );
  }
  const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
  if (!NOTION_CLIENT_SECRET) {
    throw new Error(
      "NOTION_CLIENT_SECRET is not set in the environment variables. See .env.example file"
    );
  }

  if (!process.env.BASE_URL) {
    throw new Error(
      "BASE_URL is not set in the environment variables. See .env.example file"
    );
  }

  try {
    const response = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.BASE_URL}/api/notion/callback`,
      },
      {
        auth: {
          username: NOTION_CLIENT_ID,
          password: NOTION_CLIENT_SECRET,
        },
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { access_token } = response.data;

    console.log(access_token, req.query.id);

    // TODO: Save the access token to the database or session.

    res.redirect("/"); // Redirect the user to the home page.
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while logging in.");
  }
}
