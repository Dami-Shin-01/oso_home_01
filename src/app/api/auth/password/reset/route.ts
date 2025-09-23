import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: '토큰과 새 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const { data, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: 'recovery'
    });

    if (verifyError || !data.user) {
      return NextResponse.json(
        { error: '유효하지 않은 재설정 토큰입니다.' },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabaseAdmin.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return NextResponse.json(
        { error: '비밀번호 재설정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '비밀번호가 성공적으로 재설정되었습니다.'
    }, { status: 200 });

  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}