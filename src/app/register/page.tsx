'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Card from '@/components/atoms/Card';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    if (!formData.phone) {
      newErrors.phone = '연락처를 입력해주세요.';
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '올바른 연락처 형식을 입력해주세요. (010-0000-0000)';
    }
    
    if (!agreedToTerms) {
      newErrors.terms = '이용약관에 동의해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // TODO: Supabase 회원가입 구현
      console.log('회원가입 시도:', formData);
      
      // 임시 로직 - 추후 실제 인증으로 대체
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 성공 시 로그인 페이지로 리다이렉트
      alert('회원가입 성공! 로그인 페이지로 이동합니다. (임시)');
      // router.push('/login');
      
    } catch (error) {
      console.error('회원가입 오류:', error);
      setErrors({ general: '회원가입에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">
            오소 바베큐장 계정을 만들어 편리하게 예약하세요
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <Input
              label="이메일"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="example@email.com"
              helperText="로그인 시 사용할 이메일입니다"
              required
            />

            <Input
              label="비밀번호"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="6자 이상 입력하세요"
              required
            />

            <Input
              label="비밀번호 확인"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="비밀번호를 다시 입력하세요"
              required
            />

            <Input
              label="이름"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="홍길동"
              required
            />

            <Input
              label="연락처"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="010-0000-0000"
              helperText="예약 확인 시 사용됩니다"
              required
            />

            {/* 약관 동의 */}
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  <span className="text-red-500">*</span> 
                  <Link href="#" className="text-green-600 hover:text-green-800 underline">
                    이용약관
                  </Link>
                  {' '}및{' '}
                  <Link href="#" className="text-green-600 hover:text-green-800 underline">
                    개인정보처리방침
                  </Link>
                  에 동의합니다
                </label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600">{errors.terms}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="large"
              loading={isLoading}
              disabled={isLoading || !agreedToTerms}
            >
              회원가입
            </Button>
          </form>

          {/* 소셜 회원가입 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="mr-2">🟡</span>
                카카오로 시작하기
              </button>
              
              <button className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="mr-2">🟢</span>
                네이버로 시작하기
              </button>
            </div>
          </div>

          {/* 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-green-600 hover:text-green-800 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}