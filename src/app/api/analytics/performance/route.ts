/**
 * 성능 메트릭 수집 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  ApiErrors, 
  withErrorHandling 
} from '@/lib/api-response';

interface PerformanceData {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
  userAgent?: string;
  url?: string;
  userId?: string;
}

/**
 * 성능 메트릭 저장
 */
async function storePerformanceMetric(request: NextRequest) {
  const body: PerformanceData = await request.json();

  // 입력 검증
  if (!body.name || typeof body.value !== 'number') {
    throw ApiErrors.BadRequest('잘못된 성능 메트릭 데이터입니다.');
  }

  // 클라이언트 정보 추출
  const userAgent = request.headers.get('user-agent');
  const url = request.headers.get('referer');
  const userId = request.headers.get('x-user-id');

  const metricData = {
    ...body,
    userAgent,
    url,
    userId,
    ip: request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 'unknown'
  };

  // 성능 데이터 저장 로직 (실제 구현에서는 데이터베이스에 저장)
  console.log('📊 Performance Metric Received:', metricData);

  // 실시간 알림 (임계값 초과 시)
  if (isThresholdExceeded(body)) {
    await sendPerformanceAlert(body);
  }

  return createSuccessResponse(
    { stored: true },
    '성능 메트릭이 저장되었습니다.'
  );
}

/**
 * 임계값 초과 확인
 */
function isThresholdExceeded(data: PerformanceData): boolean {
  const thresholds = {
    'page_load_time': 3000, // 3초
    'api_response_time': 2000, // 2초
    'image_load_time': 1500, // 1.5초
    'LCP': 2500, // 2.5초
    'CLS': 0.1, // 0.1
    'FID': 100 // 100ms
  };

  const threshold = thresholds[data.name as keyof typeof thresholds];
  return threshold !== undefined && data.value > threshold;
}

/**
 * 성능 임계값 초과 알림 발송
 */
async function sendPerformanceAlert(data: PerformanceData) {
  const alertMessage = `🚨 성능 임계값 초과 감지!

메트릭: ${data.name}
값: ${data.value}
페이지: ${data.url || 'unknown'}
시간: ${new Date(data.timestamp).toLocaleString()}
사용자: ${data.userAgent?.substring(0, 50) || 'unknown'}`;

  // 실제 구현에서는 Slack, 이메일 등으로 알림 발송
  console.warn('🚨 Performance Alert:', alertMessage);

  // 이메일 알림 발송 예시
  try {
    await fetch('/api/email/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'performance_alert',
        data: alertMessage,
        priority: 'high'
      })
    });
  } catch (error) {
    console.error('Failed to send performance alert:', error);
  }
}

/**
 * 성능 통계 조회
 */
async function getPerformanceStats(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('range') || '24h'; // 24시간 기본
  
  // 실제 구현에서는 데이터베이스에서 통계 조회
  const stats = {
    overview: {
      avgPageLoad: 1840,
      avgApiResponse: 450,
      avgImageLoad: 680,
      avgLCP: 2100,
      avgCLS: 0.08,
      avgFID: 75
    },
    trends: {
      pageLoad: { up: 5.2, down: -2.1 },
      apiResponse: { up: 3.7, down: -8.4 },
      imageLoad: { up: 1.2, down: -12.3 }
    },
    alerts: {
      total: 3,
      resolved: 1,
      pending: 2
    },
    timeRange
  };

  return createSuccessResponse(stats);
}

export const POST = withErrorHandling(storePerformanceMetric);
export const GET = withErrorHandling(getPerformanceStats);
