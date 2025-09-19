import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary opacity-50">404</h1>
          <h2 className="text-3xl font-bold text-base-content mt-4 mb-2">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-lg text-base-content/70 mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-base-content/60">다음 중 하나를 시도해보세요:</p>
          <ul className="text-sm text-base-content/60 space-y-2">
            <li>• 주소가 정확한지 확인해주세요</li>
            <li>• 메인 페이지에서 다시 시작해보세요</li>
            <li>• 검색 기능을 이용해보세요</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn btn-primary btn-lg">
            🏠 메인 페이지로
          </Link>
          <Link href="/facilities" className="btn btn-outline btn-lg">
            🏢 시설 둘러보기
          </Link>
          <Link href="/reservation" className="btn btn-secondary btn-lg">
            📅 예약하기
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-base-300">
          <p className="text-sm text-base-content/50">
            문제가 지속되면{' '}
            <a href="tel:02-1234-5678" className="link link-primary">
              고객센터 (02-1234-5678)
            </a>
            로 연락해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}