'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { API_ENDPOINTS } from '@/constants'
import { signInCustomer } from '@/lib/auth-customer'

type UserType = 'customer' | 'admin'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userType, setUserType] = useState<UserType>('customer')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // URL 파라미터에서 탭 상태 초기화
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'customer' || tab === 'admin') {
      setUserType(tab)
    }
  }, [searchParams])

  // 폼 검증
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return false
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return false
    }
    return true
  }

  // 고객 로그인 처리
  const handleCustomerLogin = async () => {
    try {
      const result = await signInCustomer({
        email: formData.email,
        password: formData.password
      })

      if (result.success) {
        setSuccess('로그인이 완료되었습니다! 홈페이지로 이동합니다.')
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        setError(result.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
    }
  }

  // 관리자 로그인 처리
  const handleAdminLogin = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // 로컬 스토리지에 토큰 저장
        if (data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken)
        }
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken)
        }
        if (data.data.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user))
        }

        if (data.data.user.role === 'ADMIN' || data.data.user.role === 'MANAGER') {
          setSuccess('관리자 로그인이 완료되었습니다! 관리자 페이지로 이동합니다.')
          setTimeout(() => {
            router.push('/admin')
          }, 1500)
        } else {
          setError('관리자 권한이 없습니다.')
        }
      } else {
        setError(data.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.')
    }
  }

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      if (userType === 'customer') {
        await handleCustomerLogin()
      } else {
        await handleAdminLogin()
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 탭 변경 처리
  const handleTabChange = (newUserType: UserType) => {
    setUserType(newUserType)
    setError('')
    setSuccess('')
    // URL 파라미터 업데이트
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', newUserType)
    window.history.replaceState({}, '', newUrl)
  }

  return (
    <div className="min-h-[80vh] bg-base-200 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-base-content mb-2">
            오소 바베큐장 로그인
          </h1>
          <p className="text-base-content/70">
            계정에 로그인하여 서비스를 이용하세요
          </p>
        </div>

        {/* 메인 카드 */}
        <div className="card w-full bg-base-100 shadow-xl">
          <div className="card-body">
            {/* 탭 */}
            <div className="tabs tabs-boxed grid w-full grid-cols-2 mb-6">
              <button
                className={`tab ${userType === 'customer' ? 'tab-active' : ''}`}
                onClick={() => handleTabChange('customer')}
              >
                고객 로그인
              </button>
              <button
                className={`tab ${userType === 'admin' ? 'tab-active' : ''}`}
                onClick={() => handleTabChange('admin')}
              >
                관리자 로그인
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 알림 메시지 */}
              {error && (
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              {/* 이메일 필드 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">이메일</span>
                </label>
                <input
                  type="email"
                  placeholder={userType === 'admin' ? 'admin@osobbq.com' : 'example@email.com'}
                  className="input input-bordered"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              {/* 비밀번호 필드 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">비밀번호</span>
                </label>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  className="input input-bordered"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
                {userType === 'customer' && (
                  <label className="label">
                    <Link href="#" className="label-text-alt link link-hover">비밀번호를 잊으셨나요?</Link>
                  </label>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="form-control mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-lg"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      로그인 중...
                    </>
                  ) : (
                    `${userType === 'admin' ? '관리자' : '고객'} 로그인`
                  )}
                </button>
              </div>
            </form>

            {/* 회원가입 링크 (고객용만) */}
            {userType === 'customer' && (
              <>
                <div className="divider">또는</div>
                <div className="text-center space-y-3">
                  <p className="text-base-content/70">
                    아직 계정이 없으신가요?{' '}
                    <Link href="/register" className="link link-primary font-medium">
                      회원가입하기
                    </Link>
                  </p>

                  <p className="text-sm">
                    <Link href="/guest-reservation" className="link link-neutral">
                      비회원으로 예약 조회하기
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* 홈 링크 */}
            <div className="text-center mt-4">
              <Link href="/" className="link link-neutral">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}