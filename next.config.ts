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
  // Phase 3: Enhanced PWA Caching Strategy
  runtimeCaching: [
    // API calls - Network First with fallback
    {
      urlPattern: /^.*\/api\/posts.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-posts',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30, // 30 seconds
        },
        networkTimeoutSeconds: 3,
      },
    },
    // Images - Cache First for better performance
    {
      urlPattern: /\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    // Static assets - Cache First
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    // All other requests - Network First with cache fallback
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 3,
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
  // Phase 3: HTTP Headers and Caching Strategy
  async headers() {
    return [
      {
        source: '/api/posts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=30, stale-while-revalidate=60'
          },
        ],
      },
      {
        source: '/:path*.(jpg|jpeg|png|webp|avif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
    ];
  },
  // Phase 3: Compression
  compress: true,
  // Phase 5: Advanced JavaScript Bundle Optimization
  webpack: (config, { isServer, dev }) => {
    if (!dev) {
      // Advanced tree shaking optimization
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false, // Tree shaking optimization
        // Phase 5: Bundle Size Reduction
        innerGraph: true,
        providedExports: true,
      };
      
      // Advanced bundle splitting optimization
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        minSize: 20000,
        maxSize: 500000, // 500KB max chunk size
        cacheGroups: {
          // Core dependencies
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          // Vendor dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: -10,
            maxSize: 400000, // 400KB limit for vendor chunk
          },
          // Material-UI optimization
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            chunks: 'all',
            priority: 10,
            maxSize: 300000, // 300KB limit for MUI
          },
          // Chart.js lazy loading
          chartjs: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|recharts)[\\/]/,
            name: 'chartjs',
            chunks: 'async',
            priority: 15,
            maxSize: 200000, // 200KB limit for charts
          },
          // Next.js runtime
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next|@next)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 20,
            maxSize: 600000, // 600KB for React/Next
          },
          // Authentication libraries
          auth: {
            test: /[\\/]node_modules[\\/](next-auth|@next-auth|bcryptjs|jsonwebtoken)[\\/]/,
            name: 'auth',
            chunks: 'all',
            priority: 12,
          },
          // Database and utilities
          utils: {
            test: /[\\/]node_modules[\\/](mongodb|mongoose|date-fns|zod|crypto-js)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 8,
          },
        },
      };

      // Phase 5: Dead code elimination
      config.optimization.minimize = true;
      
      // Module concatenation for better minification
      config.optimization.concatenateModules = true;
    }

    // Resolve optimization to reduce bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      // Replace crypto-js with Node.js crypto
      'crypto-js': false,
    };
    
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
