import { Resend } from 'resend';

// Single Resend client (lazy initialization, used for all environments)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[Email] RESEND_API_KEY is missing!', {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter((k) =>
          k.includes('RESEND') || k.includes('EMAIL')
        ),
      });
      throw new Error(
        'RESEND_API_KEY is required for email sending. Please set it in your environment variables.'
      );
    }

    // Validate API key format (Resend keys typically start with 're_')
    if (!apiKey.startsWith('re_')) {
      console.warn(
        '[Email] RESEND_API_KEY does not start with "re_". This might not be a valid Resend API key.'
      );
    }

    try {
      resendClient = new Resend(apiKey);

      // Log initialization (without exposing API key)
      console.log('[Email] Resend client initialized successfully', {
        apiKeyPrefix: apiKey.substring(0, 7) + '...',
        apiKeyLength: apiKey.length,
        environment: process.env.VERCEL ? 'Vercel' : process.env.NODE_ENV,
      });
    } catch (error: any) {
      console.error('[Email] Failed to initialize Resend client:', error);
      throw new Error(`Failed to initialize Resend client: ${error.message}`);
    }
  }
  return resendClient;
}

// Simple connection check for health checks – always Resend
export async function verifyConnection(): Promise<boolean> {
  try {
    const client = getResendClient();
    // Lightweight no-op to ensure client can be constructed
    return !!client;
  } catch (error) {
    console.error('Email connection verification failed:', error);
    return false;
  }
}

// Shared email templates
const getOTPEmailContent = (otpCode: string, participantName: string) => ({
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            text-align: center;
            letter-spacing: 8px;
            margin: 20px 0;
            padding: 15px;
            background-color: #ffffff;
            border-radius: 5px;
            border: 2px dashed #2563eb;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎁 Secret Santa OTP Code</h1>
          <p>Hello ${participantName},</p>
          <p>Your OTP code for the Secret Santa wheel spin is:</p>
          <div class="otp-code">${otpCode}</div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>Enter this code on the spin page to verify your identity and spin the wheel!</p>
          <div class="footer">
            <p>If you didn't request this code, please ignore this email.</p>
            <p>© Secret Santa App</p>
          </div>
        </div>
      </body>
    </html>
  `,
  text: `
    Secret Santa OTP Code
    
    Hello ${participantName},
    
    Your OTP code for the Secret Santa wheel spin is: ${otpCode}
    
    This code will expire in 10 minutes.
    
    Enter this code on the spin page to verify your identity and spin the wheel!
    
    If you didn't request this code, please ignore this email.
  `,
});

const getMatchConfirmationEmailContent = (participantName: string, matchedName: string) => ({
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(to bottom, #dc2626, #16a34a);
          }
          .container {
            background-color: #ffffff;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 4px solid #dc2626;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #dc2626;
            font-size: 32px;
            margin: 0;
          }
          .match-box {
            background: linear-gradient(135deg, #dc2626 0%, #16a34a 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          .match-name {
            font-size: 36px;
            font-weight: bold;
            margin: 20px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .emoji {
            font-size: 48px;
            margin: 10px;
          }
          .message {
            background-color: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎄 Secret Santa Match Confirmation 🎄</h1>
          </div>
          <p>Hello <strong>${participantName}</strong>,</p>
          <p>Your Secret Santa wheel spin is complete! Here's your match:</p>
          
          <div class="match-box">
            <div class="emoji">🎁</div>
            <p style="margin: 10px 0; font-size: 18px;">You are buying a gift for:</p>
            <div class="match-name">${matchedName}</div>
            <div class="emoji">🎅</div>
          </div>
          
          <div class="message">
            <p><strong>🎉 Congratulations!</strong></p>
            <p>Your match has been confirmed and recorded. Start thinking about the perfect gift for <strong>${matchedName}</strong>!</p>
            <p>Remember to keep your match a secret until gift exchange day! 🤫</p>
          </div>
          
          <p>Happy gift giving and Merry Christmas! 🎄✨</p>
          
          <div class="footer">
            <p>This is an automated confirmation email from the Secret Santa App.</p>
            <p>If you have any questions, please contact your event organizer.</p>
            <p>© Secret Santa App</p>
          </div>
        </div>
      </body>
    </html>
  `,
  text: `
    🎄 Secret Santa Match Confirmation 🎄
    
    Hello ${participantName},
    
    Your Secret Santa wheel spin is complete! Here's your match:
    
    🎁 You are buying a gift for: ${matchedName} 🎅
    
    🎉 Congratulations!
    
    Your match has been confirmed and recorded. Start thinking about the perfect gift for ${matchedName}!
    
    Remember to keep your match a secret until gift exchange day! 🤫
    
    Happy gift giving and Merry Christmas! 🎄✨
    
    ---
    This is an automated confirmation email from the Secret Santa App.
    If you have any questions, please contact your event organizer.
  `,
});

