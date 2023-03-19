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

export async function updateOAuthTokens(code: string) {
  const oAuth2Client = await getOAuth2Client();
  const tokens = (await oAuth2Client.getToken(code)).tokens;
  const secretDescription = await putSecretValue(
    'GmailTokens',
    JSON.stringify(tokens)
  );
  console.log('Updated recorded tokens');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return secretDescription.LastChangedDate!;
}

export async function getAuthenticatedOAuth2Client() {
  const oAuth2Client = await getOAuth2Client();
  const tokens = JSON.parse(await getSecretValue('GmailTokens')) as Credentials;
  oAuth2Client.setCredentials(tokens);
  console.log('Loaded authentication token from Secret');
  return oAuth2Client;
}

export function getGmailClient(oAuth2Client: OAuth2Client): gmail_v1.Gmail {
  google.options({ auth: oAuth2Client });

  return google.gmail('v1');
}
