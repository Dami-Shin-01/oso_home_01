import type { NextConfig } from "next";

// 환경변수에서 Supabase URL 추출하여 동적으로 도메인 설정
const getSupabaseHostname = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      return url.hostname;
    } catch (error) {
      console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
    }
  }

  // fallback으로 와일드카드 사용
  return '*.supabase.co';
};

const nextConfig: NextConfig = {
  // 성능 최적화 설정
  experimental: {
    // 컴파일러 최적화 (일시적으로 비활성화)
    // optimizeCss: true,
  },

  // 서버 컴포넌트 외부 패키지
  serverExternalPackages: ['@supabase/supabase-js'],

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: getSupabaseHostname(),
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // 이미지 최적화 품질 및 형식
    formats: ['image/webp', 'image/avif'],
    qualities: [75, 85, 90, 100], // Next.js 16 대비 품질 설정
    minimumCacheTTL: 31536000, // 1년 캐시
    // 반응형 이미지 크기 정의
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 압축 설정
  compress: true,

  // 번들 분석기 설정
  webpack: (config, { dev, isServer }) => {
    // 프로덕션 빌드에서 번들 분석
    if (!dev && !isServer && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html',
        })
      );
    }

    // 청크 최적화
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          },
        supabase: {
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          name: 'supabase',
          chunks: 'all',
          priority: 10,
        },
        ui: {
          test: /[\\/]src[\\/]components[\\/]/,
          name: 'ui',
          chunks: 'all',
          minChunks: 2,
        }
      }
    };

    // Tree shaking 최적화
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    return config;
  },

  // 정적 파일 최적화
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },

  // 출력 최적화
  output: 'standalone',
  
  // 자산 최적화
  assetPrefix: process.env.NODE_ENV === 'production' ? 
    process.env.NEXT_PUBLIC_CDN_URL || '' : '',
};

export default nextConfig;