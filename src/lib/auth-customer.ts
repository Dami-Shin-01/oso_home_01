/**
 * 고객 인증 시스템
 * 작성일: 2025-09-22
 * 목적: 고객 회원가입, 로그인, 로그아웃 기능 제공
 */

import { supabase } from './supabase'

// 고객 회원가입 인터페이스
export interface CustomerSignUpData {
  email: string
  password: string
  name: string
  phone?: string
  marketingConsent?: boolean
}

// 고객 로그인 인터페이스
export interface CustomerSignInData {
  email: string
  password: string
}

// API 응답 타입
export interface AuthResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * 고객 회원가입
 */
export const signUpCustomer = async (signUpData: CustomerSignUpData): Promise<AuthResponse> => {
  try {
    // 1. Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        data: {
          name: signUpData.name,
          user_type: 'customer' // 고객과 관리자 구분
        }
      }
    })

    if (authError) {
      return {
        success: false,
        error: authError.message
      }
    }

    // 2. users 테이블에 고객 정보 저장
    if (authData.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: signUpData.email,
          name: signUpData.name,
          phone: signUpData.phone || null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          provider: 'email'
        })

      if (userError) {
        // Auth에서는 생성되었지만 users 테이블 삽입 실패
        console.error('User table insertion failed:', userError)
        return {
          success: false,
          error: '회원 정보 저장에 실패했습니다. 다시 시도해주세요.'
        }
      }

      // 3. customer_profiles 테이블에 프로필 정보 저장 (선택사항)
      if (signUpData.marketingConsent !== undefined) {
        const { error: profileError } = await supabase
          .from('customer_profiles')
          .insert({
            customer_id: authData.user.id,
            marketing_consent: signUpData.marketingConsent
          })

        if (profileError) {
          console.error('Customer profile insertion failed:', profileError)
          // 프로필 저장 실패는 치명적이지 않으므로 경고만 출력
        }
      }
    }

    return {
      success: true,
      data: authData
    }

  } catch (error) {
    console.error('Customer signup error:', error)
    return {
      success: false,
      error: '회원가입 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 고객 로그인
 */
export const signInCustomer = async (signInData: CustomerSignInData): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: signInData.email,
      password: signInData.password
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // users 테이블에서 고객 정보 조회
    if (data.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          customer_profiles (
            address,
            marketing_consent,
            preferred_contact,
            notes
          )
        `)
        .eq('id', data.user.id)
        .eq('role', 'CUSTOMER')
        .single()

      if (userError) {
        console.error('User data fetch failed:', userError)
        // 로그인은 성공했지만 고객 정보 조회 실패
        return {
          success: true,
          data: {
            ...data,
            customer: null
          }
        }
      }

      return {
        success: true,
        data: {
          ...data,
          customer: userData
        }
      }
    }

    return {
      success: true,
      data
    }

  } catch (error) {
    console.error('Customer signin error:', error)
    return {
      success: false,
      error: '로그인 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 로그아웃
 */
export const signOut = async (): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Customer signout error:', error)
    return {
      success: false,
      error: '로그아웃 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 현재 로그인된 고객 정보 조회
 */
export const getCurrentCustomer = async (): Promise<AuthResponse> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: '로그인되지 않았습니다.'
      }
    }

    // 고객 정보 조회 (users 테이블에서)
    const { data: customerData, error: customerError } = await supabase
      .from('users')
      .select(`
        *,
        customer_profiles (
          address,
          marketing_consent,
          preferred_contact,
          notes
        )
      `)
      .eq('id', user.id)
      .eq('role', 'CUSTOMER')
      .single()

    if (customerError) {
      console.error('Customer data fetch failed:', customerError)
      return {
        success: false,
        error: '고객 정보를 조회할 수 없습니다.'
      }
    }

    return {
      success: true,
      data: {
        user,
        customer: customerData
      }
    }

  } catch (error) {
    console.error('Get current customer error:', error)
    return {
      success: false,
      error: '사용자 정보 조회 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export const resetPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: '비밀번호 재설정 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 이메일 중복 확인
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .eq('role', 'CUSTOMER')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116은 데이터 없음 오류
      console.error('Email check error:', error)
      return false
    }

    return !!data // 데이터가 있으면 이메일 중복
  } catch (error) {
    console.error('Email check error:', error)
    return false
  }
}

/**
 * 고객 정보 업데이트
 */
export const updateCustomerProfile = async (
  customerId: string,
  updateData: Partial<CustomerSignUpData>
): Promise<AuthResponse> => {
  try {
    // users 테이블 업데이트
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: updateData.name,
        phone: updateData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .eq('role', 'CUSTOMER')

    if (userError) {
      return {
        success: false,
        error: userError.message
      }
    }

    // customer_profiles 테이블 업데이트 (있으면 업데이트, 없으면 생성)
    if (updateData.marketingConsent !== undefined) {
      const { error: profileError } = await supabase
        .from('customer_profiles')
        .upsert({
          customer_id: customerId,
          marketing_consent: updateData.marketingConsent
        })

      if (profileError) {
        console.error('Profile update error:', profileError)
        // 프로필 업데이트 실패는 치명적이지 않음
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Customer profile update error:', error)
    return {
      success: false,
      error: '프로필 업데이트 중 오류가 발생했습니다.'
    }
  }
}