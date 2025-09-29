/**
 * 성능 모니터링 유틸리티
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface WebVitalMetric {
  CLS?: number;
  FID?: number;
  FCP?: number;
  LCP?: number;
  TTFB?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  // 페이지 로딩 시간 측정
  measurePageLoad(pageName: string): number | null {
    if (!this.isEnabled || typeof window === 'undefined') return null;

    const startTime = performance.now();
    const metric = {
      name: `page_load_${pageName}`,
      value: startTime,
      timestamp: Date.now(),
      metadata: { page: pageName }
    };

    this.metrics.push(metric);

    // 페이지 로드 완료 이벤트 감지
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      this.recordMetric(`page_load_time_${pageName}`, loadTime, {
        page: pageName,
        url: window.location.pathname
      });
    });

    return startTime;
  }

  // API 응답 시간 측정
  measureApiCall(endpoint: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();

    return () => {
      const responseTime = performance.now() - startTime;
      this.recordMetric('api_response_time', responseTime, {
        endpoint,
        url: window.location.pathname
      });
    };
  }

  // 이미지 로딩 시간 측정
  measureImageLoad(imageUrl: string, imageSize?: { width: number; height: number }): (() => void) | number {
    if (!this.isEnabled || typeof window === 'undefined') return 0;

    const startTime = performance.now();

    return () => {
      const loadTime = performance.now() - startTime;
      this.recordMetric('image_load_time', loadTime, {
        imageUrl: imageUrl.substring(0, 100), // URL 길이 제한
        imageSize: imageSize ? `${imageSize.width}x${imageSize.height}` : 'unknown'
      });
    };
  }

  // Web Vitals 측정
  measureWebVitals(): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Core Web Vitals 측정
    this.measureLCP();
    this.measureFID();
    this.measureCLS();

    // 추가 성능 지표
    this.measureFCP();
    this.measureTTFB();
  }

  private measureLCP(): void {
    // LCP (Largest Contentful Paint) 측정
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('LCP', lastEntry.startTime, {
          element: (lastEntry as any).element?.tagName || 'unknown'
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  private measureFID(): void {
    // FID (First Input Delay) 측정
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime, {
            eventType: entry.name
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  private measureCLS(): void {
    // CLS (Cumulative Layout Shift) 측정
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.recordMetric('CLS', clsValue);
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // 페이지 언로드 시 최종 CLS 값 기록
      window.addEventListener('beforeunload', () => {
        if (clsValue > 0) {
          this.recordMetric('CLS_final', clsValue);
        }
      });
    }
  }

  private measureFCP(): void {
    // FCP (First Contentful Paint) 측정
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          this.recordMetric('FCP', entry.startTime);
        });
      });

      observer.observe({ entryTypes: ['paint'] });
    }
  }

  private measureTTFB(): void {
    // TTFB (Time to First Byte) 측정
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          this.recordMetric('TTFB', (entry as any).responseStart - (entry as any).requestStart);
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  // 메트릭 기록
  private recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric: ${name} = ${value.toFixed(2)}ms`, metadata);
    }

    // 프로덕션 환경에서는 분석 서비스로 전송
    if (this.isEnabled && typeof window !== 'undefined') {
      this.sendToAnalytics(metric);
    }
  }

  // 분석 서비스로 데이터 전송
  private sendToAnalytics(metric: PerformanceMetric): void {
    // Google Analytics 4 예시
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: Math.round(metric.value),
        page_location: window.location.href,
        ...metric.metadata
      });
    }

    // 커스텀 API 엔드포인트로도 전송 가능
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(err => {
      console.warn('Failed to send performance data:', err);
    });
  }

  // 메트릭 데이터 가져오기
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // 특정 기간 메트릭 필터링
  getMetricsByTimeRange(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  // 통계 정보 생성
  getStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const statsMap = new Map<string, number[]>();

    this.metrics.forEach(metric => {
      if (!statsMap.has(metric.name)) {
        statsMap.set(metric.name, []);
      }
      statsMap.get(metric.name)!.push(metric.value);
    });

    const stats: Record<string, any> = {};
    statsMap.forEach((values, name) => {
      stats[name] = {
        avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    });

    return stats;
  }
}

// 전역 인스턴스
export const performanceMonitor = new PerformanceMonitor();

// 개발자 도구를 위한 전역 객체 등록
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__performanceMonitor = performanceMonitor;
}
