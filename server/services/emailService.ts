const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const SMTP_FROM = process.env.SMTP_FROM || 'eberhard.janzen50@gmail.com';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

if (BREVO_API_KEY) {
  console.log('📧 Email service configured via Brevo API');
} else {
  console.warn('📧 Email service not configured - set BREVO_API_KEY environment variable');
}

async function sendViaBrevo(payload: object): Promise<void> {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API Fehler (${response.status}): ${errorBody}`);
  }
}

export async function sendPasswordResetEmail(toEmail: string, resetToken: string, firstName: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error('Email service not configured - cannot send password reset email');
    return false;
  }

  const resetUrl = `https://www.sfc-rsv.de/?resetToken=${resetToken}`;

  try {
    await sendViaBrevo({
      sender: { name: 'SkinfitCup', email: SMTP_FROM },
      to: [{ email: toEmail, name: firstName }],
      subject: 'SkinfitCup – Passwort zurücksetzen',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SkinfitCup</h1>
          </div>
          <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hallo ${firstName},</p>
            <p>Du hast eine Passwort-Zurücksetzung für dein SkinfitCup-Konto angefordert.</p>
            <p>Klicke auf den folgenden Button, um ein neues Passwort zu setzen:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Neues Passwort setzen
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Dieser Link ist <strong>1 Stunde</strong> gültig.</p>
            <p style="color: #6b7280; font-size: 14px;">Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              SkinfitCup – RSV Stuttgart-Vaihingen<br>
              <a href="https://www.sfc-rsv.de" style="color: #dc2626;">www.sfc-rsv.de</a>
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

export async function sendBulkEmail(
  bccRecipients: string[],
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; count: number }> {
  if (!BREVO_API_KEY) {
    throw new Error('Email-Service nicht konfiguriert');
  }

  if (bccRecipients.length === 0) {
    throw new Error('Keine Empfänger vorhanden');
  }

  // Brevo supports BCC natively
  await sendViaBrevo({
    sender: { name: 'SkinfitCup', email: SMTP_FROM },
    to: [{ email: SMTP_FROM, name: 'SkinfitCup' }],
    bcc: bccRecipients.map(email => ({ email })),
    subject,
    htmlContent: htmlBody,
  });

  return { success: true, count: bccRecipients.length };
}

export function isEmailConfigured(): boolean {
  return !!BREVO_API_KEY;
}

export async function testSmtpConnection(): Promise<{ success: boolean; message: string; config: object }> {
  const config = {
    provider: 'Brevo API',
    apiKeySet: !!BREVO_API_KEY,
    from: SMTP_FROM,
  };

  if (!BREVO_API_KEY) {
    return { success: false, message: 'BREVO_API_KEY nicht gesetzt', config };
  }

  // Test API connectivity by fetching account info
  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, message: `Brevo API Fehler (${response.status}): ${errorBody}`, config };
    }

    const account = await response.json();
    return {
      success: true,
      message: `Brevo-Verbindung erfolgreich (Konto: ${account.email})`,
      config: { ...config, account: account.email, plan: account.plan?.[0]?.type || 'free' },
    };
  } catch (error: any) {
    return { success: false, message: `Verbindungsfehler: ${error.message}`, config };
  }
}
