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

// 환경변수에서 SEO 정보 가져오기
const seoInfo = getStoreSEOInfo();

export const metadata: Metadata = {
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
