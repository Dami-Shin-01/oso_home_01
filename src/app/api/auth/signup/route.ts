import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone_number } = await request.json();

    if (!email || !password || !name || !phone_number) {
      return NextResponse.json(
        { error: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: '이미 사용 중인 이메일입니다.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: '회원가입에 실패했습니다: ' + signUpError.message },
        { status: 400 }
      );
    }

    if (authData.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: email,
            name: name,
            phone: phone_number,
            provider: 'email',
            role: 'USER',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        console.error('User profile creation error:', insertError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        return NextResponse.json(
          { error: '사용자 프로필 생성에 실패했습니다.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: '회원가입이 성공적으로 완료되었습니다.',
      user: {
        id: authData.user?.id,
        email: email,
        name: name,
        role: 'USER'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}