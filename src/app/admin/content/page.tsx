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

  // 작성 모달 상태
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // 수정 모달 상태
  const [showEditNoticeModal, setShowEditNoticeModal] = useState(false);
  const [showEditFaqModal, setShowEditFaqModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

  // 공지사항 작성 폼 상태
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    is_important: false,
    is_published: false
  });

  // FAQ 작성 폼 상태
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    order_index: 1,
    is_published: false
  });

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

  // 공지사항 저장
  const handleSaveNotice = async () => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noticeForm)
      });

      if (response.ok) {
        alert('공지사항이 성공적으로 저장되었습니다.');
        setShowNoticeModal(false);
        setNoticeForm({
          title: '',
          content: '',
          is_important: false,
          is_published: false
        });
        fetchContentData();
      } else {
        throw new Error('저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('Notice save error:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // FAQ 저장
  const handleSaveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      alert('질문과 답변을 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(faqForm)
      });

      if (response.ok) {
        alert('FAQ가 성공적으로 저장되었습니다.');
        setShowFaqModal(false);
        setFaqForm({
          question: '',
          answer: '',
          category: 'general',
          order_index: 1,
          is_published: false
        });
        fetchContentData();
      } else {
        throw new Error('저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('FAQ save error:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 공지사항 수정 함수
  const handleEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title,
      content: notice.content,
      is_important: notice.is_important,
      is_published: notice.is_published
    });
    setShowEditNoticeModal(true);
  };

  const handleUpdateNotice = async () => {
    if (!editingNotice) return;

    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/notices/${editingNotice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(noticeForm)
      });

      if (response.ok) {
        alert('공지사항이 성공적으로 수정되었습니다.');
        setShowEditNoticeModal(false);
        setEditingNotice(null);
        setNoticeForm({
          title: '',
          content: '',
          is_important: false,
          is_published: false
        });
        fetchContentData();
      } else {
        throw new Error('수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('Notice update error:', err);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotice = async (notice: Notice) => {
    if (!confirm(`"${notice.title}" 공지사항을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/notices/${notice.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        alert('공지사항이 성공적으로 삭제되었습니다.');
        fetchContentData();
      } else {
        throw new Error('삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Notice delete error:', err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // FAQ 수정 함수
  const handleEditFaq = (faq: FAQ) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order_index: faq.order_index,
      is_published: faq.is_published
    });
    setShowEditFaqModal(true);
  };

  const handleUpdateFaq = async () => {
    if (!editingFaq) return;

    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      alert('질문과 답변을 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/faqs/${editingFaq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(faqForm)
      });

      if (response.ok) {
        alert('FAQ가 성공적으로 수정되었습니다.');
        setShowEditFaqModal(false);
        setEditingFaq(null);
        setFaqForm({
          question: '',
          answer: '',
          category: 'general',
          order_index: 1,
          is_published: false
        });
        fetchContentData();
      } else {
        throw new Error('수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('FAQ update error:', err);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (faq: FAQ) => {
    if (!confirm(`"${faq.question}" FAQ를 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/faqs/${faq.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        alert('FAQ가 성공적으로 삭제되었습니다.');
        fetchContentData();
      } else {
        throw new Error('삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('FAQ delete error:', err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
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
              <Button variant="primary" size="sm" onClick={() => setShowNoticeModal(true)}>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditNotice(notice)}
                        disabled={saving}
                      >
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNotice(notice)}
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
              <Button variant="primary" size="sm" onClick={() => setShowFaqModal(true)}>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditFaq(faq)}
                        disabled={saving}
                      >
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFaq(faq)}
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

      {/* 공지사항 작성 모달 */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">새 공지사항 작성</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNoticeModal(false);
                    setNoticeForm({
                      title: '',
                      content: '',
                      is_important: false,
                      is_published: false
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
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="공지사항 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용 *
                  </label>
                  <textarea
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm({...noticeForm, content: e.target.value})}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="공지사항 내용을 입력하세요"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={noticeForm.is_important}
                      onChange={(e) => setNoticeForm({...noticeForm, is_important: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">중요 공지사항</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={noticeForm.is_published}
                      onChange={(e) => setNoticeForm({...noticeForm, is_published: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">즉시 발행</span>
                  </label>
                </div>

                {!noticeForm.is_published && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 즉시 발행을 체크하지 않으면 초안으로 저장되며, 나중에 &apos;미발행 공지사항 관리&apos; 페이지에서 검토 후 발행할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNoticeModal(false);
                  setNoticeForm({
                    title: '',
                    content: '',
                    is_important: false,
                    is_published: false
                  });
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveNotice}
                disabled={saving || !noticeForm.title.trim() || !noticeForm.content.trim()}
              >
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ 작성 모달 */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">새 FAQ 작성</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFaqModal(false);
                    setFaqForm({
                      question: '',
                      answer: '',
                      category: 'general',
                      order_index: 1,
                      is_published: false
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
                    질문 *
                  </label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({...faqForm, question: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="자주 묻는 질문을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    답변 *
                  </label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="질문에 대한 답변을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리
                    </label>
                    <select
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({...faqForm, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">일반</option>
                      <option value="reservation">예약</option>
                      <option value="facility">시설</option>
                      <option value="payment">결제</option>
                      <option value="policy">정책</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      표시 순서
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={faqForm.order_index}
                      onChange={(e) => setFaqForm({...faqForm, order_index: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={faqForm.is_published}
                      onChange={(e) => setFaqForm({...faqForm, is_published: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">즉시 발행</span>
                  </label>
                </div>

                {!faqForm.is_published && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 즉시 발행을 체크하지 않으면 초안으로 저장되며, 나중에 FAQ 목록에서 개별적으로 발행할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFaqModal(false);
                  setFaqForm({
                    question: '',
                    answer: '',
                    category: 'general',
                    order_index: 1,
                    is_published: false
                  });
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveFaq}
                disabled={saving || !faqForm.question.trim() || !faqForm.answer.trim()}
              >
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 공지사항 수정 모달 */}
      {showEditNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">공지사항 수정</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditNoticeModal(false);
                    setEditingNotice(null);
                    setNoticeForm({
                      title: '',
                      content: '',
                      is_important: false,
                      is_published: false
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
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({...noticeForm, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="공지사항 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용 *
                  </label>
                  <textarea
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm({...noticeForm, content: e.target.value})}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="공지사항 내용을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-notice-important"
                      checked={noticeForm.is_important}
                      onChange={(e) => setNoticeForm({...noticeForm, is_important: e.target.checked})}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-notice-important" className="ml-2 block text-sm text-gray-900">
                      중요 공지사항
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-notice-published"
                      checked={noticeForm.is_published}
                      onChange={(e) => setNoticeForm({...noticeForm, is_published: e.target.checked})}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-notice-published" className="ml-2 block text-sm text-gray-900">
                      즉시 발행
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditNoticeModal(false);
                  setEditingNotice(null);
                  setNoticeForm({
                    title: '',
                    content: '',
                    is_important: false,
                    is_published: false
                  });
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateNotice}
                disabled={saving || !noticeForm.title.trim() || !noticeForm.content.trim()}
              >
                {saving ? '수정 중...' : '수정 완료'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ 수정 모달 */}
      {showEditFaqModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">FAQ 수정</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditFaqModal(false);
                    setEditingFaq(null);
                    setFaqForm({
                      question: '',
                      answer: '',
                      category: 'general',
                      order_index: 1,
                      is_published: false
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
                    질문 *
                  </label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({...faqForm, question: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="자주 묻는 질문을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    답변 *
                  </label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="질문에 대한 답변을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리
                    </label>
                    <select
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({...faqForm, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">일반</option>
                      <option value="reservation">예약</option>
                      <option value="facility">시설</option>
                      <option value="payment">결제</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      순서
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={faqForm.order_index}
                      onChange={(e) => setFaqForm({...faqForm, order_index: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="edit-faq-published"
                      checked={faqForm.is_published}
                      onChange={(e) => setFaqForm({...faqForm, is_published: e.target.checked})}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-faq-published" className="ml-2 block text-sm text-gray-900">
                      즉시 발행
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditFaqModal(false);
                  setEditingFaq(null);
                  setFaqForm({
                    question: '',
                    answer: '',
                    category: 'general',
                    order_index: 1,
                    is_published: false
                  });
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateFaq}
                disabled={saving || !faqForm.question.trim() || !faqForm.answer.trim()}
              >
                {saving ? '수정 중...' : '수정 완료'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}