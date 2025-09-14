import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, phone, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: '사용자 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone_number: profile.phone,
        role: profile.role
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get profile API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const updateData = await request.json();
    const allowedFields = ['phone_number'];
    
    const filteredData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'phone_number') {
          filteredData['phone'] = updateData[field];
        } else {
          filteredData[field] = updateData[field];
        }
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json(
        { error: '수정할 정보가 없습니다.' },
        { status: 400 }
      );
    }

    filteredData['updated_at'] = new Date().toISOString();

    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(filteredData)
      .eq('id', user.id)
      .select('id, email, name, phone, role')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: '사용자 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
        phone_number: updatedProfile.phone,
        role: updatedProfile.role
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Update profile API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}