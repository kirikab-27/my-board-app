// import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
});

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
  // Phase 1: Image Optimization Configuration
  images: {
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
    // Quality settings for different scenarios
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cloudinary domain configuration
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
    // Cache optimization
    minimumCacheTTL: 86400, // 24 hours
    // Enable optimization for external images
    unoptimized: false,
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
export default withPWA(nextConfig);
