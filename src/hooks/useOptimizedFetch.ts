'use client';

import { useState, useEffect, useRef } from 'react';

// 클라이언트 사이드 캐시 인터페이스
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UseOptimizedFetchOptions {
  ttl?: number; // 캐시 TTL (밀리초)
  retryCount?: number; // 재시도 횟수
  retryDelay?: number; // 재시도 간격 (밀리초)
}

// 전역 캐시 저장소
const globalCache = new Map<string, CacheEntry<any>>();

export function useOptimizedFetch<T>(
  url: string,
  options: UseOptimizedFetchOptions & RequestInit = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    ttl = 5 * 60 * 1000, // 기본 5분
    retryCount = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // 캐시 키 생성
  const cacheKey = `${url}_${JSON.stringify(fetchOptions)}`;

  // 캐시 확인 함수
  const getCachedData = (): T | null => {
    const cached = globalCache.get(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      globalCache.delete(cacheKey);
      return null;
    }

    return cached.data as T;
  };

  // 데이터 가져오기 함수
  const fetchData = async (retryNumber = 0): Promise<void> => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // 캐시 확인
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // 네트워크 요청
      const response = await fetch(url, {
        ...fetchOptions,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // 캐시에 저장
      globalCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl
      });

      setData(result);

    } catch (err) {
      // 요청이 취소된 경우 처리하지 않음
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Network error';

      // 재시도 로직
      if (retryNumber < retryCount) {
        setTimeout(() => {
          fetchData(retryNumber + 1);
        }, retryDelay * Math.pow(2, retryNumber)); // 지수 백오프
        return;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 새로고침 함수
  const refetch = () => {
    // 캐시 무효화
    globalCache.delete(cacheKey);
    fetchData();
  };

  // 캐시 무효화 함수
  const invalidateCache = () => {
    globalCache.delete(cacheKey);
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchData();

    // 컴포넌트 언마운트 시 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, JSON.stringify(fetchOptions)]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache
  };
}

// 캐시 관리 유틸리티 함수들
export const cacheUtils = {
  // 특정 키 캐시 무효화
  invalidate: (pattern: string) => {
    Array.from(globalCache.keys()).forEach(key => {
      if (key.includes(pattern)) {
        globalCache.delete(key);
      }
    });
  },

  // 모든 캐시 삭제
  clear: () => {
    globalCache.clear();
  },

  // 캐시 크기 확인
  getSize: () => globalCache.size,

  // 캐시 키 목록 확인
  getKeys: () => Array.from(globalCache.keys())
};
