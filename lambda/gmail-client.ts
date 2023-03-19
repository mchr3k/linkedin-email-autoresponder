import { google, gmail_v1 } from 'googleapis';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { getSecretValue, putSecretValue } from './secrets-manager';

export async function getOAuth2Client(): Promise<OAuth2Client> {
  const credentials = JSON.parse(await getSecretValue('GmailCredentials'));
  return new OAuth2Client(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[0]
  );
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
];

export async function getAuthorizationUrl(): Promise<string> {
  const oAuth2Client = await getOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

export async function getAuthenticatedOAuth2Client(code?: string) {
  try {
    const oAuth2Client = await getOAuth2Client();
    if (code) {
      const tokens = (await oAuth2Client.getToken(code)).tokens;
      await putSecretValue('GmailTokens', JSON.stringify(tokens));
      oAuth2Client.setCredentials(tokens);
      console.log('Loaded authentication token from OAuth code');
      return oAuth2Client;
    } else {
      const tokens = JSON.parse(
        await getSecretValue('GmailTokens')
      ) as Credentials;
      oAuth2Client.setCredentials(tokens);
      console.log('Loaded authentication token from Secret');
      return oAuth2Client;
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export function getGmailClient(oAuth2Client: OAuth2Client): gmail_v1.Gmail {
  google.options({ auth: oAuth2Client });

  return google.gmail('v1');
}
