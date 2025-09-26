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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: getSupabaseHostname(),
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
