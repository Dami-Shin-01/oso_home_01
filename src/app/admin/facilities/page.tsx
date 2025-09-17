'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';

interface Facility {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price_per_hour: number;
  is_active: boolean;
  features: string[];
  created_at: string;
  updated_at: string;
}

interface Site {
  id: string;
  facility_id: string;
  name: string;
  is_active: boolean;
  facility: {
    name: string;
  } | null;
}

export default function FacilitiesManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'facilities' | 'sites'>('facilities');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (!userData || !accessToken) {
        router.push('/login');
        return false;
      }

      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'MANAGER') {
        alert('관리자 권한이 필요합니다.');
        router.push('/admin');
        return false;
      }

      return true;
    };

    if (!checkAuth()) return;

    fetchFacilitiesData();
  }, [router]);

  const fetchFacilitiesData = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');

      const [facilitiesRes, sitesRes] = await Promise.all([
        fetch('/api/admin/facilities', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch('/api/admin/sites', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      if (facilitiesRes.ok) {
        const facilitiesData = await facilitiesRes.json();
        setFacilities(facilitiesData.data.facilities || []);
      }

      if (sitesRes.ok) {
        const sitesData = await sitesRes.json();
        setSites(sitesData.data.sites || []);
      }

      setError(null);
    } catch (err) {
      console.error('Facilities data fetch error:', err);
      setError('시설 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">시설 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">시설 관리</h1>
          <p className="text-gray-600">바베큐 시설과 구역을 관리합니다.</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            ← 대시보드로 돌아가기
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6">
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchFacilitiesData} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('facilities')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'facilities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              시설 ({facilities.length})
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sites'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              구역 ({sites.length})
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'facilities' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">시설 목록</h3>
            <div className="flex space-x-2">
              <Button onClick={fetchFacilitiesData} variant="outline" size="sm">
                새로고침
              </Button>
              <Button variant="primary" size="sm">
                새 시설 등록
              </Button>
            </div>
          </div>

          {facilities.length > 0 ? (
            <div className="space-y-4">
              {facilities.map((facility) => (
                <div key={facility.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-lg">{facility.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          facility.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {facility.is_active ? '운영중' : '비활성'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{facility.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium">수용인원</p>
                          <p className="text-lg font-semibold text-blue-900">{facility.capacity}명</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">시간당 요금</p>
                          <p className="text-lg font-semibold text-green-900">{formatPrice(facility.price_per_hour)}원</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-purple-600 font-medium">등록 구역</p>
                          <p className="text-lg font-semibold text-purple-900">
                            {sites.filter(s => s.facility_id === facility.id).length}개
                          </p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-xs text-orange-600 font-medium">활성 구역</p>
                          <p className="text-lg font-semibold text-orange-900">
                            {sites.filter(s => s.facility_id === facility.id && s.is_active).length}개
                          </p>
                        </div>
                      </div>

                      {facility.features && facility.features.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-2">시설 특징</p>
                          <div className="flex flex-wrap gap-1">
                            {facility.features.map((feature, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>등록일: {formatDate(facility.created_at)}</span>
                        {facility.updated_at !== facility.created_at && (
                          <span>수정일: {formatDate(facility.updated_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        구역 관리
                      </Button>
                      <Button variant="outline" size="sm">
                        수정
                      </Button>
                      <Button variant="outline" size="sm">
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">🏢</span>
              <p>등록된 시설이 없습니다.</p>
              <Button variant="primary" className="mt-4">
                첫 번째 시설 등록하기
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'sites' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">구역 목록</h3>
            <div className="flex space-x-2">
              <Button onClick={fetchFacilitiesData} variant="outline" size="sm">
                새로고침
              </Button>
              <Button variant="primary" size="sm">
                새 구역 등록
              </Button>
            </div>
          </div>

          {sites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map((site) => (
                <div key={site.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-lg">{site.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      site.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {site.is_active ? '운영중' : '비활성'}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      소속 시설: <span className="font-medium">{site.facility?.name || '알 수 없음'}</span>
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      수정
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">📍</span>
              <p>등록된 구역이 없습니다.</p>
              <Button variant="primary" className="mt-4">
                첫 번째 구역 등록하기
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h4 className="font-semibold mb-4">시설 통계</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>전체 시설</span>
              <span className="font-semibold">{facilities.length}개</span>
            </div>
            <div className="flex justify-between">
              <span>운영중</span>
              <span className="font-semibold text-green-600">
                {facilities.filter(f => f.is_active).length}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>평균 수용인원</span>
              <span className="font-semibold">
                {facilities.length > 0
                  ? Math.round(facilities.reduce((sum, f) => sum + f.capacity, 0) / facilities.length)
                  : 0}명
              </span>
            </div>
            <div className="flex justify-between">
              <span>평균 시간당 요금</span>
              <span className="font-semibold">
                {facilities.length > 0
                  ? formatPrice(Math.round(facilities.reduce((sum, f) => sum + f.price_per_hour, 0) / facilities.length))
                  : 0}원
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">구역 통계</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>전체 구역</span>
              <span className="font-semibold">{sites.length}개</span>
            </div>
            <div className="flex justify-between">
              <span>운영중</span>
              <span className="font-semibold text-green-600">
                {sites.filter(s => s.is_active).length}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>시설당 평균 구역</span>
              <span className="font-semibold">
                {facilities.length > 0
                  ? Math.round(sites.length / facilities.length * 10) / 10
                  : 0}개
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">운영 현황</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>활성 시설 비율</span>
              <span className="font-semibold text-green-600">
                {facilities.length > 0
                  ? Math.round(facilities.filter(f => f.is_active).length / facilities.length * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>활성 구역 비율</span>
              <span className="font-semibold text-green-600">
                {sites.length > 0
                  ? Math.round(sites.filter(s => s.is_active).length / sites.length * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>총 수용 가능 인원</span>
              <span className="font-semibold text-blue-600">
                {facilities.filter(f => f.is_active).reduce((sum, f) => sum + f.capacity, 0)}명
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}