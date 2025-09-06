import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VerificationCodeEmailProps {
  name?: string;
  email: string;
  code: string;
  type: 'admin_registration' | 'password_reset' | '2fa' | 'email_verification';
  expiresInMinutes?: number;
}

export const VerificationCodeEmail = ({ 
  name, 
  email, 
  code, 
  type,
  expiresInMinutes = 10 
}: VerificationCodeEmailProps) => {
  
  const getTitle = () => {
    switch (type) {
      case 'admin_registration':
        return '🔐 管理者登録用認証コード';
      case 'password_reset':
        return '🔑 パスワードリセット用認証コード';
      case '2fa':
        return '🛡️ 2段階認証コード';
      case 'email_verification':
        return '✉️ メールアドレス認証コード';
      default:
        return '認証コード';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'admin_registration':
        return '管理者登録を完了するため、以下の認証コードを入力してください。';
      case 'password_reset':
        return 'パスワードをリセットするため、以下の認証コードを入力してください。';
      case '2fa':
        return 'ログインを完了するため、以下の認証コードを入力してください。';
      case 'email_verification':
        return 'メールアドレスを認証するため、以下の認証コードを入力してください。';
      default:
        return '以下の認証コードを入力してください。';
    }
  };
  
  return (
    <Html>
      <Head />
      <Preview>{getTitle()} - {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{getTitle()}</Heading>
          </Section>
          
          <Section style={content}>
            {name && (
              <Text style={paragraph}>
                {name} 様
              </Text>
            )}
            
            <Text style={paragraph}>
              {getMessage()}
            </Text>
            
            <Section style={codeContainer}>
              <Text style={codeText}>{code}</Text>
            </Section>
            
            <Text style={paragraph}>
              このコードは<strong>{expiresInMinutes}分間</strong>有効です。
              他の人と共有しないでください。
            </Text>
            
            <Text style={warningText}>
              ⚠️ このメールに心当たりがない場合は、無視してください。
              あなたのアカウントは安全です。
            </Text>
            
            <Section style={footer}>
              <Text style={footerText}>
                このメールは自動送信されています。返信はできません。
              </Text>
              <Text style={footerText}>
                {process.env.APP_NAME || '掲示板システム'}
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// スタイル定義
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6ebf1',
  borderRadius: '8px',
  margin: '40px auto',
  padding: '20px',
  width: '100%',
  maxWidth: '600px',
};

const header = {
  borderBottom: '2px solid #1976d2',
  marginBottom: '30px',
  paddingBottom: '20px',
};

const h1 = {
  color: '#1976d2',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 20px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '16px 0',
};

const codeContainer = {
  backgroundColor: '#f6f9fc',
  border: '2px dashed #1976d2',
  borderRadius: '8px',
  margin: '32px 0',
  padding: '24px',
  textAlign: 'center' as const,
};

const codeText = {
  color: '#1976d2',
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  margin: '0',
};

const warningText = {
  color: '#ff9800',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '24px',
  padding: '12px',
  backgroundColor: '#fff3e0',
  borderRadius: '4px',
};

const footer = {
  borderTop: '1px solid #e6ebf1',
  marginTop: '40px',
  paddingTop: '20px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
};

export default VerificationCodeEmail;