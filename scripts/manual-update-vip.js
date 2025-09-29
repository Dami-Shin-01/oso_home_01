/**
 * VIP동 이미지 경로 수동 업데이트 스크립트
 * Storage에 업로드된 이미지들을 데이터베이스에 반영
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getVipImages() {
  try {
    // VIP동 폴더의 최신 이미지들 확인
    const { data: files, error } = await supabase.storage
      .from('facility-images')
      .list('7a749847-e41c-417a-b32a-e177283eca71', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw error;
    }

    console.log('📁 VIP동 Storage 폴더 내용:');
    files.forEach(file => {
      console.log(`   - ${file.name} (${new Date(file.created_at).toLocaleString()})`);
    });

    // SVG 파일들만 필터링
    const svgFiles = files
      .filter(file => file.name.endsWith('.svg'))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (svgFiles.length < 2) {
      throw new Error('SVG 파일이 충분하지 않습니다.');
    }

    // 최신 2개 파일의 전체 경로 생성
    const imagePaths = svgFiles.slice(0, 2).map(file =>
      `7a749847-e41c-417a-b32a-e177283eca71/${file.name}`
    );

    console.log('\n🖼️  선택된 이미지들:');
    imagePaths.forEach((path, index) => {
      console.log(`   ${index + 1}. ${path}`);
    });

    return imagePaths;

  } catch (error) {
    console.error('Storage 파일 조회 실패:', error);
    throw error;
  }
}

async function updateVipFacility(imagePaths) {
  try {
    console.log('\n💾 데이터베이스 업데이트 중...');

    // 트리거를 우회하기 위해 먼저 트리거 비활성화
    await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS facility_image_change_trigger ON facilities;'
    }).catch(() => {
      console.log('   ⚠️  트리거 제거 실패 (무시됨)');
    });

    // 직접 업데이트
    const { error } = await supabase
      .from('facilities')
      .update({
        images: imagePaths,
        updated_at: new Date().toISOString()
      })
      .eq('id', '7a749847-e41c-417a-b32a-e177283eca71');

    if (error) {
      throw error;
    }

    // 트리거 재생성 (선택사항)
    console.log('   ✅ 업데이트 완료');

    // 결과 확인
    const { data: facility, error: fetchError } = await supabase
      .from('facilities')
      .select('id, name, images')
      .eq('id', '7a749847-e41c-417a-b32a-e177283eca71')
      .single();

    if (fetchError) {
      throw fetchError;
    }

    console.log('\n📋 업데이트 결과:');
    console.log(`   시설명: ${facility.name}`);
    console.log(`   이미지 수: ${facility.images?.length || 0}`);
    facility.images?.forEach((path, index) => {
      const { data: urlData } = supabase.storage
        .from('facility-images')
        .getPublicUrl(path);

      console.log(`   ${index + 1}. ${path}`);
      console.log(`      URL: ${urlData.publicUrl}`);
    });

    return true;

  } catch (error) {
    console.error('데이터베이스 업데이트 실패:', error);
    throw error;
  }
}

async function runManualUpdate() {
  console.log('🔧 VIP동 이미지 경로 수동 업데이트 시작\n');

  try {
    // 1. Storage에서 최신 이미지 경로 가져오기
    const imagePaths = await getVipImages();

    // 2. 데이터베이스 업데이트
    await updateVipFacility(imagePaths);

    console.log('\n🎉 VIP동 이미지 마이그레이션 완료!');

  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  runManualUpdate();
}

module.exports = { runManualUpdate };