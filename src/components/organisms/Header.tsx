'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import { getCurrentCustomer, signOut } from '@/lib/auth-customer';
import ThemeController from './ThemeController';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigationItems = [
    { name: '홈', href: ROUTES.HOME },
    { name: '시설소개', href: ROUTES.FACILITIES },
    { name: '예약하기', href: ROUTES.RESERVATION },
    { name: '공지사항', href: ROUTES.ANNOUNCEMENTS },
    { name: 'Q&A', href: ROUTES.QNA },
    { name: '오시는 길', href: ROUTES.LOCATION },
  ];

  // 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const result = await getCurrentCustomer();
        if (result.success && result.data?.customer) {
          setIsAuthenticated(true);
          setCustomer(result.data.customer);
        } else {
          setIsAuthenticated(false);
          setCustomer(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setCustomer(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setCustomer(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
              {isAuthenticated ? (
                <>
                  <li>
                    <Link href={ROUTES.MY_PAGE} onClick={() => setIsMenuOpen(false)}>
                      마이페이지
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="text-left"
                    >
                      로그아웃
                    </button>
                  </li>
                </>
              ) : (
                <>
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
                </>
              )}
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

      {/* 로그인/회원가입 버튼 또는 사용자 메뉴 */}
      <div className="navbar-end hidden lg:flex gap-2">
        <ThemeController />
        {isLoading ? (
          <div className="flex gap-2">
            <div className="skeleton w-20 h-10"></div>
            <div className="skeleton w-20 h-10"></div>
          </div>
        ) : isAuthenticated ? (
          <>
            <Link href={ROUTES.MY_PAGE} className="btn btn-ghost">
              마이페이지
            </Link>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {customer?.name ? customer.name.charAt(0) : 'U'}
                  </span>
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow border">
                <li className="menu-title">
                  <span>{customer?.name || '사용자'}</span>
                </li>
                <li>
                  <Link href={ROUTES.MY_PAGE}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    내 정보 관리
                  </Link>
                </li>
                <li>
                  <Link href="/my/reservations">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    예약 내역
                  </Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button onClick={handleLogout} className="text-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    로그아웃
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <Link href="/guest-reservation" className="btn btn-ghost">
              예약조회
            </Link>
            <Link href="/login" className="btn btn-outline btn-primary">
              로그인
            </Link>
            <Link href="/register" className="btn btn-primary">
              회원가입
            </Link>
          </>
        )}
      </div>
    </div>
  );
}