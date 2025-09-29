import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedImageUrl } from '@/lib/image-utils';

interface Facility {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  images?: any;
}

interface FacilitiesSectionProps {
  facilities: Facility[] | null;
}

export default function FacilitiesSection({ facilities }: FacilitiesSectionProps) {
  return (
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
                  {getFeaturedImageUrl(facility.images, 'medium') ? (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                      <Image
                        src={getFeaturedImageUrl(facility.images, 'medium')!}
                        alt={facility.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy" // 중요한 이미지만 eager, 나머지는 lazy
                        quality={85}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg w-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏕️</div>
                        <span className="text-base-content/60 text-sm">이미지 준비중</span>
                      </div>
                    </div>
                  )}
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
  );
}
