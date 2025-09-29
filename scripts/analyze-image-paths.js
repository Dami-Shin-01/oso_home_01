/**
 * 시설 이미지 경로 분석 스크립트
 * 모든 시설의 이미지 경로를 분석하여 정적 경로와 Storage 경로를 구분
 */

const fs = require('fs');
const path = require('path');

async function analyzeFacilityImages() {
  try {
    // 로컬 서버에서 시설 정보 가져오기
    const response = await fetch('http://localhost:3002/api/public/facilities');
    const data = await response.json();

    if (!data.success) {
      throw new Error('Failed to fetch facilities');
    }

    const facilities = data.data.facilities;
    const analysis = {
      total_facilities: facilities.length,
      facilities_with_images: 0,
      facilities_without_images: 0,
      static_path_images: [],
      storage_path_images: [],
      summary: {
        static_path_count: 0,
        storage_path_count: 0,
        total_images: 0
      }
    };

    console.log('🔍 시설 이미지 경로 분석 시작...\n');
    console.log(`총 ${facilities.length}개 시설 분석 중...\n`);

    facilities.forEach((facility, index) => {
      console.log(`${index + 1}. ${facility.name} (ID: ${facility.id})`);

      if (!facility.images || facility.images.length === 0) {
        console.log('   ❌ 이미지 없음\n');
        analysis.facilities_without_images++;
        return;
      }

      analysis.facilities_with_images++;
      console.log(`   📸 이미지 ${facility.images.length}개`);

      facility.images.forEach((imagePath, imgIndex) => {
        analysis.summary.total_images++;

        if (imagePath.startsWith('/images/')) {
          // 정적 파일 경로
          analysis.static_path_images.push({
            facility_id: facility.id,
            facility_name: facility.name,
            image_index: imgIndex,
            image_path: imagePath,
            type: 'static'
          });
          analysis.summary.static_path_count++;
          console.log(`     📁 [정적] ${imagePath}`);
        } else {
          // Storage 경로
          analysis.storage_path_images.push({
            facility_id: facility.id,
            facility_name: facility.name,
            image_index: imgIndex,
            image_path: imagePath,
            type: 'storage'
          });
          analysis.summary.storage_path_count++;
          console.log(`     ☁️ [Storage] ${imagePath}`);
        }
      });
      console.log('');
    });

    // 분석 결과 출력
    console.log('📊 분석 결과 요약:');
    console.log(`   - 총 시설 수: ${analysis.total_facilities}`);
    console.log(`   - 이미지 보유 시설: ${analysis.facilities_with_images}`);
    console.log(`   - 이미지 없는 시설: ${analysis.facilities_without_images}`);
    console.log(`   - 총 이미지 수: ${analysis.summary.total_images}`);
    console.log(`   - 정적 경로 이미지: ${analysis.summary.static_path_count}`);
    console.log(`   - Storage 경로 이미지: ${analysis.summary.storage_path_count}\n`);

    // 분석 결과를 JSON 파일로 저장
    const outputPath = path.join(__dirname, '..', 'temp', 'image-analysis.json');

    // temp 디렉토리 생성
    const tempDir = path.dirname(outputPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`💾 분석 결과가 저장되었습니다: ${outputPath}`);

    // 정적 경로 이미지가 있는 경우 경고
    if (analysis.summary.static_path_count > 0) {
      console.log('\n⚠️  정적 경로 이미지 발견:');
      analysis.static_path_images.forEach(img => {
        console.log(`   - ${img.facility_name}: ${img.image_path}`);
      });
    }

    return analysis;

  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  analyzeFacilityImages();
}

module.exports = { analyzeFacilityImages };