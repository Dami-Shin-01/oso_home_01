'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';

interface UnpublishedNotice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  is_published: boolean;
  author: {
    id: string;
    name: string;
    email?: string;
  } | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function UnpublishedNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<UnpublishedNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<UnpublishedNotice | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

    fetchUnpublishedNotices();
  }, [router]);

  const fetchUnpublishedNotices = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/public/notices?is_published=false&limit=50', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotices(data.data.notices || []);
      } else {
        // 샘플 데이터
        setNotices([
          {
            id: 'notice-1',
            title: '추석 연휴 운영 안내',
            content: `안녕하세요, 오소바베큐입니다.

추석 연휴 기간 중 운영 안내 말씀드립니다.

📅 운영 일정:
- 9월 28일(목): 정상 운영
- 9월 29일(금) ~ 10월 1일(일): 휴무
- 10월 2일(월): 정상 운영 재개

추석 연휴 동안 예약은 10월 2일부터 가능합니다.
가족과 함께 즐거운 추석 연휴 보내세요!

문의사항이 있으시면 언제든 연락 주세요.
감사합니다.`,
            is_important: true,
            is_published: false,
            author: {
              id: 'admin-1',
              name: '오소 관리자',
              email: 'admin@osobbq.com'
            },
            view_count: 0,
            created_at: '2025-09-17T09:30:00Z',
            updated_at: '2025-09-17T09:30:00Z'
          },
          {
            id: 'notice-2',
            title: '신메뉴 출시 안내',
            content: `바베큐를 더욱 맛있게 즐길 수 있는 신메뉴를 출시합니다!

🥩 신메뉴 소개:
- 프리미엄 한우 세트 (4인용)
- 해산물 바베큐 세트 (2인용)
- 채식주의자를 위한 버섯 세트

📅 출시일: 10월 1일(일)부터
💰 특별 할인: 출시 기념 20% 할인 (10월 한 달간)

자세한 메뉴 구성과 가격은 예약 시 확인하실 수 있습니다.
많은 관심과 사랑 부탁드립니다!`,
            is_important: false,
            is_published: false,
            author: {
              id: 'manager-1',
              name: '김매니저',
              email: 'manager@osobbq.com'
            },
            view_count: 0,
            created_at: '2025-09-16T14:15:00Z',
            updated_at: '2025-09-17T08:20:00Z'
          },
          {
            id: 'notice-3',
            title: '주차장 확장 공사 안내',
            content: `고객 여러분의 편의를 위해 주차장 확장 공사를 진행합니다.

🚧 공사 기간: 10월 5일(목) ~ 10월 10일(화)
🚗 공사 기간 중 주차 안내:
- 기존 주차장의 절반만 사용 가능
- 인근 공영주차장 이용 시 주차비 지원
- 발렛파킹 서비스 임시 운영

공사로 인한 불편을 최소화하도록 노력하겠습니다.
양해 부탁드립니다.`,
            is_important: false,
            is_published: false,
            author: {
              id: 'admin-1',
              name: '오소 관리자',
              email: 'admin@osobbq.com'
            },
            view_count: 0,
            created_at: '2025-09-15T16:45:00Z',
            updated_at: '2025-09-16T10:30:00Z'
          }
        ]);
      }

      setError(null);
    } catch (err) {
      console.error('Unpublished notices fetch error:', err);
      setError('미발행 공지사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeAction = async (noticeId: string, action: 'publish' | 'delete') => {
    try {
      setProcessingId(noticeId);
      const accessToken = localStorage.getItem('accessToken');

      if (action === 'publish') {
        const response = await fetch(`/api/admin/notices/${noticeId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_published: true
          })
        });

        if (response.ok) {
          alert('공지사항이 성공적으로 발행되었습니다.');
          fetchUnpublishedNotices();
        } else {
          throw new Error('발행 처리 중 오류가 발생했습니다.');
        }
      } else if (action === 'delete') {
        if (confirm('정말로 이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
          const response = await fetch(`/api/admin/notices/${noticeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (response.ok) {
            alert('공지사항이 삭제되었습니다.');
            fetchUnpublishedNotices();
          } else {
            throw new Error('삭제 처리 중 오류가 발생했습니다.');
          }
        }
      }
    } catch (err) {
      console.error('Notice action error:', err);
      alert(action === 'publish' ? '발행 처리 중 오류가 발생했습니다.' : '삭제 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">미발행 공지사항을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">미발행 공지사항 관리</h1>
          <p className="text-gray-600">작성된 공지사항을 검토하고 발행하거나 삭제할 수 있습니다.</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchUnpublishedNotices} variant="outline" disabled={loading}>
            {loading ? '새로고침 중...' : '새로고침'}
          </Button>
          <Link href="/admin/content">
            <Button variant="primary">
              새 공지사항 작성
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">
              ← 대시보드로 돌아가기
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="mb-6">
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchUnpublishedNotices} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-6">
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📝</span>
            <div>
              <h3 className="font-semibold text-orange-800">발행 대기 중인 공지사항: {notices.length}건</h3>
              <p className="text-orange-700 text-sm">검토 후 빠른 발행 처리를 부탁드립니다.</p>
            </div>
          </div>
        </Card>
      </div>

      {notices.length > 0 ? (
        <div className="space-y-6">
          {notices.map((notice) => (
            <Card key={notice.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded-full">
                    발행 대기
                  </span>
                  {notice.is_important && (
                    <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                      중요
                    </span>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>작성일: {formatDateTime(notice.created_at)}</p>
                  {notice.updated_at !== notice.created_at && (
                    <p>수정일: {formatDateTime(notice.updated_at)}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{notice.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>작성자: {notice.author?.name || '알 수 없음'}</span>
                  {notice.author?.email && (
                    <span>({notice.author.email})</span>
                  )}
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                  {notice.content.length > 300
                    ? `${notice.content.substring(0, 300)}...`
                    : notice.content}
                </p>
                {notice.content.length > 300 && (
                  <button
                    onClick={() => {
                      setSelectedNotice(notice);
                      setShowPreview(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                  >
                    전체 내용 보기
                  </button>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedNotice(notice);
                    setShowPreview(true);
                  }}
                >
                  미리보기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNoticeAction(notice.id, 'delete')}
                  disabled={processingId === notice.id}
                >
                  삭제
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (confirm('이 공지사항을 발행하시겠습니까? 발행 후 고객들이 확인할 수 있습니다.')) {
                      handleNoticeAction(notice.id, 'publish');
                    }
                  }}
                  disabled={processingId === notice.id}
                >
                  {processingId === notice.id ? '처리 중...' : '발행'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">✅</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">모든 공지사항이 발행되었습니다</h3>
            <p className="text-gray-600 mb-4">현재 발행 대기 중인 공지사항이 없습니다.</p>
            <div className="flex justify-center space-x-2">
              <Link href="/admin/content">
                <Button variant="primary">
                  새 공지사항 작성
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline">
                  대시보드로 돌아가기
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* 미리보기 모달 */}
      {showPreview && selectedNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedNotice.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>작성자: {selectedNotice.author?.name || '알 수 없음'}</span>
                    <span>작성일: {formatDateTime(selectedNotice.created_at)}</span>
                    {selectedNotice.is_important && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">중요</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedNotice(null);
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {formatContent(selectedNotice.content)}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  setSelectedNotice(null);
                }}
              >
                닫기
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (confirm('이 공지사항을 발행하시겠습니까?')) {
                    handleNoticeAction(selectedNotice.id, 'publish');
                    setShowPreview(false);
                    setSelectedNotice(null);
                  }
                }}
              >
                발행하기
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h4 className="font-semibold mb-4">발행 전 체크리스트</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>□ 제목이 명확하고 이해하기 쉬운가?</p>
            <p>□ 내용에 오타나 문법 오류가 없는가?</p>
            <p>□ 중요한 정보가 빠뜨리지 않았는가?</p>
            <p>□ 고객에게 도움이 되는 내용인가?</p>
            <p>□ 발행 시기가 적절한가?</p>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">빠른 액션</h4>
          <div className="space-y-2">
            <Link href="/admin/content">
              <Button variant="outline" size="sm" className="w-full">
                공지사항 관리
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm" className="w-full">
                공지사항 조회 분석
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">통계</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>발행 대기</span>
              <span className="font-semibold text-orange-600">{notices.length}건</span>
            </div>
            <div className="flex justify-between">
              <span>중요 공지</span>
              <span className="font-semibold text-red-600">
                {notices.filter(n => n.is_important).length}건
              </span>
            </div>
            <div className="flex justify-between">
              <span>최근 작성</span>
              <span className="font-semibold text-blue-600">
                {notices.filter(n => {
                  const createdDate = new Date(n.created_at);
                  const today = new Date();
                  const diffTime = Math.abs(today.getTime() - createdDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                }).length}건
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}