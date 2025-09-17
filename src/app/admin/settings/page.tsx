'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';

interface SystemSettings {
  general: {
    siteName: string;
    description: string;
    adminEmail: string;
    supportPhone: string;
    businessHours: {
      start: string;
      end: string;
      closed: string[];
    };
  };
  reservation: {
    maxAdvanceDays: number;
    minAdvanceHours: number;
    maxDurationHours: number;
    allowCancellation: boolean;
    cancellationDeadlineHours: number;
    autoConfirm: boolean;
  };
  payment: {
    enablePayment: boolean;
    depositRate: number;
    cancelFeeRate: number;
    refundPolicy: string;
  };
  notification: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    reservationConfirm: boolean;
    reminderHours: number;
    adminNotify: boolean;
  };
  maintenance: {
    lastBackup: string;
    dbVersion: string;
    systemVersion: string;
    debugMode: boolean;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'reservation' | 'payment' | 'notification' | 'maintenance'>('general');

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (!userData || !accessToken) {
        router.push('/login');
        return false;
      }

      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'ADMIN') {
        alert('최고 관리자 권한이 필요합니다.');
        router.push('/admin');
        return false;
      }

      return true;
    };

    if (!checkAuth()) return;

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        setSettings({
          general: {
            siteName: '바베큐 예약 시스템',
            description: '최고의 바베큐 시설을 예약하세요',
            adminEmail: 'admin@bbq-reservation.com',
            supportPhone: '02-1234-5678',
            businessHours: {
              start: '09:00',
              end: '22:00',
              closed: ['일요일']
            }
          },
          reservation: {
            maxAdvanceDays: 30,
            minAdvanceHours: 2,
            maxDurationHours: 8,
            allowCancellation: true,
            cancellationDeadlineHours: 24,
            autoConfirm: false
          },
          payment: {
            enablePayment: true,
            depositRate: 30,
            cancelFeeRate: 10,
            refundPolicy: '예약 취소 시 수수료를 제외한 금액이 환불됩니다.'
          },
          notification: {
            emailEnabled: true,
            smsEnabled: false,
            reservationConfirm: true,
            reminderHours: 24,
            adminNotify: true
          },
          maintenance: {
            lastBackup: '2025-09-17T10:00:00Z',
            dbVersion: '1.0.0',
            systemVersion: '1.0.0',
            debugMode: false
          }
        });
      }

      setError(null);
    } catch (err) {
      console.error('Settings fetch error:', err);
      setError('설정을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        alert('설정이 성공적으로 저장되었습니다.');
      } else {
        throw new Error('설정 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('Settings save error:', err);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const updateNestedSettings = (section: keyof SystemSettings, nestedField: string, field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [nestedField]: {
          ...(settings[section] as any)[nestedField],
          [field]: value
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">설정을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-gray-500">설정을 불러올 수 없습니다.</p>
          <Button onClick={fetchSettings} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">시스템 설정</h1>
          <p className="text-gray-600">시스템 전반의 설정을 관리합니다.</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={saveSettings}
            variant="primary"
            disabled={saving}
          >
            {saving ? '저장 중...' : '설정 저장'}
          </Button>
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
            <Button onClick={fetchSettings} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <Card>
            <nav className="space-y-1">
              {[
                { id: 'general', name: '일반 설정', icon: '⚙️' },
                { id: 'reservation', name: '예약 설정', icon: '📅' },
                { id: 'payment', name: '결제 설정', icon: '💳' },
                { id: 'notification', name: '알림 설정', icon: '🔔' },
                { id: 'maintenance', name: '시스템 관리', icon: '🔧' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        <div className="lg:w-3/4">
          <Card>
            <div className="p-6">
              {activeTab === 'general' && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">일반 설정</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        사이트 이름
                      </label>
                      <input
                        type="text"
                        value={settings.general.siteName}
                        onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        사이트 설명
                      </label>
                      <textarea
                        value={settings.general.description}
                        onChange={(e) => updateSettings('general', 'description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          관리자 이메일
                        </label>
                        <input
                          type="email"
                          value={settings.general.adminEmail}
                          onChange={(e) => updateSettings('general', 'adminEmail', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          고객지원 전화
                        </label>
                        <input
                          type="tel"
                          value={settings.general.supportPhone}
                          onChange={(e) => updateSettings('general', 'supportPhone', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        운영 시간
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="time"
                          value={settings.general.businessHours.start}
                          onChange={(e) => updateNestedSettings('general', 'businessHours', 'start', e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="time"
                          value={settings.general.businessHours.end}
                          onChange={(e) => updateNestedSettings('general', 'businessHours', 'end', e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reservation' && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">예약 설정</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          최대 사전 예약일
                        </label>
                        <input
                          type="number"
                          value={settings.reservation.maxAdvanceDays}
                          onChange={(e) => updateSettings('reservation', 'maxAdvanceDays', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          최소 사전 예약시간
                        </label>
                        <input
                          type="number"
                          value={settings.reservation.minAdvanceHours}
                          onChange={(e) => updateSettings('reservation', 'minAdvanceHours', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          최대 이용시간
                        </label>
                        <input
                          type="number"
                          value={settings.reservation.maxDurationHours}
                          onChange={(e) => updateSettings('reservation', 'maxDurationHours', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.reservation.allowCancellation}
                          onChange={(e) => updateSettings('reservation', 'allowCancellation', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm font-medium text-gray-700">예약 취소 허용</span>
                      </label>
                      {settings.reservation.allowCancellation && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            취소 마감시간 (시간 전)
                          </label>
                          <input
                            type="number"
                            value={settings.reservation.cancellationDeadlineHours}
                            onChange={(e) => updateSettings('reservation', 'cancellationDeadlineHours', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.reservation.autoConfirm}
                          onChange={(e) => updateSettings('reservation', 'autoConfirm', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm font-medium text-gray-700">자동 예약 승인</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">결제 설정</h3>
                  <div className="space-y-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.payment.enablePayment}
                        onChange={(e) => updateSettings('payment', 'enablePayment', e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium text-gray-700">온라인 결제 활성화</span>
                    </label>
                    {settings.payment.enablePayment && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              예약금 비율 (%)
                            </label>
                            <input
                              type="number"
                              value={settings.payment.depositRate}
                              onChange={(e) => updateSettings('payment', 'depositRate', parseInt(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              취소 수수료 (%)
                            </label>
                            <input
                              type="number"
                              value={settings.payment.cancelFeeRate}
                              onChange={(e) => updateSettings('payment', 'cancelFeeRate', parseInt(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            환불 정책
                          </label>
                          <textarea
                            value={settings.payment.refundPolicy}
                            onChange={(e) => updateSettings('payment', 'refundPolicy', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notification' && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">알림 설정</h3>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.emailEnabled}
                          onChange={(e) => updateSettings('notification', 'emailEnabled', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm font-medium text-gray-700">이메일 알림 활성화</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.smsEnabled}
                          onChange={(e) => updateSettings('notification', 'smsEnabled', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm font-medium text-gray-700">SMS 알림 활성화</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.reservationConfirm}
                          onChange={(e) => updateSettings('notification', 'reservationConfirm', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm font-medium text-gray-700">예약 확인 알림</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notification.adminNotify}
                          onChange={(e) => updateSettings('notification', 'adminNotify', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm font-medium text-gray-700">관리자 알림</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        예약 리마인더 시간 (시간 전)
                      </label>
                      <input
                        type="number"
                        value={settings.notification.reminderHours}
                        onChange={(e) => updateSettings('notification', 'reminderHours', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">시스템 관리</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-4 bg-gray-50">
                        <h4 className="font-medium mb-3">시스템 정보</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>시스템 버전</span>
                            <span className="font-medium">{settings.maintenance.systemVersion}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>데이터베이스 버전</span>
                            <span className="font-medium">{settings.maintenance.dbVersion}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>마지막 백업</span>
                            <span className="font-medium">
                              {new Date(settings.maintenance.lastBackup).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4 bg-gray-50">
                        <h4 className="font-medium mb-3">관리 작업</h4>
                        <div className="space-y-3">
                          <Button variant="outline" size="sm" className="w-full">
                            데이터베이스 백업
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            시스템 로그 다운로드
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            캐시 정리
                          </Button>
                        </div>
                      </Card>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.maintenance.debugMode}
                          onChange={(e) => updateSettings('maintenance', 'debugMode', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm font-medium text-gray-700">디버그 모드 활성화</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        개발 목적으로만 사용하세요. 운영 환경에서는 비활성화해야 합니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}