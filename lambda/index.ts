import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getOAuth2Client } from './gmailClient';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<unknown> => {
  const { code } = event.queryStringParameters || {};

  if (!code) {
    return getAuthorizationUrl();
  }

  try {
    const oAuth2Client = await getOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    return { statusCode: 200, body: 'Authenticated successfully!' };
  } catch (error) {
    console.error('Error while getting tokens:', error);
    return { statusCode: 500, body: 'Authentication failed.' };
  }
};

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
];

async function getAuthorizationUrl(): Promise<APIGatewayProxyResult> {
  const oAuth2Client = await getOAuth2Client();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  return {
    statusCode: 302,
    headers: {
      Location: authUrl,
    },
    body: '',
  };
}
