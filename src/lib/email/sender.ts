// src/lib/email/sender.ts
import nodemailer from 'nodemailer';
import { emailConfig } from './config';

// トランスポーター作成
const createTransporter = () => {
  return nodemailer.createTransporter(emailConfig.smtp);
};

// 基本のメール送信関数
export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
    replyTo: emailConfig.replyTo
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('メール送信成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('メール送信エラー:', error);
    return { success: false, error };
  }
}

// 会員登録確認メール
export async function sendVerificationEmail(to: string, verificationToken: string) {
  const verificationUrl = `${process.env.APP_URL}/verify?token=${verificationToken}`;
  
  const subject = '【掲示板】メールアドレスの確認';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">メールアドレスの確認</h2>
      <p>掲示板システムへのご登録ありがとうございます。</p>
      <p>以下のリンクをクリックして、メールアドレスを確認してください。</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          メールアドレスを確認する
        </a>
      </div>
      <p><strong>注意:</strong> このリンクは24時間後に無効になります。</p>
      <p>このメールに心当たりがない場合は、このメールを無視してください。</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">
        このメールは自動送信されています。返信しないでください。<br>
        お問い合わせは <a href="mailto:${emailConfig.support}">${emailConfig.support}</a> までお願いします。
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// パスワードリセットメール
export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  
  const subject = '【掲示板】パスワードリセットのご案内';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">パスワードリセット</h2>
      <p>パスワードリセットのリクエストを受け付けました。</p>
      <p>以下のリンクをクリックして、新しいパスワードを設定してください。</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          パスワードを再設定する
        </a>
      </div>
      <p><strong>注意:</strong> このリンクは1時間後に無効になります。</p>
      <p>パスワードリセットを要求していない場合は、このメールを無視してください。</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">
        このメールは自動送信されています。返信しないでください。<br>
        セキュリティに関するお問い合わせは <a href="mailto:${emailConfig.support}">${emailConfig.support}</a> までお願いします。
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// システム通知メール
export async function sendNotificationEmail({
  to,
  type,
  title,
  content,
  actionUrl
}: {
  to: string;
  type: 'reply' | 'like' | 'system';
  title: string;
  content: string;
  actionUrl?: string;
}) {
  const typeLabels = {
    reply: '新しい返信',
    like: 'いいね',
    system: 'システム通知'
  };

  const subject = `【掲示板】${typeLabels[type]}通知`;
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">${typeLabels[type]}通知</h2>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${title}</h3>
        <p>${content}</p>
      </div>
      ${actionUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          詳細を見る
        </a>
      </div>
      ` : ''}
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">
        通知設定の変更は掲示板の設定画面から行えます。<br>
        お問い合わせは <a href="mailto:${emailConfig.support}">${emailConfig.support}</a> までお願いします。
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}