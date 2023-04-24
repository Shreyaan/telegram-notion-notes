import { type NextApiRequest, type NextApiResponse } from 'next';
import qs from 'qs';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()


export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID;
    if (!NOTION_CLIENT_ID) {
        throw new Error(
            'NOTION_CLIENT_ID is not set in the environment variables. See .env.example file'
        );
    }
    if (!process.env.BASE_URL) {
        throw new Error(
            'BASE_URL is not set in the environment variables. See .env.example file'
        );
    }
  const redirectUri = `${process.env.BASE_URL}/api/notion/callback`;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const queryParams = qs.stringify({
    client_id: NOTION_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'all',
  });

  res.redirect(`https://api.notion.com/v1/oauth/authorize?${queryParams}`);
}