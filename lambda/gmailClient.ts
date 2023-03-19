import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { SecretsManager } from 'aws-sdk';

async function getSecretsManagerSecret(secretId: string): Promise<string> {
  const secretsManager = new SecretsManager();
  try {
    const response = await secretsManager
      .getSecretValue({ SecretId: secretId })
      .promise();
    if (response.SecretString) {
      return response.SecretString;
    } else {
      throw new Error(`SecretString is not available for secret: ${secretId}`);
    }
  } catch (error) {
    console.error(`Error retrieving secret: ${secretId}`, error);
    throw error;
  }
}

async function getOAuth2Client(): Promise<OAuth2Client> {
  const credentials = JSON.parse(
    await getSecretsManagerSecret('GmailCredentials')
  );
  return new OAuth2Client(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    credentials.installed.redirect_uris[0]
  );
}

async function getGmailClient(): Promise<gmail_v1.Gmail> {
  google.options({ auth: await getOAuth2Client() });

  return google.gmail('v1');
}

export { getOAuth2Client, getGmailClient };
