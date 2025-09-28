/**
 * VIP동의 누락된 이미지를 hero-poster.jpg로 임시 대체하는 스크립트
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixVipImages() {
  try {
    console.log('VIP동 이미지 경로 수정 시작...');

    // VIP동 시설 찾기
    const { data: vipFacility, error: findError } = await supabase
      .from('facilities')
      .select('id, name, images')
      .eq('name', 'VIP동')
      .single();

    if (findError || !vipFacility) {
      console.error('VIP동을 찾을 수 없습니다:', findError);
      return;
    }

    console.log('VIP동 찾음:', vipFacility);
    console.log('기존 이미지 경로:', vipFacility.images);

    // 이미지 경로를 hero-poster.jpg로 변경
    const newImages = ['/images/hero-poster.jpg'];

    const { data, error: updateError } = await supabase
      .from('facilities')
      .update({
        images: newImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', vipFacility.id)
      .select();

    if (updateError) {
      console.error('VIP동 이미지 경로 업데이트 실패:', updateError);
      return;
    }

    console.log('✅ VIP동 이미지 경로가 성공적으로 수정되었습니다!');
    console.log('새로운 이미지 경로:', newImages);
    console.log('업데이트된 데이터:', data);

  } catch (error) {
    console.error('스크립트 실행 중 오류:', error);
  }
}

// 스크립트 실행
fixVipImages();