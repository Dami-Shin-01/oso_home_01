'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@/constants';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: '홈', href: ROUTES.HOME },
    { name: '시설소개', href: ROUTES.FACILITIES },
    { name: '예약하기', href: ROUTES.RESERVATION },
    { name: '공지사항', href: ROUTES.ANNOUNCEMENTS },
    { name: 'Q&A', href: ROUTES.QNA },
    { name: '오시는 길', href: ROUTES.LOCATION },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex-shrink-0">
            <Link href={ROUTES.HOME} className="text-2xl font-bold text-green-700">
              오소 바베큐장
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-900 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* 로그인/회원가입 버튼 */}
          <div className="hidden md:flex space-x-2">
            <Link
              href="/guest-reservation"
              className="text-gray-700 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              예약조회
            </Link>
            <Link
              href="/login"
              className="text-green-700 hover:text-green-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              로그인
            </Link>
            <Link
              href="/register"
              className="bg-green-700 text-white hover:bg-green-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              회원가입
            </Link>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-green-700 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-900 hover:text-green-700 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t pt-3 space-y-1">
                <Link
                  href="/guest-reservation"
                  className="text-gray-700 hover:text-green-700 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  예약조회
                </Link>
                <Link
                  href="/login"
                  className="text-green-700 hover:text-green-900 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="bg-green-700 text-white hover:bg-green-800 block px-3 py-2 rounded-md text-base font-medium text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}