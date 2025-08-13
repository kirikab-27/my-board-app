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

interface ResetPasswordEmailProps {
  name: string;
  email: string;
  token: string;
}

export const ResetPasswordEmail = ({ name, email, token }: ResetPasswordEmailProps) => {
  const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
  
  return (
    <Html>
      <Head />
      <Preview>パスワードリセットのご案内 - {name}様</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>🔑 パスワードリセット</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={paragraph}>
              {name} 様
            </Text>
            
            <Text style={paragraph}>
              <strong>{process.env.APP_NAME || '掲示板システム'}</strong>にて、パスワードリセットのご要求を受け付けました。
            </Text>
            
            <Text style={paragraph}>
              以下のボタンをクリックして、新しいパスワードを設定してください。
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                パスワードをリセットする
              </Button>
            </Section>
            
            <Text style={warningText}>
              ⚠️ このリセットリンクは<strong>1時間</strong>で期限切れになります。
            </Text>
            
            <Text style={paragraph}>
              ボタンが機能しない場合は、以下のURLを直接ブラウザにコピー&ペーストしてください：
            </Text>
            
            <Text style={urlText}>
              {resetUrl}
            </Text>
            
            <Text style={securityNote}>
              🛡️ セキュリティのため、パスワードは以下の条件を満たすものをお選びください：<br />
              • 8文字以上<br />
              • 英数字を含む<br />
              • 他のサイトと異なるパスワード
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              このメールは {email} に送信されました。<br />
              もしこのリクエストに心当たりがない場合は、このメールを無視してください。<br />
              アカウントのセキュリティが心配な場合は、ログイン後にパスワードを変更することをお勧めします。<br />
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
  backgroundColor: '#FF9800',
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
  color: '#FF9800',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '12px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  wordBreak: 'break-all' as const,
};

const securityNote = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '12px',
  backgroundColor: '#e8f5e8',
  borderRadius: '8px',
  borderLeft: '4px solid #4CAF50',
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

export default ResetPasswordEmail;