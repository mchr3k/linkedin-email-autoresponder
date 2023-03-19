import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<unknown> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  return { statusCode: 200, body: 'Hello from Lambda!' };
};
