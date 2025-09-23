import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { provider, code } = await request.json();

    if (!provider || !code) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!['kakao'].includes(provider)) {
      return NextResponse.json(
        { error: '현재 카카오 로그인만 지원됩니다.' },
        { status: 400 }
      );
    }

    const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithOAuth({
      provider: provider as 'kakao',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    });

    if (signInError) {
      return NextResponse.json(
        { error: '소셜 로그인에 실패했습니다.' },
        { status: 401 }
      );
    }

    // OAuth는 리다이렉트 URL을 반환합니다
    return NextResponse.json({
      redirectUrl: authData.url,
      message: '소셜 로그인 URL이 생성되었습니다.'
    }, { status: 200 });

  } catch (error) {
    console.error('Social login API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}