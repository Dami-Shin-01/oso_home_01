import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
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

    const { data: authData, error: signInError } = await supabase.auth.signInWithOAuth({
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

    let profile = null;
    if (authData.user) {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!existingProfile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
              provider: provider,
              role: 'USER',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Profile creation error:', insertError);
          return NextResponse.json(
            { error: '사용자 프로필 생성에 실패했습니다.' },
            { status: 500 }
          );
        }
        profile = newProfile;
      } else {
        profile = existingProfile;
      }
    }

    return NextResponse.json({
      accessToken: authData.session?.access_token,
      refreshToken: authData.session?.refresh_token,
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name: profile?.name,
        role: profile?.role
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Social login API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}