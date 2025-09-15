import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "오소 바베큐장 예약 시스템",
  description: "바베큐장 시설 대여를 위한 간편한 예약 시스템",
  keywords: ["바베큐", "예약", "바베큐장", "가족 모임", "야외 활동"],
  openGraph: {
    title: "오소 바베큐장 예약 시스템",
    description: "자연 속에서 즐기는 특별한 바베큐 시간",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link 
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
