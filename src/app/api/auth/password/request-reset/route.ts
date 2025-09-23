import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: '가입되지 않은 이메일입니다.' },
        { status: 404 }
      );
    }

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
    });

    if (resetError) {
      console.error('Password reset request error:', resetError);
      return NextResponse.json(
        { error: '비밀번호 재설정 요청에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
    }, { status: 200 });

  } catch (error) {
    console.error('Password reset request API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}