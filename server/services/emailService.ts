import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@sfc-rsv.de';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log(`Email service configured: ${SMTP_HOST}:${SMTP_PORT}`);
} else {
  console.warn('Email service not configured - set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables');
}

export async function sendPasswordResetEmail(toEmail: string, resetToken: string, firstName: string): Promise<boolean> {
  if (!transporter) {
    console.error('Email service not configured - cannot send password reset email');
    return false;
  }

  const resetUrl = `https://www.sfc-rsv.de/?resetToken=${resetToken}`;

  try {
    await transporter.sendMail({
      from: `"SkinfitCup" <${SMTP_FROM}>`,
      to: toEmail,
      subject: 'SkinfitCup – Passwort zurücksetzen',
      html: `
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

export function isEmailConfigured(): boolean {
  return transporter !== null;
}
