import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* 緊急LCP改善: Critical CSS インライン化 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical CSS for First Paint optimization */
              body { 
                margin: 0; 
                font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                background-color: #fafafa;
              }
              
              /* AppBar critical styles for LCP */
              .MuiAppBar-root {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1100;
                background-color: #1976d2;
                min-height: 64px;
                box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2);
              }
              
              /* Loading skeleton animation */
              .loading-skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading-shimmer 1.5s infinite;
              }
              
              @keyframes loading-shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
              
              /* Container critical styles */
              .MuiContainer-root {
                padding-left: 16px;
                padding-right: 16px;
                margin-left: auto;
                margin-right: auto;
                max-width: 1200px;
              }
              
              /* Typography critical styles */
              .MuiTypography-h4 {
                font-size: 2.125rem;
                font-weight: 400;
                line-height: 1.235;
                letter-spacing: 0.00735em;
                margin: 0 0 0.35em;
              }
              
              .MuiTypography-h5 {
                font-size: 1.5rem;
                font-weight: 400;
                line-height: 1.334;
                letter-spacing: 0em;
                margin: 0 0 0.35em;
              }
              
              /* Phase 5: CLS Prevention - Layout Stability */
              .MuiPaper-root {
                min-height: 40px; /* Prevent layout shifts */
              }
              
              /* Image containers for layout stability */
              .image-container {
                position: relative;
                overflow: hidden;
              }
              
              /* Button loading states */
              .MuiButton-root {
                min-width: 64px; /* Prevent button width changes */
              }
              
              /* Form elements stability */
              .MuiTextField-root {
                min-height: 56px; /* Prevent input field shifts */
              }
            `,
          }}
        />
        
        {/* フォント最適化: 事前接続 + font-display: swap */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" 
          rel="stylesheet" 
        />
        
        {/* 重要リソースの事前読み込み */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        
        {/* Phase 5: Critical Resource Preloading for LCP */}
        <link rel="preload" href="/api/posts" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/_next/static/css/app/layout.css" as="style" />
        <link rel="modulepreload" href="/_next/static/chunks/main-app.js" />
        
        {/* SEO最適化 */}
        <meta name="description" content="安全で使いやすい会員制コミュニティプラットフォーム - 掲示板アプリ" />
        <meta name="keywords" content="掲示板,コミュニティ,会員制,SNS,リアルタイム" />
        
        {/* PWA対応 */}
        <meta name="theme-color" content="#1976d2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="掲示板アプリ" />
        
        {/* パフォーマンス最適化 */}
        <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}