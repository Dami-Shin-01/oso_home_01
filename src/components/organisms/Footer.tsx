import Link from 'next/link';
import { CONTACT_INFO, ROUTES } from '@/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">오소 바베큐장</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              자연 속에서 즐기는 특별한 바베큐 시간<br />
              가족, 친구들과 함께하는 소중한 추억을 만들어보세요.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p><strong>주소:</strong> {CONTACT_INFO.ADDRESS}</p>
              <p><strong>전화:</strong> {CONTACT_INFO.PHONE}</p>
              <p><strong>영업시간:</strong> {CONTACT_INFO.BUSINESS_HOURS}</p>
              <p><strong>휴무일:</strong> {CONTACT_INFO.CLOSED_DAY}</p>
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
              <a href={`tel:${CONTACT_INFO.PHONE}`} className="block text-gray-300 hover:text-white text-sm transition-colors">
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
              <strong>{CONTACT_INFO.BANK_ACCOUNT}</strong> ({CONTACT_INFO.ACCOUNT_HOLDER})
            </p>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} 오소 바베큐장. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}