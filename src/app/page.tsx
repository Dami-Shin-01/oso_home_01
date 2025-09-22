import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import VideoPlayButton from '@/components/atoms/VideoPlayButton';

export const revalidate = 300; // 5분마다 캐시 갱신

export default async function Home() {
  // 활성화된 시설 데이터 가져오기
  const { data: facilities } = await supabase
    .from('facilities')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(6); // 메인 페이지에는 최대 6개만 표시
  return (
    <div className="min-h-screen">
        {/* 히어로 섹션 */}
        <div className="hero min-h-screen relative overflow-hidden">
          {/* 배경 영상 */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover z-0 hidden md:block"
            poster="/images/hero-poster.jpg"
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
            <source src="/videos/hero-video.webm" type="video/webm" />
          </video>

          {/* 모바일용 정적 배경 이미지 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-focus md:hidden z-0"></div>

          {/* 영상 로드 실패 시 폴백 배경 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-focus -z-10"></div>

          {/* 다크 오버레이 */}
          <div className="absolute inset-0 bg-black/40 z-10"></div>

          {/* 영상 일시정지/재생 버튼 (선택사항) */}
          <VideoPlayButton />

          <div className="hero-content text-center text-white relative z-20">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">
                자연 속에서 즐기는
                <br />
                특별한 바베큐 시간 🍖
              </h1>
              <p className="py-6 text-lg">
                가족, 친구들과 함께하는 소중한 추억을 만들어보세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/reservation" className="btn btn-accent btn-lg">
                  지금 예약하기
                </Link>
                <Link href="/facilities" className="btn btn-outline btn-lg">
                  시설 둘러보기
                </Link>
              </div>

              {/* 간단한 검색 폼 */}
              <div className="mt-8 max-w-md mx-auto">
                <div className="bg-base-100/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <h3 className="text-lg font-semibold text-base-content mb-3">빠른 시설 검색</h3>
                  <div className="flex gap-2">
                    <select className="select select-bordered flex-1">
                      <option disabled selected>시설 유형 선택</option>
                      <option value="야외">야외</option>
                      <option value="실내">실내</option>
                      <option value="독채">독채</option>
                    </select>
                    <Link href="/facilities" className="btn btn-primary">
                      검색
                    </Link>
                  </div>
                  <p className="text-xs text-base-content/60 mt-2">
                    원하는 시설 유형을 선택하고 검색해보세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* 특징 섹션 */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-base-content mb-4">
              오소 바베큐장만의 특별함
            </h2>
            <p className="text-lg text-base-content/70">
              편리한 예약 시스템과 최고의 시설로 완벽한 바베큐를 즐기세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="avatar">
                  <div className="w-16 rounded-full bg-primary text-primary-content flex items-center justify-center">
                    <span className="text-2xl">📅</span>
                  </div>
                </div>
                <h3 className="card-title">간편한 예약</h3>
                <p>1,2,3부 시간대를 한눈에 확인하고 원하는 시간에 바로 예약</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="avatar">
                  <div className="w-16 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                    <span className="text-2xl">🏞️</span>
                  </div>
                </div>
                <h3 className="card-title">최고의 자연환경</h3>
                <p>깨끗하고 쾌적한 자연 속에서 즐기는 프리미엄 바베큐 공간</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="avatar">
                  <div className="w-16 rounded-full bg-accent text-accent-content flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
                <h3 className="card-title">완벽한 시설</h3>
                <p>모든 필수 시설과 장비가 구비되어 편리하게 이용 가능</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 공간 소개 미리보기 */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-base-content mb-4">
              다양한 공간 타입
            </h2>
            <p className="text-lg text-base-content/70">
              용도와 인원에 맞는 최적의 공간을 선택하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities && facilities.length > 0 ? (
              facilities.map((facility) => (
                <div key={facility.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                  <figure className="px-4 pt-4">
                    <div className="aspect-video bg-base-200 rounded-lg w-full flex items-center justify-center">
                      <span className="text-base-content/50">이미지 준비중</span>
                    </div>
                  </figure>
                  <div className="card-body">
                    <h3 className="card-title">{facility.name}</h3>
                    <p className="text-sm text-base-content/70 mb-2">
                      {facility.description}
                    </p>
                    <div className="text-xs text-base-content/60 mb-4">
                      <span className="badge badge-outline badge-sm mr-2">{facility.type}</span>
                      <span>수용인원: {facility.capacity}명</span>
                    </div>
                    <div className="card-actions justify-end">
                      <Link href="/facilities" className="btn btn-primary btn-sm">
                        자세히 보기
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-base-content/50">등록된 시설이 없습니다.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link href="/facilities" className="btn btn-primary btn-lg">
              모든 시설 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
