import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VerificationEmailProps {
  name: string;
  email: string;
  token: string;
}

export const VerificationEmail = ({ name, email, token }: VerificationEmailProps) => {
  const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;
  
  return (
    <Html>
      <Head />
      <Preview>メールアドレスの認証をお願いします - {name}様</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>🔐 メールアドレス認証</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={paragraph}>
              {name} 様
            </Text>
            
            <Text style={paragraph}>
              <strong>{process.env.APP_NAME || '掲示板システム'}</strong>へのご登録ありがとうございます。
            </Text>
            
            <Text style={paragraph}>
              アカウントを有効化するため、以下のボタンをクリックしてメールアドレスの認証を完了してください。
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                メールアドレスを認証する
              </Button>
            </Section>
            
            <Text style={warningText}>
              ⚠️ この認証リンクは<strong>24時間</strong>で期限切れになります。
            </Text>
            
            <Text style={paragraph}>
              ボタンが機能しない場合は、以下のURLを直接ブラウザにコピー&ペーストしてください：
            </Text>
            
            <Text style={urlText}>
              {verificationUrl}
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              このメールは {email} に送信されました。<br />
              もしこのリクエストに心当たりがない場合は、このメールを無視してください。<br />
              © {new Date().getFullYear()} {process.env.APP_NAME || '掲示板システム'}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 20px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  lineHeight: '42px',
};

const paragraph = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#4CAF50',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const warningText = {
  color: '#ff6b35',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '12px',
  backgroundColor: '#fff5f5',
  borderRadius: '8px',
  borderLeft: '4px solid #ff6b35',
};

const urlText = {
  color: '#4CAF50',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '12px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  wordBreak: 'break-all' as const,
};

const footer = {
  padding: '20px 0',
  borderTop: '1px solid #eee',
  marginTop: '32px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};

export default VerificationEmail;