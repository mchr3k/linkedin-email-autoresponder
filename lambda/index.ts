export const handler = async (event: unknown): Promise<unknown> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  return { statusCode: 200, body: 'Hello from Lambda!' };
};
