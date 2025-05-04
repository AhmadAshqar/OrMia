import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email sending will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key is not set');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generatePasswordResetToken(): { token: string, expires: Date } {
  // Generate a random token
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  
  // Set expiration to 1 hour from now
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  
  return { token, expires };
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.SITE_URL || 'http://localhost:5000'}/auth?reset=${resetToken}`;
  
  // HTML email with Hebrew RTL support
  const htmlContent = `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #8B7355; text-align: center;">איפוס סיסמה</h2>
      <p>שלום,</p>
      <p>קיבלנו בקשה לאיפוס הסיסמה בחשבון שלך. לחץ על הקישור הבא כדי לאפס את הסיסמה:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #8B7355; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">איפוס סיסמה</a>
      </div>
      <p>אם לא ביקשת לאפס את הסיסמה, אנא התעלם מהודעה זו.</p>
      <p>קישור זה יפוג בעוד שעה.</p>
      <p>בברכה,<br>צוות חנות התכשיטים</p>
    </div>
  `;

  // Plain text alternative for email clients that don't support HTML
  const textContent = `
    איפוס סיסמה
    
    שלום,
    
    קיבלנו בקשה לאיפוס הסיסמה בחשבון שלך. לחץ על הקישור הבא כדי לאפס את הסיסמה:
    
    ${resetUrl}
    
    אם לא ביקשת לאפס את הסיסמה, אנא התעלם מהודעה זו.
    
    קישור זה יפוג בעוד שעה.
    
    בברכה,
    צוות חנות התכשיטים
  `;

  return await sendEmail({
    to: email,
    from: process.env.EMAIL_FROM || 'info@yourdomain.com',
    subject: 'איפוס סיסמה',
    html: htmlContent,
    text: textContent,
  });
}