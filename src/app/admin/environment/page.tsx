'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';

interface EnvironmentVariable {
  key: string;
  value: string;
  description: string;
  category: 'store' | 'operation' | 'payment' | 'email' | 'policy' | 'marketing' | 'social';
  required: boolean;
  sensitive: boolean;
}

interface ValidationResult {
  key: string;
  status: 'valid' | 'missing' | 'invalid';
  message: string;
}

interface ValidationSummary {
  total: number;
  valid: number;
  missing: number;
  invalid: number;
  isAllValid: boolean;
}

export default function EnvironmentManagementPage() {
  const router = useRouter();
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [editingVariables, setEditingVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

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
      if (parsedUser.role !== 'ADMIN') {
        alert('관리자 권한이 필요합니다.');
        router.push('/admin');
        return false;
      }

      return true;
    };

    if (!checkAuth()) return;

    fetchEnvironmentVariables();
  }, [router]);

  const fetchEnvironmentVariables = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/environment', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('환경변수를 가져올 수 없습니다.');
      }

      const data = await response.json();
      setVariables(data.data.variables);

      // 편집용 초기값 설정
      const editingInit: Record<string, string> = {};
      data.data.variables.forEach((variable: EnvironmentVariable) => {
        editingInit[variable.key] = variable.sensitive && variable.value === '***HIDDEN***' ? '' : variable.value;
      });
      setEditingVariables(editingInit);

      setError(null);
    } catch (err) {
      console.error('Environment variables fetch error:', err);
      setError(err instanceof Error ? err.message : '환경변수를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const validateEnvironmentVariables = async () => {
    try {
      setValidating(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/environment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('환경변수 검증에 실패했습니다.');
      }

      const data = await response.json();
      setValidationResults(data.data.results);
      setValidationSummary(data.data.summary);
      setError(null);
    } catch (err) {
      console.error('Environment validation error:', err);
      setError(err instanceof Error ? err.message : '환경변수 검증 중 오류가 발생했습니다.');
    } finally {
      setValidating(false);
    }
  };

  const saveEnvironmentVariables = async () => {
    try {
      setSaving(true);
      const accessToken = localStorage.getItem('accessToken');

      // 변경된 변수들만 필터링
      const changedVariables = variables
        .filter(variable => {
          const editingValue = editingVariables[variable.key];
          const originalValue = variable.sensitive && variable.value === '***HIDDEN***' ? '' : variable.value;
          return editingValue !== originalValue && editingValue.trim() !== '';
        })
        .map(variable => ({
          key: variable.key,
          value: editingVariables[variable.key]
        }));

      if (changedVariables.length === 0) {
        setError('변경된 환경변수가 없습니다.');
        return;
      }

      const response = await fetch('/api/admin/environment', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variables: changedVariables
        })
      });

      if (!response.ok) {
        throw new Error('환경변수 저장에 실패했습니다.');
      }

      const data = await response.json();
      setSuccess(`${data.data.updatedVariables.length}개의 환경변수가 성공적으로 업데이트되었습니다. 변경사항을 적용하려면 애플리케이션을 재시작해야 합니다.`);
      setError(null);

      // 데이터 새로고침
      await fetchEnvironmentVariables();
    } catch (err) {
      console.error('Environment save error:', err);
      setError(err instanceof Error ? err.message : '환경변수 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setEditingVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleSensitiveVisibility = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      store: 'bg-blue-100 text-blue-800',
      operation: 'bg-green-100 text-green-800',
      payment: 'bg-yellow-100 text-yellow-800',
      email: 'bg-purple-100 text-purple-800',
      policy: 'bg-orange-100 text-orange-800',
      marketing: 'bg-pink-100 text-pink-800',
      social: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.social;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      store: '매장 정보',
      operation: '운영 설정',
      payment: '결제 정보',
      email: '이메일',
      policy: '정책 설정',
      marketing: '마케팅',
      social: '소셜 미디어'
    };
    return labels[category as keyof typeof labels] || '기타';
  };

  const getValidationStatus = (key: string) => {
    const result = validationResults.find(r => r.key === key);
    if (!result) return null;

    const statusColors = {
      valid: 'text-green-600',
      missing: 'text-red-600',
      invalid: 'text-orange-600'
    };

    const statusIcons = {
      valid: '✅',
      missing: '❌',
      invalid: '⚠️'
    };

    return (
      <div className={`flex items-center space-x-1 text-sm ${statusColors[result.status]}`}>
        <span>{statusIcons[result.status]}</span>
        <span>{result.message}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">환경변수를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 카테고리별로 그룹화
  const groupedVariables = variables.reduce((groups, variable) => {
    const category = variable.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(variable);
    return groups;
  }, {} as Record<string, EnvironmentVariable[]>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">환경변수 관리</h1>
          <p className="text-gray-600">시스템 환경변수를 설정하고 관리합니다.</p>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin')}
          >
            대시보드로 돌아가기
          </Button>
          <Button
            variant="secondary"
            onClick={validateEnvironmentVariables}
            disabled={validating}
          >
            {validating ? '검증 중...' : '환경변수 검증'}
          </Button>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* 검증 요약 */}
      {validationSummary && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">환경변수 검증 결과</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{validationSummary.total}</div>
              <div className="text-sm text-gray-600">전체</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validationSummary.valid}</div>
              <div className="text-sm text-gray-600">정상</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{validationSummary.missing}</div>
              <div className="text-sm text-gray-600">누락</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{validationSummary.invalid}</div>
              <div className="text-sm text-gray-600">오류</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${validationSummary.isAllValid ? 'text-green-600' : 'text-red-600'}`}>
                {validationSummary.isAllValid ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600">상태</div>
            </div>
          </div>
        </Card>
      )}

      {/* 환경변수 목록 */}
      <div className="space-y-6">
        {Object.entries(groupedVariables).map(([category, categoryVariables]) => (
          <Card key={category}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center">
                <span className={`px-2 py-1 rounded-full text-sm font-medium mr-3 ${getCategoryColor(category)}`}>
                  {getCategoryLabel(category)}
                </span>
                {categoryVariables.length}개 변수
              </h3>
            </div>

            <div className="space-y-4">
              {categoryVariables.map((variable) => (
                <div key={variable.key} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{variable.key}</h4>
                        {variable.required && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">필수</span>
                        )}
                        {variable.sensitive && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">민감정보</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{variable.description}</p>

                      {/* 검증 상태 */}
                      {getValidationStatus(variable.key)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      {variable.sensitive ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type={showSensitive[variable.key] ? 'text' : 'password'}
                            value={editingVariables[variable.key] || ''}
                            onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder={variable.value === '***HIDDEN***' ? '값을 입력하세요' : ''}
                          />
                          <button
                            type="button"
                            onClick={() => toggleSensitiveVisibility(variable.key)}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700"
                          >
                            {showSensitive[variable.key] ? '🙈' : '👁️'}
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={editingVariables[variable.key] || ''}
                          onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* 저장 버튼 */}
      <div className="mt-8 flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={fetchEnvironmentVariables}
          disabled={saving}
        >
          초기화
        </Button>
        <Button
          variant="primary"
          onClick={saveEnvironmentVariables}
          disabled={saving}
        >
          {saving ? '저장 중...' : '변경사항 저장'}
        </Button>
      </div>

      {/* 주의사항 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 환경변수 변경 후에는 애플리케이션을 재시작해야 합니다.</li>
          <li>• 민감한 정보는 안전하게 관리하세요.</li>
          <li>• 필수 환경변수를 삭제하면 애플리케이션이 정상 작동하지 않을 수 있습니다.</li>
          <li>• 변경 전에 현재 설정을 백업해두는 것을 권장합니다.</li>
        </ul>
      </div>
    </div>
  );
}