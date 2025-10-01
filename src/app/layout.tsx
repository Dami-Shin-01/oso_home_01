import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { getStoreSEOInfo } from "@/lib/store-config";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

// 동적 메타데이터 생성 함수
export async function generateMetadata(): Promise<Metadata> {
  try {
    const seoInfo = await getStoreSEOInfo();
    
    return {
      title: seoInfo.title,
      description: seoInfo.description,
      keywords: seoInfo.keywords,
      openGraph: {
        title: seoInfo.title,
        description: seoInfo.description,
        type: "website",
        images: [
          {
            url: seoInfo.ogImageUrl,
            width: 1200,
            height: 630,
            alt: seoInfo.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: seoInfo.title,
        description: seoInfo.description,
        images: [seoInfo.ogImageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    
    // 기본 메타데이터 반환
    return {
      title: '바베큐장 예약 시스템',
      description: '바베큐장 시설 예약 시스템',
      keywords: ['babeque', 'reservation', 'bbq'],
      openGraph: {
        title: '바베큐장 예약 시스템',
        description: '바베큐장 시설 예약 시스템',
        type: "website",
        images: [
          {
            url: '/images/og-image.jpg',
            width: 1200,
            height: 630,
            alt: '바베큐장 예약 시스템',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: '바베큐장 예약 시스템',
        description: '바베큐장 시설 예약 시스템',
        images: ['/images/og-image.jpg'],
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="light">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
