import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';

const dynamoDBClient = new DynamoDBClient({});
const tableName = 'LinkedInReplyTable';

export async function checkSenderSubjectInDynamoDB(
  senderName: string,
  subject: string
): Promise<boolean> {
  try {
    const getItemCommand = new GetItemCommand({
      TableName: tableName,
      Key: {
        senderName: { S: senderName },
        subject: { S: subject },
      },
    });

    const response = await dynamoDBClient.send(getItemCommand);
    return !!response.Item;
  } catch (error) {
    console.error(
      'Error checking sender and subject in DynamoDB:',
      JSON.stringify(error)
    );
    throw error;
  }
}

export async function storeSenderSubjectInDynamoDB(
  senderName: string,
  subject: string
): Promise<void> {
  try {
    const putItemCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        senderName: { S: senderName },
        subject: { S: subject },
        createdAt: { S: new Date().toISOString() },
      },
    });

    await dynamoDBClient.send(putItemCommand);
  } catch (error) {
    console.error(
      'Error storing sender and subject in DynamoDB:',
      JSON.stringify(error)
    );
    throw error;
  }
}
