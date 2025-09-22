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
  type: string;
  capacity: number;
  weekday_price: number;
  weekend_price: number;
  amenities: string[];
  is_active: boolean;
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

  // 모달 상태
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showEditFacilityModal, setShowEditFacilityModal] = useState(false);
  const [showSiteManagementModal, setShowSiteManagementModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // 선택된 시설/구역 상태
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [facilityManagementSites, setFacilityManagementSites] = useState<Site[]>([]);

  // 시설 등록 폼 상태
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    description: '',
    type: '',
    capacity: 1,
    weekday_price: 0,
    weekend_price: 0,
    is_active: true,
    amenities: [] as string[]
  });

  // 구역 등록 폼 상태
  const [siteForm, setSiteForm] = useState({
    facility_id: '',
    site_number: '',
    name: '',
    description: '',
    capacity: 1,
    is_active: true
  });

  // 편의시설 태그 입력 상태
  const [amenityInput, setAmenityInput] = useState('');

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

  // 시설 등록 핸들러
  const handleSaveFacility = async () => {
    if (!facilityForm.name.trim() || !facilityForm.description.trim() || !facilityForm.type.trim()) {
      alert('시설명, 설명, 시설 유형을 모두 입력해주세요.');
      return;
    }

    if (facilityForm.capacity < 1 || facilityForm.weekday_price < 0 || facilityForm.weekend_price < 0) {
      alert('수용인원은 1명 이상, 요금은 0원 이상으로 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/facilities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(facilityForm)
      });

      if (response.ok) {
        alert('시설이 성공적으로 등록되었습니다.');
        setShowFacilityModal(false);
        setFacilityForm({
          name: '',
          description: '',
          type: '',
          capacity: 1,
          weekday_price: 0,
          weekend_price: 0,
          is_active: true,
          amenities: []
        });
        setAmenityInput('');
        fetchFacilitiesData();
      } else {
        throw new Error('등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('Facility save error:', err);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 구역 등록 핸들러
  const handleSaveSite = async () => {
    if (!siteForm.facility_id || !siteForm.site_number.trim() || !siteForm.name.trim() || siteForm.capacity < 1) {
      alert('소속 시설, 구역번호, 구역명, 수용인원(1명 이상)을 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(siteForm)
      });

      if (response.ok) {
        alert('구역이 성공적으로 등록되었습니다.');
        setShowSiteModal(false);
        setSiteForm({
          facility_id: '',
          site_number: '',
          name: '',
          description: '',
          capacity: 1,
          is_active: true
        });
        fetchFacilitiesData();
      } else {
        throw new Error('등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('Site save error:', err);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 편의시설 태그 추가
  const addAmenity = () => {
    if (amenityInput.trim() && !facilityForm.amenities.includes(amenityInput.trim())) {
      setFacilityForm({
        ...facilityForm,
        amenities: [...facilityForm.amenities, amenityInput.trim()]
      });
      setAmenityInput('');
    }
  };

  // 편의시설 태그 제거
  const removeAmenity = (amenityToRemove: string) => {
    setFacilityForm({
      ...facilityForm,
      amenities: facilityForm.amenities.filter(a => a !== amenityToRemove)
    });
  };

  // 시설 수정 모달 열기
  const openEditFacilityModal = (facility: Facility) => {
    setSelectedFacility(facility);
    setFacilityForm({
      name: facility.name,
      description: facility.description,
      type: facility.type,
      capacity: facility.capacity,
      weekday_price: facility.weekday_price,
      weekend_price: facility.weekend_price,
      is_active: facility.is_active,
      amenities: facility.amenities || []
    });
    setAmenityInput('');
    setShowEditFacilityModal(true);
  };

  // 시설 수정 핸들러
  const handleUpdateFacility = async () => {
    if (!selectedFacility) return;

    if (!facilityForm.name.trim() || !facilityForm.description.trim() || !facilityForm.type.trim()) {
      alert('시설명, 설명, 시설 유형을 모두 입력해주세요.');
      return;
    }

    if (facilityForm.capacity < 1 || facilityForm.weekday_price < 0 || facilityForm.weekend_price < 0) {
      alert('수용인원은 1명 이상, 요금은 0원 이상으로 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`/api/admin/facilities/${selectedFacility.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(facilityForm)
      });

      if (response.ok) {
        alert('시설이 성공적으로 수정되었습니다.');
        setShowEditFacilityModal(false);
        setSelectedFacility(null);
        setFacilityForm({
          name: '',
          description: '',
          type: '',
          capacity: 1,
          weekday_price: 0,
          weekend_price: 0,
          is_active: true,
          amenities: []
        });
        setAmenityInput('');
        fetchFacilitiesData();
      } else {
        throw new Error('수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('Facility update error:', err);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 시설 삭제 핸들러
  const handleDeleteFacility = async (facility: Facility) => {
    if (!confirm(`"${facility.name}" 시설을 삭제하시겠습니까?\n\n주의: 해당 시설의 모든 구역과 예약 정보도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`/api/admin/facilities/${facility.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        alert('시설이 성공적으로 삭제되었습니다.');
        fetchFacilitiesData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Facility delete error:', err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 구역 관리 모달 열기
  const openSiteManagementModal = async (facility: Facility) => {
    setSelectedFacility(facility);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/sites?facility_id=${facility.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFacilityManagementSites(data.data.sites || []);
      } else {
        setFacilityManagementSites([]);
      }
    } catch (err) {
      console.error('Sites fetch error:', err);
      setFacilityManagementSites([]);
    }

    setShowSiteManagementModal(true);
  };

  // 구역 수정 핸들러
  const handleUpdateSite = async (siteId: string, updatedData: { site_number?: string; name: string; description?: string; capacity?: number; is_active: boolean }) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`/api/admin/sites/${siteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        alert('구역이 성공적으로 수정되었습니다.');
        // 구역 목록 다시 로드
        if (selectedFacility) {
          openSiteManagementModal(selectedFacility);
        }
        fetchFacilitiesData();
      } else {
        throw new Error('수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('Site update error:', err);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  // 구역 삭제 핸들러
  const handleDeleteSite = async (site: Site) => {
    if (!confirm(`"${site.name}" 구역을 삭제하시겠습니까?\n\n주의: 해당 구역의 모든 예약 정보도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`/api/admin/sites/${site.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        alert('구역이 성공적으로 삭제되었습니다.');
        // 구역 목록 다시 로드
        if (selectedFacility) {
          openSiteManagementModal(selectedFacility);
        }
        fetchFacilitiesData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Site delete error:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
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

      {/* 대시보드 섹션 */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <span>평균 주중 요금</span>
              <span className="font-semibold">
                {facilities.length > 0
                  ? formatPrice(Math.round(facilities.reduce((sum, f) => sum + f.weekday_price, 0) / facilities.length))
                  : 0}원
              </span>
            </div>
            <div className="flex justify-between">
              <span>평균 주말 요금</span>
              <span className="font-semibold">
                {facilities.length > 0
                  ? formatPrice(Math.round(facilities.reduce((sum, f) => sum + f.weekend_price, 0) / facilities.length))
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
              <Button variant="primary" size="sm" onClick={() => setShowFacilityModal(true)}>
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

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">시설 유형</p>
                          <p className="text-lg font-semibold text-gray-900">{facility.type}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium">수용인원</p>
                          <p className="text-lg font-semibold text-blue-900">{facility.capacity}명</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">주중 요금</p>
                          <p className="text-lg font-semibold text-green-900">{formatPrice(facility.weekday_price)}원</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium">주말 요금</p>
                          <p className="text-lg font-semibold text-blue-900">{formatPrice(facility.weekend_price)}원</p>
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

                      {facility.amenities && facility.amenities.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-2">편의시설</p>
                          <div className="flex flex-wrap gap-1">
                            {facility.amenities.map((amenity, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {amenity}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSiteManagementModal(facility)}
                      >
                        구역 관리
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditFacilityModal(facility)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFacility(facility)}
                        disabled={saving}
                      >
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
              <Button variant="primary" className="mt-4" onClick={() => setShowFacilityModal(true)}>
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
              <Button variant="primary" size="sm" onClick={() => setShowSiteModal(true)}>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const newName = prompt('구역명을 입력하세요:', site.name);
                        if (newName && newName.trim() !== site.name) {
                          handleUpdateSite(site.id, { name: newName.trim(), is_active: site.is_active });
                        }
                      }}
                    >
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteSite(site)}
                    >
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
              <Button variant="primary" className="mt-4" onClick={() => setShowSiteModal(true)}>
                첫 번째 구역 등록하기
              </Button>
            </div>
          )}
        </Card>
      )}


      {/* 시설 등록 모달 */}
      {showFacilityModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFacilityModal(false);
              setFacilityForm({
                name: '',
                description: '',
                type: '',
                capacity: 1,
                weekday_price: 0,
                weekend_price: 0,
                is_active: true,
                amenities: []
              });
              setAmenityInput('');
            }
          }}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">새 시설 등록</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFacilityModal(false);
                    setFacilityForm({
                      name: '',
                      description: '',
                      type: '',
                      capacity: 1,
                      weekday_price: 0,
                      weekend_price: 0,
                      is_active: true,
                      amenities: []
                    });
                    setAmenityInput('');
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시설명 *
                    </label>
                    <input
                      type="text"
                      value={facilityForm.name}
                      onChange={(e) => setFacilityForm({...facilityForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="시설명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시설 유형 *
                    </label>
                    <select
                      value={facilityForm.type}
                      onChange={(e) => setFacilityForm({...facilityForm, type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">시설 유형 선택</option>
                      <option value="야외">야외</option>
                      <option value="실내">실내</option>
                      <option value="독채">독채</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상태
                    </label>
                    <select
                      value={facilityForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setFacilityForm({...facilityForm, is_active: e.target.value === 'active'})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">운영중</option>
                      <option value="inactive">비활성</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시설 설명 *
                  </label>
                  <textarea
                    value={facilityForm.description}
                    onChange={(e) => setFacilityForm({...facilityForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="시설에 대한 설명을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      수용인원 *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={facilityForm.capacity}
                      onChange={(e) => setFacilityForm({...facilityForm, capacity: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">최대 수용 가능한 인원 수</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주중 요금 (원) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={facilityForm.weekday_price}
                      onChange={(e) => setFacilityForm({...facilityForm, weekday_price: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">월~목 1타임 (3시간) 요금</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주말 요금 (원) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={facilityForm.weekend_price}
                      onChange={(e) => setFacilityForm({...facilityForm, weekend_price: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">금~일 1타임 (3시간) 요금</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시설 특징
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={amenityInput}
                      onChange={(e) => setAmenityInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="특징을 입력하고 Enter 또는 추가 버튼을 누르세요"
                    />
                    <Button type="button" onClick={addAmenity} variant="outline">
                      추가
                    </Button>
                  </div>
                  {facilityForm.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {facilityForm.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                        >
                          {amenity}
                          <button
                            type="button"
                            onClick={() => removeAmenity(amenity)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">예: 주차장, 화장실, 세면대, 그릴, 테이블 등</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFacilityModal(false);
                  setFacilityForm({
                    name: '',
                    description: '',
                    type: '',
                    capacity: 1,
                    weekday_price: 0,
                    weekend_price: 0,
                    is_active: true,
                    amenities: []
                  });
                  setAmenityInput('');
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveFacility}
                disabled={saving || !facilityForm.name.trim() || !facilityForm.description.trim()}
              >
                {saving ? '등록 중...' : '등록'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 구역 등록 모달 */}
      {showSiteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSiteModal(false);
              setSiteForm({
                facility_id: '',
                site_number: '',
                name: '',
                description: '',
                capacity: 1,
                is_active: true
              });
            }
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">새 구역 등록</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSiteModal(false);
                    setSiteForm({
                      facility_id: '',
                      site_number: '',
                      name: '',
                      description: '',
                      capacity: 1,
                      is_active: true
                    });
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    소속 시설 *
                  </label>
                  <select
                    value={siteForm.facility_id}
                    onChange={(e) => setSiteForm({...siteForm, facility_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">시설을 선택하세요</option>
                    {facilities.filter(f => f.is_active).map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name} (수용인원: {facility.capacity}명)
                      </option>
                    ))}
                  </select>
                  {facilities.filter(f => f.is_active).length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      운영중인 시설이 없습니다. 먼저 시설을 등록해주세요.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      구역번호 *
                    </label>
                    <input
                      type="text"
                      value={siteForm.site_number}
                      onChange={(e) => setSiteForm({...siteForm, site_number: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="구역번호를 입력하세요 (예: A-1, B-2)"
                    />
                    <p className="text-xs text-gray-500 mt-1">시설 내에서 고유한 번호</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      구역명 *
                    </label>
                    <input
                      type="text"
                      value={siteForm.name}
                      onChange={(e) => setSiteForm({...siteForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="구역명을 입력하세요 (예: 강변자리, VIP테이블)"
                    />
                    <p className="text-xs text-gray-500 mt-1">고객이 쉽게 찾을 수 있는 이름</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    구역 설명
                  </label>
                  <textarea
                    value={siteForm.description}
                    onChange={(e) => setSiteForm({...siteForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="구역에 대한 상세 설명을 입력하세요 (선택사항)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    구역 수용인원 *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={siteForm.capacity}
                    onChange={(e) => setSiteForm({...siteForm, capacity: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">이 구역에서 수용 가능한 최대 인원</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태
                  </label>
                  <select
                    value={siteForm.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setSiteForm({...siteForm, is_active: e.target.value === 'active'})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">운영중</option>
                    <option value="inactive">비활성</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">비활성 구역은 예약할 수 없습니다</p>
                </div>

                {siteForm.facility_id && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">선택된 시설 정보</h4>
                    {(() => {
                      const selectedFacility = facilities.find(f => f.id === siteForm.facility_id);
                      return selectedFacility ? (
                        <div className="text-sm text-blue-800">
                          <p><strong>시설명:</strong> {selectedFacility.name}</p>
                          <p><strong>수용인원:</strong> {selectedFacility.capacity}명</p>
                          <p><strong>기존 구역 수:</strong> {sites.filter(s => s.facility_id === selectedFacility.id).length}개</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSiteModal(false);
                  setSiteForm({
                    facility_id: '',
                    site_number: '',
                    name: '',
                    description: '',
                    capacity: 1,
                    is_active: true
                  });
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveSite}
                disabled={saving || !siteForm.facility_id || !siteForm.site_number.trim() || !siteForm.name.trim() || siteForm.capacity < 1 || facilities.filter(f => f.is_active).length === 0}
              >
                {saving ? '등록 중...' : '등록'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 시설 수정 모달 */}
      {showEditFacilityModal && selectedFacility && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditFacilityModal(false);
              setSelectedFacility(null);
              setFacilityForm({
                name: '',
                description: '',
                type: '',
                capacity: 1,
                weekday_price: 0,
                weekend_price: 0,
                is_active: true,
                amenities: []
              });
              setAmenityInput('');
            }
          }}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">시설 수정</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditFacilityModal(false);
                    setSelectedFacility(null);
                    setFacilityForm({
                      name: '',
                      description: '',
                      type: '',
                      capacity: 1,
                      weekday_price: 0,
                      weekend_price: 0,
                      is_active: true,
                      amenities: []
                    });
                    setAmenityInput('');
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시설명 *
                    </label>
                    <input
                      type="text"
                      value={facilityForm.name}
                      onChange={(e) => setFacilityForm({...facilityForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="시설명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시설 유형 *
                    </label>
                    <select
                      value={facilityForm.type}
                      onChange={(e) => setFacilityForm({...facilityForm, type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">시설 유형 선택</option>
                      <option value="야외">야외</option>
                      <option value="실내">실내</option>
                      <option value="독채">독채</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상태
                    </label>
                    <select
                      value={facilityForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setFacilityForm({...facilityForm, is_active: e.target.value === 'active'})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">운영중</option>
                      <option value="inactive">비활성</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시설 설명 *
                  </label>
                  <textarea
                    value={facilityForm.description}
                    onChange={(e) => setFacilityForm({...facilityForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="시설에 대한 설명을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      수용인원 *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={facilityForm.capacity}
                      onChange={(e) => setFacilityForm({...facilityForm, capacity: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">최대 수용 가능한 인원 수</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주중 요금 (원) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={facilityForm.weekday_price}
                      onChange={(e) => setFacilityForm({...facilityForm, weekday_price: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">월~목 1타임 (3시간) 요금</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주말 요금 (원) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={facilityForm.weekend_price}
                      onChange={(e) => setFacilityForm({...facilityForm, weekend_price: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">금~일 1타임 (3시간) 요금</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시설 특징
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={amenityInput}
                      onChange={(e) => setAmenityInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="특징을 입력하고 Enter 또는 추가 버튼을 누르세요"
                    />
                    <Button type="button" onClick={addAmenity} variant="outline">
                      추가
                    </Button>
                  </div>
                  {facilityForm.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {facilityForm.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                        >
                          {amenity}
                          <button
                            type="button"
                            onClick={() => removeAmenity(amenity)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">예: 주차장, 화장실, 세면대, 그릴, 테이블 등</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditFacilityModal(false);
                  setSelectedFacility(null);
                  setFacilityForm({
                    name: '',
                    description: '',
                    type: '',
                    capacity: 1,
                    weekday_price: 0,
                    weekend_price: 0,
                    is_active: true,
                    amenities: []
                  });
                  setAmenityInput('');
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateFacility}
                disabled={saving || !facilityForm.name.trim() || !facilityForm.description.trim()}
              >
                {saving ? '수정 중...' : '수정'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 구역 관리 모달 */}
      {showSiteManagementModal && selectedFacility && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSiteManagementModal(false);
              setSelectedFacility(null);
              setFacilityManagementSites([]);
            }
          }}
        >
          <div
            className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  구역 관리 - {selectedFacility.name}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSiteManagementModal(false);
                    setSelectedFacility(null);
                    setFacilityManagementSites([]);
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  등록된 구역 ({facilityManagementSites.length}개)
                </h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSiteForm({
                      facility_id: selectedFacility.id,
                      site_number: '',
                      name: '',
                      description: '',
                      capacity: 1,
                      is_active: true
                    });
                    setShowSiteModal(true);
                  }}
                >
                  새 구역 추가
                </Button>
              </div>

              {facilityManagementSites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facilityManagementSites.map((site) => (
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

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const newName = prompt('구역명을 입력하세요:', site.name);
                            if (newName && newName.trim() !== site.name) {
                              handleUpdateSite(site.id, { name: newName.trim(), is_active: site.is_active });
                            }
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const newStatus = !site.is_active;
                            handleUpdateSite(site.id, { name: site.name, is_active: newStatus });
                          }}
                        >
                          {site.is_active ? '비활성화' : '활성화'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeleteSite(site)}
                        >
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
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => {
                      setSiteForm({
                        facility_id: selectedFacility.id,
                        site_number: '',
                        name: '',
                        description: '',
                        capacity: 1,
                        is_active: true
                      });
                      setShowSiteModal(true);
                    }}
                  >
                    첫 번째 구역 등록하기
                  </Button>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSiteManagementModal(false);
                  setSelectedFacility(null);
                  setFacilityManagementSites([]);
                }}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}