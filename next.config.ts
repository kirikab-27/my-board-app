// import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

// Bundle analyzer for performance optimization
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

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
  // Phase 2: JavaScript Bundle Optimization
  webpack: (config, { isServer, dev }) => {
    if (!dev) {
      // Tree shaking optimization for Material-UI
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
      
      // Bundle splitting optimization
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            chunks: 'all',
            priority: 10,
          },
          chartjs: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'chartjs',
            chunks: 'async',
            priority: 15,
          },
        },
      };
    }
    
    return config;
  },
};

// const sentryWebpackPluginOptions = {
//   silent: true,
//   org: process.env.SENTRY_ORG,
//   project: process.env.SENTRY_PROJECT,
// };

// export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
export default withBundleAnalyzer(withPWA(nextConfig));
