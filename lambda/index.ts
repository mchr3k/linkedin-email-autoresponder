import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  getAuthenticatedOAuth2Client,
  getAuthorizationUrl,
  getGmailClient,
} from './gmail-client';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  const { code } = event.queryStringParameters || {};
  const authenticatedOAuth2Client = await getAuthenticatedOAuth2Client(code);
  if (!authenticatedOAuth2Client) {
    console.log('Redirecting to auth URL...');
    return {
      statusCode: 302,
      headers: {
        Location: await getAuthorizationUrl(),
      },
      body: '',
    };
  }
  const gmailClient = getGmailClient(authenticatedOAuth2Client);
  console.log(gmailClient);

  return { statusCode: 200, body: 'Authenticated successfully!' };
};
