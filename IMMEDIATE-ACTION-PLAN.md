# 🚨 즉시 실행 액션 플랜

## 📅 오늘 (2025-09-22) 바로 시작해야 할 작업

### 🎯 **분석 결과 요약**

3개 문서 분석 결과, **현재 MVP 진행률은 25%**이며, 고객 시스템이 **0% 완료** 상태입니다.

**✅ 완료된 것**: 관리자 시스템 95% + 기반 인프라 100%
**❌ 미완료**: 고객 인증, 예약 시스템, 마이페이지 모두 0%

---

## 🚨 **Critical Priority - 오늘 즉시 시작**

### 🔥 **1순위: 데이터베이스 확장 (30분 소요)**

**이유**: 모든 고객 기능의 기반이 되는 테이블들이 없음

```sql
-- 즉시 실행 필요한 SQL (Supabase SQL Editor에서)

-- 1. 고객 테이블
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  birth_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. 고객 프로필 테이블
CREATE TABLE customer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  address TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  preferred_contact VARCHAR(20) DEFAULT 'email',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 예약 결제 테이블
CREATE TABLE reservation_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. RLS 정책 설정
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON customers
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON customers
  FOR UPDATE USING (auth.uid() = id);
```

### 🔥 **2순위: 고객 인증 시스템 기초 (1-2시간 소요)**

#### 파일 1: `src/lib/auth-customer.ts` 생성
```typescript
import { supabase } from './supabase'

export const signUpCustomer = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })
  return { data, error }
}

export const signInCustomer = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}
```

#### 파일 2: `src/app/register/page.tsx` 생성 (고객 회원가입)
```typescript
'use client'

import { useState } from 'react'
import { signUpCustomer } from '@/lib/auth-customer'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await signUpCustomer(
      formData.email,
      formData.password,
      formData.name
    )

    if (error) {
      alert('회원가입 실패: ' + error.message)
    } else {
      alert('회원가입 성공! 로그인 페이지로 이동합니다.')
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">회원가입</h2>

        <input
          type="email"
          placeholder="이메일"
          className="w-full p-3 border rounded mb-4"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />

        <input
          type="password"
          placeholder="비밀번호 (8자 이상)"
          className="w-full p-3 border rounded mb-4"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
          minLength={8}
        />

        <input
          type="text"
          placeholder="이름"
          className="w-full p-3 border rounded mb-4"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />

        <input
          type="tel"
          placeholder="휴대폰 번호"
          className="w-full p-3 border rounded mb-6"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
        >
          회원가입
        </button>

        <p className="mt-4 text-center">
          이미 계정이 있으신가요?
          <a href="/login" className="text-blue-600 ml-1">로그인</a>
        </p>
      </form>
    </div>
  )
}
```

### 🔥 **3순위: 기존 로그인 페이지 수정 (30분 소요)**

#### `src/app/login/page.tsx` 수정 - 고객/관리자 탭 추가
```typescript
'use client'

import { useState } from 'react'
import { signInCustomer } from '@/lib/auth-customer'
// 기존 관리자 로그인 함수도 import

export default function LoginPage() {
  const [userType, setUserType] = useState<'customer' | 'admin'>('customer')
  const [formData, setFormData] = useState({ email: '', password: '' })

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">

        {/* 탭 선택 */}
        <div className="flex mb-6">
          <button
            className={`flex-1 p-2 ${userType === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setUserType('customer')}
          >
            고객 로그인
          </button>
          <button
            className={`flex-1 p-2 ${userType === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setUserType('admin')}
          >
            관리자 로그인
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6">
          {userType === 'customer' ? '고객 로그인' : '관리자 로그인'}
        </h2>

        {/* 기존 폼 로직에 고객/관리자 구분 추가 */}

      </div>
    </div>
  )
}
```

---

## 🎯 **오늘의 목표**

### ✅ **완료 체크리스트**
- [ ] 데이터베이스 테이블 3개 생성 완료
- [ ] 고객 인증 라이브러리 함수 생성 완료
- [ ] 고객 회원가입 페이지 생성 완료
- [ ] 로그인 페이지에 고객 탭 추가 완료

### 📊 **예상 결과**
오늘 작업 완료 시 **MVP 진행률: 25% → 40%**

---

## 🚀 **내일 (Day 2) 계획**

### 우선순위 작업
1. **고객용 레이아웃 컴포넌트** 생성
   - `src/components/customer/Header.tsx`
   - `src/components/customer/Layout.tsx`

2. **미들웨어 확장** - 고객 라우트 보호
   - `middleware.ts` 수정

3. **시설 조회 페이지** 기초
   - `src/app/facilities/page.tsx`

---

## 💡 **중요 발견사항**

### ✅ **강점 활용**
- 관리자 시스템이 완벽 → 기존 API 및 데이터 활용 가능
- Supabase 인프라 완성 → 빠른 인증 시스템 구축 가능
- TypeScript 환경 완성 → 안전한 개발 가능

### ⚠️ **주의사항**
- 기존 `users` 테이블과 새로운 `customers` 테이블 관계 명확히 정의
- 관리자와 고객 인증 시스템 분리 필요
- 기존 `reservations` 테이블과 고객 시스템 연동 확인

### 🎯 **성공 기준**
오늘 작업 완료 시 **고객이 회원가입하고 로그인할 수 있는 상태** 달성

---

**작성일**: 2025-09-22 13:40
**우선순위**: 🚨 최고 급박
**예상 소요시간**: 2-3시간
**다음 단계**: 시설 조회 페이지 구현