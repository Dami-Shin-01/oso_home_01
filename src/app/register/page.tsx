'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUpCustomer, checkEmailExists, CustomerSignUpData } from '@/lib/auth-customer'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<CustomerSignUpData>({
    email: '',
    password: '',
    name: '',
    phone: '',
    marketingConsent: false
  })

  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [emailChecked, setEmailChecked] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState(false)

  // 폼 검증 상태
  const [validation, setValidation] = useState({
    email: { valid: false, message: '' },
    password: { valid: false, message: '' },
    passwordConfirm: { valid: false, message: '' },
    name: { valid: false, message: '' }
  })

  // 이메일 형식 검증
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 비밀번호 강도 검증
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return { valid: false, message: '비밀번호는 8자 이상이어야 합니다.' }
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return { valid: false, message: '비밀번호는 영문과 숫자를 포함해야 합니다.' }
    }
    return { valid: true, message: '사용 가능한 비밀번호입니다.' }
  }

  // 이름 검증
  const validateName = (name: string) => {
    if (name.length < 2) {
      return { valid: false, message: '이름은 2글자 이상이어야 합니다.' }
    }
    return { valid: true, message: '' }
  }

  // 실시간 폼 검증
  useEffect(() => {
    setValidation({
      email: {
        valid: validateEmail(formData.email),
        message: validateEmail(formData.email) ? '' : '올바른 이메일 형식을 입력해주세요.'
      },
      password: validatePassword(formData.password),
      passwordConfirm: {
        valid: passwordConfirm === formData.password && passwordConfirm.length > 0,
        message: passwordConfirm === formData.password ? '' : '비밀번호가 일치하지 않습니다.'
      },
      name: validateName(formData.name)
    })
  }, [formData, passwordConfirm])

  // 이메일 중복 확인
  const handleEmailCheck = async () => {
    if (!validation.email.valid) {
      setError('올바른 이메일을 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const exists = await checkEmailExists(formData.email)
      setEmailAvailable(!exists)
      setEmailChecked(true)

      if (exists) {
        setError('이미 사용중인 이메일입니다.')
      } else {
        setError('')
        setSuccess('사용 가능한 이메일입니다.')
      }
    } catch (error) {
      setError('이메일 확인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // 필수 필드 검증
    if (!validation.email.valid || !validation.password.valid ||
        !validation.passwordConfirm.valid || !validation.name.valid) {
      setError('모든 필수 항목을 올바르게 입력해주세요.')
      return
    }

    // 이메일 중복 확인 여부
    if (!emailChecked || !emailAvailable) {
      setError('이메일 중복 확인을 해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const result = await signUpCustomer(formData)

      if (result.success) {
        setSuccess('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.')
        setTimeout(() => {
          router.push('/login?tab=customer')
        }, 2000)
      } else {
        setError(result.error || '회원가입에 실패했습니다.')
      }
    } catch (error) {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 입력 필드 변경 처리
  const handleInputChange = (field: keyof CustomerSignUpData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // 이메일이 변경되면 중복 확인 상태 초기화
    if (field === 'email') {
      setEmailChecked(false)
      setEmailAvailable(false)
      setSuccess('')
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-base-content mb-2">
            오소 바베큐장 회원가입
          </h1>
          <p className="text-base-content/70">
            계정을 만들어 편리하게 예약하세요
          </p>
        </div>

        {/* 메인 카드 */}
        <div className="card w-full bg-base-100 shadow-xl">
          <div className="card-body">
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
                  <span className="label-text font-medium">이메일 주소 *</span>
                </label>
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="example@email.com"
                    className={`input input-bordered flex-1 ${
                      formData.email && !validation.email.valid ? 'input-error' :
                      validation.email.valid ? 'input-success' : ''
                    }`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleEmailCheck}
                    disabled={!validation.email.valid || isLoading}
                    className={`btn ${emailAvailable && emailChecked ? 'btn-success' : 'btn-primary'}`}
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : emailChecked ? (
                      emailAvailable ? '✓' : '✗'
                    ) : (
                      '중복확인'
                    )}
                  </button>
                </div>
                {formData.email && validation.email.message && (
                  <label className="label">
                    <span className="label-text-alt text-error">{validation.email.message}</span>
                  </label>
                )}
                {emailChecked && (
                  <label className="label">
                    <span className={`label-text-alt ${emailAvailable ? 'text-success' : 'text-error'}`}>
                      {emailAvailable ? '✓ 사용 가능한 이메일입니다' : '✗ 이미 사용중인 이메일입니다'}
                    </span>
                  </label>
                )}
              </div>

              {/* 비밀번호 필드 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">비밀번호 *</span>
                </label>
                <input
                  type="password"
                  placeholder="8자 이상, 영문+숫자 포함"
                  className={`input input-bordered ${
                    formData.password && !validation.password.valid ? 'input-error' :
                    validation.password.valid ? 'input-success' : ''
                  }`}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                {formData.password && validation.password.message && (
                  <label className="label">
                    <span className={`label-text-alt ${validation.password.valid ? 'text-success' : 'text-error'}`}>
                      {validation.password.message}
                    </span>
                  </label>
                )}
              </div>

              {/* 비밀번호 확인 필드 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">비밀번호 확인 *</span>
                </label>
                <input
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  className={`input input-bordered ${
                    passwordConfirm && !validation.passwordConfirm.valid ? 'input-error' :
                    validation.passwordConfirm.valid ? 'input-success' : ''
                  }`}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
                {passwordConfirm && validation.passwordConfirm.message && (
                  <label className="label">
                    <span className="label-text-alt text-error">{validation.passwordConfirm.message}</span>
                  </label>
                )}
              </div>

              {/* 이름 필드 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">이름 *</span>
                </label>
                <input
                  type="text"
                  placeholder="홍길동"
                  className={`input input-bordered ${
                    formData.name && !validation.name.valid ? 'input-error' :
                    validation.name.valid ? 'input-success' : ''
                  }`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
                {formData.name && validation.name.message && (
                  <label className="label">
                    <span className="label-text-alt text-error">{validation.name.message}</span>
                  </label>
                )}
              </div>

              {/* 휴대폰 번호 필드 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">휴대폰 번호</span>
                  <span className="label-text-alt">예약 확인 시 사용됩니다</span>
                </label>
                <input
                  type="tel"
                  placeholder="010-1234-5678"
                  className="input input-bordered"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              {/* 마케팅 수신 동의 */}
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">이벤트 및 프로모션 정보 수신에 동의 (선택)</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={formData.marketingConsent}
                    onChange={(e) => handleInputChange('marketingConsent', e.target.checked)}
                  />
                </label>
              </div>

              {/* 제출 버튼 */}
              <div className="form-control mt-8">
                <button
                  type="submit"
                  disabled={isLoading || !validation.email.valid || !validation.password.valid ||
                           !validation.passwordConfirm.valid || !validation.name.valid ||
                           !emailChecked || !emailAvailable}
                  className="btn btn-primary btn-lg"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      처리중...
                    </>
                  ) : (
                    '회원가입'
                  )}
                </button>
              </div>

              {/* 이용약관 */}
              <div className="text-center text-sm opacity-70">
                회원가입 시{' '}
                <Link href="#" className="link link-primary">이용약관</Link> 및{' '}
                <Link href="#" className="link link-primary">개인정보처리방침</Link>에 동의하는 것으로 간주됩니다.
              </div>

            </form>

            {/* 구분선 */}
            <div className="divider">또는</div>

            {/* 소셜 로그인 (미래 기능) */}
            <div className="space-y-3">
              <button className="btn btn-outline btn-block" disabled>
                <span className="text-yellow-500">📱</span>
                카카오로 시작하기
                <div className="badge badge-ghost">준비중</div>
              </button>
            </div>

            {/* 로그인 링크 */}
            <div className="text-center mt-6">
              <p className="text-base-content/70">
                이미 계정이 있으신가요?{' '}
                <Link href="/login?tab=customer" className="link link-primary font-medium">
                  로그인하기
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}