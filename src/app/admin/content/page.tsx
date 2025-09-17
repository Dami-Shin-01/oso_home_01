'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';

interface Notice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
  } | null;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function ContentManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'notices' | 'faqs'>('notices');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 확인
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

    fetchContentData();
  }, [router]);

  const fetchContentData = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');

      const [noticesRes, faqsRes] = await Promise.all([
        fetch('/api/public/notices?limit=20', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch('/api/public/faqs?limit=50', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      if (noticesRes.ok) {
        const noticesData = await noticesRes.json();
        setNotices(noticesData.data.notices);
      }

      if (faqsRes.ok) {
        const faqsData = await faqsRes.json();
        setFaqs(faqsData.data.faqs);
      }

      setError(null);
    } catch (err) {
      console.error('Content data fetch error:', err);
      setError('콘텐츠 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">콘텐츠 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">콘텐츠 관리</h1>
          <p className="text-gray-600">공지사항과 FAQ를 관리합니다.</p>
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
            <Button onClick={fetchContentData} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {/* 탭 메뉴 */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('notices')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              공지사항 ({notices.length})
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'faqs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              FAQ ({faqs.length})
            </button>
          </nav>
        </div>
      </div>

      {/* 공지사항 탭 */}
      {activeTab === 'notices' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">공지사항 목록</h3>
            <div className="flex space-x-2">
              <Button onClick={fetchContentData} variant="outline" size="sm">
                새로고침
              </Button>
              <Button variant="primary" size="sm">
                새 공지사항 작성
              </Button>
            </div>
          </div>

          {notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div key={notice.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-lg">{notice.title}</h4>
                        {notice.is_important && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            중요
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          notice.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {notice.is_published ? '게시중' : '비공개'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {notice.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>조회수: {notice.view_count}</span>
                        <span>작성자: {notice.author?.name || '알 수 없음'}</span>
                        <span>작성일: {formatDate(notice.created_at)}</span>
                        {notice.updated_at !== notice.created_at && (
                          <span>수정일: {formatDate(notice.updated_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
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
              <span className="text-4xl mb-4 block">📝</span>
              <p>등록된 공지사항이 없습니다.</p>
              <Button variant="primary" className="mt-4">
                첫 번째 공지사항 작성하기
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* FAQ 탭 */}
      {activeTab === 'faqs' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">FAQ 목록</h3>
            <div className="flex space-x-2">
              <Button onClick={fetchContentData} variant="outline" size="sm">
                새로고침
              </Button>
              <Button variant="primary" size="sm">
                새 FAQ 작성
              </Button>
            </div>
          </div>

          {faqs.length > 0 ? (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {faq.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          순서: {faq.order_index}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          faq.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {faq.is_published ? '게시중' : '비공개'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">{faq.question}</h4>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {faq.answer.substring(0, 150)}...
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>작성일: {formatDate(faq.created_at)}</span>
                        {faq.updated_at !== faq.created_at && (
                          <span>수정일: {formatDate(faq.updated_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
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
              <span className="text-4xl mb-4 block">❓</span>
              <p>등록된 FAQ가 없습니다.</p>
              <Button variant="primary" className="mt-4">
                첫 번째 FAQ 작성하기
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* 통계 카드 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h4 className="font-semibold mb-4">공지사항 통계</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>전체 공지사항</span>
              <span className="font-semibold">{notices.length}개</span>
            </div>
            <div className="flex justify-between">
              <span>게시중</span>
              <span className="font-semibold text-green-600">
                {notices.filter(n => n.is_published).length}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>중요 공지</span>
              <span className="font-semibold text-red-600">
                {notices.filter(n => n.is_important).length}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>총 조회수</span>
              <span className="font-semibold">
                {notices.reduce((sum, n) => sum + n.view_count, 0).toLocaleString()}회
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">FAQ 통계</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>전체 FAQ</span>
              <span className="font-semibold">{faqs.length}개</span>
            </div>
            <div className="flex justify-between">
              <span>게시중</span>
              <span className="font-semibold text-green-600">
                {faqs.filter(f => f.is_published).length}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>예약 관련</span>
              <span className="font-semibold">
                {faqs.filter(f => f.category === 'reservation').length}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>시설 관련</span>
              <span className="font-semibold">
                {faqs.filter(f => f.category === 'facility').length}개
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}