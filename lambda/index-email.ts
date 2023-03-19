import { gmail_v1 } from 'googleapis';
import {
  checkSenderSubjectInDynamoDB,
  storeSenderSubjectInDynamoDB,
} from './dynamodb';
import { getAuthenticatedOAuth2Client, getGmailClient } from './gmail-client';

async function replyToLinkedInMessages(
  gmailClient: gmail_v1.Gmail
): Promise<void> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoISODate = oneWeekAgo.toISOString().split('T')[0];
  const query = `from:linkedin.com after:${oneWeekAgoISODate}`;
  const userId = 'me';

  try {
    // List all messages from LinkedIn received within last week
    const messagesResponse = await gmailClient.users.messages.list({
      userId,
      q: query,
    });

    if (!messagesResponse.data.messages) {
      console.log('No messages found.');
      return;
    }

    const messages = messagesResponse.data.messages;

    // Iterate through the messages and send a reply to each one
    for (const message of messages) {
      const messageId = message.id;

      // Get message details
      const messageDetails = await gmailClient.users.messages.get({
        userId,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        id: messageId!,
      });

      // Get the message thread ID and subject
      const threadId = messageDetails.data.threadId;
      const subject =
        messageDetails.data.payload?.headers?.find(
          (header) => header.name === 'Subject'
        )?.value || '';
      const senderName = messageDetails.data.payload?.headers?.find(
        (header) => header.name === 'From'
      )?.value;

      if (!senderName) {
        console.warn('Sender name is missing. Skipping this message.');
        continue;
      }

      if (subject.startsWith('Message replied:')) {
        // Skip this message
        continue;
      }

      if (senderName.indexOf('inmail-hit-reply@linkedin.com') === -1) {
        // Skip this message
        continue;
      }

      // Check if the same sender name and subject has been seen before
      const existsInDynamoDB = await checkSenderSubjectInDynamoDB(
        senderName,
        subject
      );
      if (existsInDynamoDB) {
        console.log(
          `Message from ${senderName} with subject "${subject}" already processed. Skipping.`
        );
        continue;
      }

      // Create the reply email
      const reply = {
        to: messageDetails.data.payload?.headers?.find(
          (header) => header.name === 'From'
        )?.value,
        subject: `Re: ${subject}`,
        body: 'Your reply message goes here.',
      };

      // Create MIME message
      const mimeMessage = [
        'Content-Type: text/plain; charset="UTF-8"',
        `From: ${userId}`,
        `To: ${reply.to}`,
        `Subject: ${reply.subject}`,
        '',
        reply.body,
      ].join('\n');

      // Send the reply
      // await gmailClient.users.messages.send({
      //   userId,
      //   requestBody: {
      //     raw: Buffer.from(mimeMessage)
      //       .toString('base64')
      //       .replace(/\+/g, '-')
      //       .replace(/\//g, '_'),
      //     threadId,
      //   },
      // });

      console.log(
        `Send reply to message ID: ${messageId}, thread ID: ${threadId} - ${mimeMessage}`
      );

      // Store the sender name and subject in DynamoDB
      await storeSenderSubjectInDynamoDB(senderName, subject);
      console.log(
        `Stored sender name and subject in DynamoDB: ${senderName}, ${subject}`
      );
    }
  } catch (error) {
    console.error(
      'Failed to reply to LinkedIn messages:',
      JSON.stringify(error)
    );
    throw error;
  }
}

export const handler = async (event: unknown): Promise<void> => {
  console.log(JSON.stringify(event));
  const gmailClient = getGmailClient(await getAuthenticatedOAuth2Client());
  await replyToLinkedInMessages(gmailClient);
};
