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

interface WelcomeEmailProps {
  name: string;
  email: string;
}

export const WelcomeEmail = ({ name, email }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>ようこそ、{name}様！掲示板システムへの登録が完了しました</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🎉 ようこそ、{name}様！</Heading>
        </Section>
        
        <Section style={content}>
          <Text style={paragraph}>
            <strong>{process.env.APP_NAME || '掲示板システム'}</strong>へのご登録とメールアドレスの認証が完了しました。
          </Text>
          
          <Text style={paragraph}>
            これで、掲示板の全ての機能をご利用いただけるようになりました：
          </Text>
          
          <Text style={featureList}>
            ✅ 投稿の作成・編集・削除<br />
            ✅ いいね機能<br />
            ✅ 投稿検索・並び替え<br />
            ✅ プロフィール管理
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={`${process.env.APP_URL}/dashboard`}>
              ダッシュボードを見る
            </Button>
          </Section>
          
          <Text style={paragraph}>
            ご不明な点やご質問がございましたら、いつでもお気軽にお問い合わせください。
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            このメールは {email} に送信されました。<br />
            © {new Date().getFullYear()} {process.env.APP_NAME || '掲示板システム'}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

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

const featureList = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  borderLeft: '4px solid #4CAF50',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#1976d2',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
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

export default WelcomeEmail;