// src/lib/email/config.ts
export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  from: {
    address: process.env.MAIL_FROM_ADDRESS!,
    name: process.env.MAIL_FROM_NAME!,
  },
  replyTo: process.env.MAIL_REPLY_TO!,
  admin: process.env.ADMIN_EMAIL!,
  support: process.env.SUPPORT_EMAIL!,
};

// 設定値の検証
export function validateEmailConfig() {
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'SMTP_PASSWORD',
    'MAIL_FROM_ADDRESS',
    'MAIL_FROM_NAME'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required email environment variables: ${missing.join(', ')}`);
  }

  return true;
}