// import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // serverExternalPackages: ['@sentry/nextjs'],
  experimental: {
    // メモリ使用量を最適化
    workerThreads: false,
  },
  eslint: {
    // Vercel本番ビルド時にESLintエラーを警告に変更（Phase 5.5対応）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScriptエラーは型チェックを続行
    ignoreBuildErrors: false,
  },
  // ビルド最適化設定
  output: 'standalone',
};

// const sentryWebpackPluginOptions = {
//   silent: true,
//   org: process.env.SENTRY_ORG,
//   project: process.env.SENTRY_PROJECT,
// };

// export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
export default nextConfig;
