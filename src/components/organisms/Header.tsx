'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@/constants';
import ThemeController from './ThemeController';

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
    <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="navbar-start">
        {/* 모바일 메뉴 */}
        <div className="dropdown">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </div>
          {isMenuOpen && (
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </Link>
                </li>
              ))}
              <div className="divider my-1"></div>
              <li>
                <Link href="/guest-reservation" onClick={() => setIsMenuOpen(false)}>
                  예약조회
                </Link>
              </li>
              <li>
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  로그인
                </Link>
              </li>
              <li>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  회원가입
                </Link>
              </li>
            </ul>
          )}
        </div>

        {/* 로고 */}
        <Link href={ROUTES.HOME} className="btn btn-ghost text-xl text-primary font-bold">
          🍖 오소 바베큐장
        </Link>
      </div>

      {/* 데스크톱 네비게이션 */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link href={item.href} className="btn btn-ghost">
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 로그인/회원가입 버튼 */}
      <div className="navbar-end hidden lg:flex gap-2">
        <ThemeController />
        <Link href="/guest-reservation" className="btn btn-ghost">
          예약조회
        </Link>
        <Link href="/login" className="btn btn-outline btn-primary">
          로그인
        </Link>
        <Link href="/register" className="btn btn-primary">
          회원가입
        </Link>
      </div>
    </div>
  );
}