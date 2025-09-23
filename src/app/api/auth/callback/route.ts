import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: '인증 코드가 없습니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error('Code exchange error:', error);
      return NextResponse.json(
        { error: '소셜 로그인 인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    // 사용자 프로필 확인 및 생성
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    let profile = existingProfile;

    if (!existingProfile) {
      const provider = data.user.app_metadata?.provider || 'unknown';
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
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
    }

    return NextResponse.json({
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name,
        role: profile?.role
      },
      message: '소셜 로그인이 성공적으로 완료되었습니다.'
    }, { status: 200 });

  } catch (error) {
    console.error('Auth callback API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}