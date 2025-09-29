/**
 * 정적 경로 이미지를 Supabase Storage로 마이그레이션하는 스크립트
 * VIP동의 누락된 이미지를 위한 placeholder 이미지 생성 및 업로드
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// VIP 시설용 placeholder 이미지 생성 함수
function createPlaceholderImage(width = 800, height = 600, text = 'VIP ROOM') {
  // SVG로 placeholder 이미지 생성
  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- 그라데이션 배경 -->
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 배경 -->
  <rect width="100%" height="100%" fill="url(#grad1)" />

  <!-- 장식 요소 -->
  <circle cx="150" cy="150" r="80" fill="rgba(255,255,255,0.1)" />
  <circle cx="${width-100}" cy="100" r="60" fill="rgba(255,255,255,0.1)" />
  <circle cx="${width-150}" cy="${height-100}" r="70" fill="rgba(255,255,255,0.1)" />

  <!-- 텍스트 -->
  <text x="50%" y="45%"
        font-family="Arial, sans-serif"
        font-size="48"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle">
    ${text}
  </text>

  <!-- 서브 텍스트 -->
  <text x="50%" y="55%"
        font-family="Arial, sans-serif"
        font-size="24"
        fill="rgba(255,255,255,0.8)"
        text-anchor="middle"
        dominant-baseline="middle">
    Premium BBQ Space
  </text>

  <!-- 하단 아이콘 -->
  <text x="50%" y="75%"
        font-family="Arial, sans-serif"
        font-size="40"
        text-anchor="middle"
        dominant-baseline="middle">
    🏠 🔥 ⭐
  </text>
</svg>`;

  return Buffer.from(svg);
}

async function uploadImageToStorage(facilityId, imageBuffer, fileName, contentType = 'image/svg') {
  try {
    const filePath = `${facilityId}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from('facility-images')
      .upload(filePath, imageBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    return filePath;
  } catch (error) {
    console.error('Storage 업로드 실패:', error);
    throw error;
  }
}

async function updateFacilityImages(facilityId, newImagePaths) {
  try {
    // 트리거를 우회하기 위해 RPC 호출 사용
    const { error } = await supabase.rpc('update_facility_images_direct', {
      facility_id: facilityId,
      new_images: newImagePaths
    });

    if (error) {
      // RPC 함수가 없으면 직접 업데이트 시도
      console.log('   ⚠️  RPC 함수 없음, 직접 업데이트 시도...');
      const { error: directError } = await supabase
        .from('facilities')
        .update({
          images: newImagePaths,
          updated_at: new Date().toISOString()
        })
        .eq('id', facilityId);

      if (directError) {
        throw directError;
      }
    }

    return true;
  } catch (error) {
    console.error('데이터베이스 업데이트 실패:', error);
    throw error;
  }
}

async function migrateFacility(facilityId, facilityName) {
  console.log(`📦 ${facilityName} 마이그레이션 시작...`);

  try {
    // VIP 이미지 2개 생성
    const image1 = createPlaceholderImage(1200, 800, 'VIP ROOM');
    const image2 = createPlaceholderImage(1200, 800, 'VIP SPACE');

    console.log('   🖼️  Placeholder 이미지 생성 완료');

    // Storage에 업로드
    const imagePath1 = await uploadImageToStorage(facilityId, image1, 'vip-room-1.svg');
    const imagePath2 = await uploadImageToStorage(facilityId, image2, 'vip-room-2.svg');

    console.log('   ☁️  Storage 업로드 완료');
    console.log(`      - ${imagePath1}`);
    console.log(`      - ${imagePath2}`);

    // 데이터베이스 업데이트
    await updateFacilityImages(facilityId, [imagePath1, imagePath2]);

    console.log('   💾 데이터베이스 업데이트 완료');

    // 업로드된 이미지 URL 생성 및 검증
    const { data: url1 } = supabase.storage
      .from('facility-images')
      .getPublicUrl(imagePath1);

    const { data: url2 } = supabase.storage
      .from('facility-images')
      .getPublicUrl(imagePath2);

    console.log('   🔗 생성된 이미지 URL:');
    console.log(`      - ${url1.publicUrl}`);
    console.log(`      - ${url2.publicUrl}`);

    return {
      success: true,
      facilityId,
      facilityName,
      oldPaths: ['/images/vip-d-1.jpg', '/images/vip-d-2.jpg'],
      newPaths: [imagePath1, imagePath2],
      urls: [url1.publicUrl, url2.publicUrl]
    };

  } catch (error) {
    console.error(`   ❌ ${facilityName} 마이그레이션 실패:`, error.message);
    return {
      success: false,
      facilityId,
      facilityName,
      error: error.message
    };
  }
}

async function runMigration() {
  console.log('🚀 정적 이미지 마이그레이션 시작\n');

  // 분석 결과 로드
  const analysisPath = path.join(__dirname, '..', 'temp', 'image-analysis.json');

  if (!fs.existsSync(analysisPath)) {
    console.error('❌ 분석 결과 파일을 찾을 수 없습니다. 먼저 analyze-image-paths.js를 실행하세요.');
    process.exit(1);
  }

  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
  const staticImages = analysis.static_path_images;

  if (staticImages.length === 0) {
    console.log('✅ 마이그레이션이 필요한 정적 이미지가 없습니다.');
    return;
  }

  console.log(`📋 ${staticImages.length}개의 정적 이미지를 마이그레이션합니다:\n`);

  // 시설별로 그룹화
  const facilitiesToMigrate = {};
  staticImages.forEach(img => {
    if (!facilitiesToMigrate[img.facility_id]) {
      facilitiesToMigrate[img.facility_id] = {
        name: img.facility_name,
        images: []
      };
    }
    facilitiesToMigrate[img.facility_id].images.push(img.image_path);
  });

  const results = [];

  // 각 시설별로 마이그레이션 실행
  for (const [facilityId, data] of Object.entries(facilitiesToMigrate)) {
    const result = await migrateFacility(facilityId, data.name);
    results.push(result);
    console.log('');
  }

  // 결과 요약
  console.log('📊 마이그레이션 결과 요약:');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`   ✅ 성공: ${successful.length}개`);
  console.log(`   ❌ 실패: ${failed.length}개\n`);

  if (successful.length > 0) {
    console.log('🎉 성공한 마이그레이션:');
    successful.forEach(result => {
      console.log(`   - ${result.facilityName}`);
      console.log(`     이전: ${result.oldPaths.join(', ')}`);
      console.log(`     이후: ${result.newPaths.join(', ')}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ 실패한 마이그레이션:');
    failed.forEach(result => {
      console.log(`   - ${result.facilityName}: ${result.error}`);
    });
  }

  // 결과를 JSON 파일로 저장
  const resultPath = path.join(__dirname, '..', 'temp', 'migration-results.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 마이그레이션 결과가 저장되었습니다: ${resultPath}`);
}

// 스크립트 실행
if (require.main === module) {
  runMigration();
}

module.exports = { migrateFacility, runMigration };