export async function sendOTPEmail(
  email: string,
  otpCode: string,
  participantName: string
): Promise<void> {
  const fromEmail =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    'Secret Santa <onboarding@resend.dev>';
  
  // Log email attempt (without sensitive data)
  console.log(`[Email] Attempting to send OTP to: ${email}`);
  console.log('[Email] Using: Resend (only)');
  console.log(
    `[Email] Environment check: VERCEL=${process.env.VERCEL}, NODE_ENV=${process.env.NODE_ENV}, RESEND_API_KEY=${
      process.env.RESEND_API_KEY ? 'SET' : 'NOT SET'
    }`
  );
  
  const emailContent = getOTPEmailContent(otpCode, participantName);

  try {
    const resend = getResendClient();

    console.log('[Email] Sending via Resend:', {
      from: fromEmail,
      to: email,
      subject: 'Your Secret Santa OTP Code',
    });

    // Send email via Resend with proper error handling
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your Secret Santa OTP Code',
      html: emailContent.html,
      text: emailContent.text,
    });

    // Check for errors in the response (shape aligned with Resend docs)
    if (error) {
      console.error('[Email] Resend API error:', {
        error,
        message: error.message,
        name: error.name,
        statusCode: (error as any)?.statusCode,
      });
      throw new Error(
        `Resend API error: ${error.message || 'Unknown error'}`
      );
    }

    if (!data || !data.id) {
      console.error('[Email] Resend API returned invalid response:', {
        data,
        error,
      });
      throw new Error('Resend API returned no data or missing email ID');
    }

    console.log(
      `[Email] OTP email sent successfully via Resend to ${email}. ID: ${data.id}`
    );
  } catch (error: any) {
    console.error('[Email] Error sending OTP email:', {
      provider: 'Resend',
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    const errorMessage =
      error.message ||
      'Failed to send email via Resend. Please check RESEND_API_KEY and RESEND_FROM.';

    throw new Error(errorMessage);
  }
}

export async function sendMatchConfirmationEmail(
  participantEmail: string,
  participantName: string,
  matchedName: string
): Promise<void> {
  const fromEmail =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    'Secret Santa <onboarding@resend.dev>';
  
  // Log email attempt
  console.log(
    `[Email] Attempting to send match confirmation to: ${participantEmail}`
  );
  console.log('[Email] Using: Resend (only)');
  console.log(
    `[Email] Environment check: VERCEL=${process.env.VERCEL}, NODE_ENV=${process.env.NODE_ENV}, RESEND_API_KEY=${
      process.env.RESEND_API_KEY ? 'SET' : 'NOT SET'
    }`
  );

  const emailContent = getMatchConfirmationEmailContent(participantName, matchedName);

  try {
    const resend = getResendClient();

    console.log('[Email] Sending match confirmation via Resend:', {
      from: fromEmail,
      to: participantEmail,
      subject: '🎄 Your Secret Santa Match Confirmation',
    });

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: participantEmail,
      subject: '🎄 Your Secret Santa Match Confirmation',
      html: emailContent.html,
      text: emailContent.text,
    });

    if (error) {
      console.error('[Email] Resend API error:', {
        error,
        message: error.message,
        name: error.name,
        statusCode: (error as any)?.statusCode,
      });
      throw new Error(
        `Resend API error: ${error.message || 'Unknown error'}`
      );
    }

    if (!data || !data.id) {
      console.error('[Email] Resend API returned invalid response:', {
        data,
        error,
      });
      throw new Error('Resend API returned no data or missing email ID');
    }

    console.log(
      `[Email] Match confirmation email sent successfully via Resend to ${participantEmail}. ID: ${data.id}`
    );
  } catch (error: any) {
    console.error('[Email] Error sending match confirmation email:', {
      provider: 'Resend',
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    const errorMessage =
      error.message ||
      'Failed to send email via Resend. Please check RESEND_API_KEY and RESEND_FROM.';

    throw new Error(errorMessage);
  }
}
// Default export kept for backwards compatibility (no-op Resend client getter)
export default getResendClient;
