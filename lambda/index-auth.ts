import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { updateOAuthTokens, getAuthorizationUrl } from './gmail-client';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  const { code } = event.queryStringParameters || {};
  if (code) {
    const tokenUpdateDate = await updateOAuthTokens(code);
    return {
      statusCode: 200,
      body: `Authenticated successfully! - ${tokenUpdateDate.toISOString()}`,
    };
  } else {
    console.log('Redirecting to auth URL...');
    return {
      statusCode: 302,
      headers: {
        Location: await getAuthorizationUrl(),
      },
      body: '',
    };
  }
};
