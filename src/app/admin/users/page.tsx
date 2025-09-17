'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'MANAGER';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

interface UserReservation {
  id: string;
  user_id: string;
  total_count: number;
  completed_count: number;
  cancelled_count: number;
  total_amount: number;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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

    fetchUsersData();
  }, [router]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');

      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch('/api/admin/users/stats', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data.users || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setUserStats(statsData.data.stats || []);
      }

      setError(null);
    } catch (err) {
      console.error('Users data fetch error:', err);
      setError('사용자 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' ||
                         (statusFilter === 'ACTIVE' && user.is_active) ||
                         (statusFilter === 'INACTIVE' && !user.is_active) ||
                         (statusFilter === 'VERIFIED' && user.email_verified) ||
                         (statusFilter === 'UNVERIFIED' && !user.email_verified);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getUserStats = (userId: string) => {
    return userStats.find(stat => stat.user_id === userId) || {
      total_count: 0,
      completed_count: 0,
      cancelled_count: 0,
      total_amount: 0
    };
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-purple-100 text-purple-800';
      case 'CUSTOMER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return '관리자';
      case 'MANAGER': return '매니저';
      case 'CUSTOMER': return '고객';
      default: return '알 수 없음';
    }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">사용자 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">사용자 관리</h1>
          <p className="text-gray-600">시스템 사용자를 관리합니다.</p>
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
            <Button onClick={fetchUsersData} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            <p className="text-sm text-gray-600">전체 사용자</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
            <p className="text-sm text-gray-600">활성 사용자</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER').length}</p>
            <p className="text-sm text-gray-600">관리자</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{users.filter(u => u.email_verified).length}</p>
            <p className="text-sm text-gray-600">이메일 인증</p>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="이름, 이메일, 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">모든 역할</option>
                <option value="CUSTOMER">고객</option>
                <option value="MANAGER">매니저</option>
                <option value="ADMIN">관리자</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">모든 상태</option>
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
                <option value="VERIFIED">인증됨</option>
                <option value="UNVERIFIED">미인증</option>
              </select>
              <Button onClick={fetchUsersData} variant="outline" size="sm">
                새로고침
              </Button>
            </div>
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예약 현황</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const stats = getUserStats(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.is_active ? '활성' : '비활성'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.email_verified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.email_verified ? '인증됨' : '미인증'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          <div>총 예약: {stats.total_count}건</div>
                          <div>완료: {stats.completed_count}건</div>
                          <div>취소: {stats.cancelled_count}건</div>
                          <div className="font-medium">총액: {formatPrice(stats.total_amount)}원</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(user.created_at)}
                        </div>
                        {user.last_login_at && (
                          <div className="text-xs text-gray-500">
                            최근: {formatDate(user.last_login_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            상세
                          </Button>
                          <Button variant="outline" size="sm">
                            수정
                          </Button>
                          {user.role !== 'ADMIN' && (
                            <Button variant="outline" size="sm">
                              {user.is_active ? '비활성화' : '활성화'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl mb-4 block">👥</span>
            <p>검색 조건에 맞는 사용자가 없습니다.</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h4 className="font-semibold mb-4">역할별 통계</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                고객
              </span>
              <span className="font-semibold">{users.filter(u => u.role === 'CUSTOMER').length}명</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                매니저
              </span>
              <span className="font-semibold">{users.filter(u => u.role === 'MANAGER').length}명</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                관리자
              </span>
              <span className="font-semibold">{users.filter(u => u.role === 'ADMIN').length}명</span>
            </div>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">활동 상태</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>활성 사용자</span>
              <span className="font-semibold text-green-600">
                {users.filter(u => u.is_active).length}명
              </span>
            </div>
            <div className="flex justify-between">
              <span>비활성 사용자</span>
              <span className="font-semibold text-gray-600">
                {users.filter(u => !u.is_active).length}명
              </span>
            </div>
            <div className="flex justify-between">
              <span>이메일 인증</span>
              <span className="font-semibold text-blue-600">
                {users.filter(u => u.email_verified).length}명
              </span>
            </div>
            <div className="flex justify-between">
              <span>미인증</span>
              <span className="font-semibold text-yellow-600">
                {users.filter(u => !u.email_verified).length}명
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">예약 통계</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>총 예약 건수</span>
              <span className="font-semibold">
                {userStats.reduce((sum, stat) => sum + stat.total_count, 0)}건
              </span>
            </div>
            <div className="flex justify-between">
              <span>완료된 예약</span>
              <span className="font-semibold text-green-600">
                {userStats.reduce((sum, stat) => sum + stat.completed_count, 0)}건
              </span>
            </div>
            <div className="flex justify-between">
              <span>취소된 예약</span>
              <span className="font-semibold text-red-600">
                {userStats.reduce((sum, stat) => sum + stat.cancelled_count, 0)}건
              </span>
            </div>
            <div className="flex justify-between">
              <span>총 결제 금액</span>
              <span className="font-semibold text-blue-600">
                {formatPrice(userStats.reduce((sum, stat) => sum + stat.total_amount, 0))}원
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}