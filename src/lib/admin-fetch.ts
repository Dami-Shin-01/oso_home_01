export async function fetchWithAdminAuth<T = any>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const accessToken = typeof window !== 'undefined'
    ? window.localStorage.getItem('accessToken')
    : null;

  if (!accessToken) {
    throw new Error('인증 토큰을 찾을 수 없습니다. 다시 로그인해 주세요.');
  }

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error?: unknown }).error)
        : '요청을 처리하는 중 오류가 발생했습니다.';
    throw new Error(message);
  }

  return payload as T;
}
