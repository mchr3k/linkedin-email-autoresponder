import { gmail_v1 } from 'googleapis';
import {
  checkSenderSubjectInDynamoDB,
  storeSenderSubjectInDynamoDB,
} from './dynamodb';
import { getAuthenticatedOAuth2Client, getGmailClient } from './gmail-client';
import * as base64 from 'base64-url';
import { getSecretValue } from './secrets-manager';

async function replyToLinkedInMessages(
  gmailClient: gmail_v1.Gmail
): Promise<void> {
  const autoreplyMessage = await getSecretValue('LinkedinAutoreplyMessage');
  console.log(`Loaded autoreply message: ${autoreplyMessage}`);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoISODate = oneWeekAgo.toISOString().split('T')[0];
  const userId = 'me';

  try {
    // List all messages from LinkedIn received within last week
    const messagesResponse = await gmailClient.users.messages.list({
      userId,
      q: `from:linkedin.com after:${oneWeekAgoISODate}`,
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

      // Create MIME message
      const mimeMessage = [
        'Content-Type: text/plain; charset="UTF-8"',
        `From: ${userId}`,
        `To: ${senderName}`,
        `Subject: Re: ${subject}`,
        '',
        autoreplyMessage,
      ].join('\n');

      const safeMimeMessage = base64.escape(base64.encode(mimeMessage));
      console.log(`safeMimeMessage: ${safeMimeMessage}`);
      await gmailClient.users.messages.send({
        userId,
        requestBody: {
          raw: safeMimeMessage,
          threadId,
        },
      });

      console.log(
        `Sent reply to message ID: ${messageId}, thread ID: ${threadId} - ${mimeMessage}`
      );

      // Store the sender name and subject in DynamoDB
      await storeSenderSubjectInDynamoDB(senderName, subject);
      console.log(
        `Stored sender name and subject in DynamoDB: ${senderName}, ${subject}`
      );

      await gmailClient.users.messages.modify({
        userId,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        id: messageId!,
        requestBody: {
          removeLabelIds: ['UNREAD', 'INBOX'],
        },
      });
      console.log(`Marked message as read and archived`);
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
