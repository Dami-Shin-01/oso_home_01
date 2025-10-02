'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ROUTES } from '@/constants';
import { getPublicStoreConfig, type PublicStoreConfig } from '@/lib/store-config';
import { getBankAccountForEmail } from '@/lib/bank-account';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [storeConfig, setStoreConfig] = useState<PublicStoreConfig>({
    basic: { name: '바베큐장', phone: '02-0000-0000', email: 'info@bbq.com' },
    location: { address: '서울특별시', detailedAddress: '', businessHours: '10:00-22:00', closedDay: '매주 월요일' },
    timeSlots: { slot1: '10:00-14:00', slot2: '14:00-18:00', slot3: '18:00-22:00', slot4: '', slot1Name: '1부', slot2Name: '2부', slot3Name: '3부', slot4Name: '' },
    policies: { cancellationPolicy: '', refundPolicy: '', termsOfServiceUrl: '/terms', privacyPolicyUrl: '/privacy' },
    seo: { title: '바베큐장', description: '바베큐장 예약 시스템', keywords: [], ogImageUrl: '' },
    social: { instagramUrl: '', facebookUrl: '', blogUrl: '' }
  });
  const [bankAccount, setBankAccount] = useState({
    bank: '은행명',
    accountNumber: '계좌번호',
    accountHolder: '예금주'
  });

  // 데이터베이스에서 매장 정보 가져오기
  useEffect(() => {
    const loadStoreData = async () => {
      try {
        const config = await getPublicStoreConfig();
        setStoreConfig(config);
      } catch (error) {
        console.error('Failed to load store config in Footer:', error);
      }

      try {
        const account = await getBankAccountForEmail();
        setBankAccount(account);
      } catch (error) {
        console.error('Failed to load bank account in Footer:', error);
      }
    };
    loadStoreData();
  }, []);

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">{storeConfig.basic.name}</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              {storeConfig.seo.description}<br />
              가족, 친구들과 함께하는 소중한 추억을 만들어보세요.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p><strong>주소:</strong> {storeConfig.location.address}</p>
              <p><strong>전화:</strong> {storeConfig.basic.phone}</p>
              <p><strong>영업시간:</strong> {storeConfig.location.businessHours}</p>
              <p><strong>휴무일:</strong> {storeConfig.location.closedDay}</p>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">빠른 링크</h4>
            <div className="space-y-2">
              <Link href={ROUTES.FACILITIES} className="block text-gray-300 hover:text-white text-sm transition-colors">
                시설소개
              </Link>
              <Link href={ROUTES.RESERVATION} className="block text-gray-300 hover:text-white text-sm transition-colors">
                예약하기
              </Link>
              <Link href={ROUTES.ANNOUNCEMENTS} className="block text-gray-300 hover:text-white text-sm transition-colors">
                공지사항
              </Link>
              <Link href={ROUTES.QNA} className="block text-gray-300 hover:text-white text-sm transition-colors">
                Q&A
              </Link>
              <Link href={ROUTES.LOCATION} className="block text-gray-300 hover:text-white text-sm transition-colors">
                오시는 길
              </Link>
            </div>
          </div>

          {/* 고객 서비스 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">고객 서비스</h4>
            <div className="space-y-2">
              <Link href={ROUTES.GUEST_RESERVATION} className="block text-gray-300 hover:text-white text-sm transition-colors">
                예약조회
              </Link>
              <Link href={ROUTES.LOGIN} className="block text-gray-300 hover:text-white text-sm transition-colors">
                로그인
              </Link>
              <Link href={ROUTES.REGISTER} className="block text-gray-300 hover:text-white text-sm transition-colors">
                회원가입
              </Link>
              <a href={`tel:${storeConfig.basic.phone}`} className="block text-gray-300 hover:text-white text-sm transition-colors">
                전화 문의
              </a>
            </div>
          </div>
        </div>

        {/* 입금 정보 */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2">입금 계좌 정보</h4>
            <p className="text-gray-300 text-sm">
              <strong>{bankAccount.bank} {bankAccount.accountNumber}</strong> ({bankAccount.accountHolder})
            </p>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} {storeConfig.basic.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}