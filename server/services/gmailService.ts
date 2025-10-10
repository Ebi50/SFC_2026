// Gmail Service für Email-Versand
// Referenced from connector:google-mail
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  // Check if we have valid cached credentials
  if (connectionSettings && connectionSettings.settings.expires_at) {
    const expiresAt = new Date(connectionSettings.settings.expires_at).getTime();
    if (expiresAt > Date.now()) {
      return connectionSettings.settings.access_token;
    }
  }
  
  // Re-fetch credentials if expired or not cached
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    throw new Error('REPLIT_CONNECTORS_HOSTNAME environment variable is not set. Gmail integration requires Replit deployment environment.');
  }

  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('REPL_IDENTITY or WEB_REPL_RENEWAL not found. Gmail integration requires Replit environment.');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Gmail connection: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  connectionSettings = data.items?.[0];

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected. Please set up the Gmail integration in Replit.');
  }
  
  return accessToken;
}

export async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function sendEventEmail(
  recipients: string[],
  eventName: string,
  message: string,
  appUrl: string
) {
  const gmail = await getUncachableGmailClient();

  const subject = `Skinfit Cup - ${eventName}`;
  const emailBody = `${message}\n\n---\n\nZur App: ${appUrl}\n\nMit sportlichen Grüßen,\nSkinfit Cup Team`;

  for (const recipient of recipients) {
    const raw = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      'MIME-Version: 1.0\n',
      'Content-Transfer-Encoding: 7bit\n',
      `to: ${recipient}\n`,
      `subject: ${subject}\n\n`,
      emailBody
    ].join('');

    const encodedMessage = Buffer.from(raw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
  }

  return { success: true, count: recipients.length };
}
