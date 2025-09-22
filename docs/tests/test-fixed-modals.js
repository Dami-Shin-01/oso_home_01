const { chromium } = require('playwright');

async function testFixedModals() {
  console.log('🛠️ 수정된 모달 기능 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 로그인
    console.log('1️⃣ 로그인...');
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="example@email.com"]', 'admin@osobbq.com');
    await page.fill('input[placeholder="비밀번호를 입력하세요"]', 'Admin123!@#');
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);

    // 시설 등록 테스트
    console.log('\n2️⃣ 시설 등록 버튼 클릭 테스트...');
    await page.goto('http://localhost:3005/admin/facilities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 새 시설 등록 모달 열기
    await page.click('text="새 시설 등록"');
    await page.waitForTimeout(1000);

    // 모달 내부 버튼 클릭 테스트
    const facilityModalVisible = await page.locator('.fixed.inset-0.bg-black').isVisible();
    console.log(`  📋 시설 등록 모달 열림: ${facilityModalVisible ? '✅' : '❌'}`);

    if (facilityModalVisible) {
      // 폼 필드 채우기
      await page.fill('input[placeholder*="시설명"], input[name="name"]', `테스트시설_${Date.now()}`);
      await page.fill('textarea', '테스트용 시설입니다.');
      await page.selectOption('select', '야외');

      // 수용인원 필드 (첫 번째 숫자 입력 필드)
      const numberInputs = await page.locator('input[type="number"]').all();
      if (numberInputs.length > 0) {
        await numberInputs[0].fill('6'); // 수용인원
        console.log('  ✅ 수용인원 입력 성공');
      }

      // 평일 요금
      await page.fill('input[placeholder*="평일"], input[name*="weekday"]', '50000');
      // 주말 요금
      await page.fill('input[placeholder*="주말"], input[name*="weekend"]', '60000');

      console.log('  📝 폼 입력 완료');

      await page.screenshot({ path: 'fixed-facility-form.png' });

      // 저장 버튼 클릭 시도
      try {
        await page.click('button:has-text("저장")');
        await page.waitForTimeout(3000);

        const modalStillVisible = await page.locator('.fixed.inset-0.bg-black').isVisible();
        console.log(`  💾 저장 후 모달 상태: ${modalStillVisible ? '아직 열림 (오류 가능성)' : '닫힘 (성공 가능성)'}`);

        if (!modalStillVisible) {
          console.log('  ✅ 시설 등록 저장 성공 추정');
        }
      } catch (saveError) {
        console.log(`  ❌ 저장 버튼 클릭 오류: ${saveError.message}`);
      }
    }

    // 공지사항 등록 테스트
    console.log('\n3️⃣ 공지사항 등록 버튼 클릭 테스트...');
    await page.goto('http://localhost:3005/admin/content');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 새 공지사항 작성 모달 열기
    await page.click('text="새 공지사항 작성"');
    await page.waitForTimeout(1000);

    const noticeModalVisible = await page.locator('.fixed.inset-0.bg-black').isVisible();
    console.log(`  📋 공지사항 작성 모달 열림: ${noticeModalVisible ? '✅' : '❌'}`);

    if (noticeModalVisible) {
      // 폼 필드 채우기
      await page.fill('input[placeholder*="제목"], input[name="title"]', `테스트공지_${Date.now()}`);
      await page.fill('textarea', '테스트용 공지사항 내용입니다.');

      console.log('  📝 공지사항 폼 입력 완료');

      await page.screenshot({ path: 'fixed-notice-form.png' });

      // 저장 버튼 클릭 시도
      try {
        await page.click('button:has-text("저장")');
        await page.waitForTimeout(3000);

        const modalStillVisible = await page.locator('.fixed.inset-0.bg-black').isVisible();
        console.log(`  💾 저장 후 모달 상태: ${modalStillVisible ? '아직 열림 (오류 가능성)' : '닫힘 (성공 가능성)'}`);

        if (!modalStillVisible) {
          console.log('  ✅ 공지사항 등록 저장 성공 추정');
        }
      } catch (saveError) {
        console.log(`  ❌ 저장 버튼 클릭 오류: ${saveError.message}`);
      }
    }

    // 모달 외부 클릭으로 닫기 테스트
    console.log('\n4️⃣ 모달 외부 클릭으로 닫기 테스트...');
    await page.click('text="새 공지사항 작성"');
    await page.waitForTimeout(1000);

    // 모달 외부 클릭
    await page.click('.fixed.inset-0.bg-black');
    await page.waitForTimeout(1000);

    const modalClosedByOutsideClick = !await page.locator('.fixed.inset-0.bg-black').isVisible();
    console.log(`  🖱️ 외부 클릭으로 모달 닫기: ${modalClosedByOutsideClick ? '✅ 성공' : '❌ 실패'}`);

    console.log('\n5️⃣ 최종 상태 확인...');
    await page.screenshot({ path: 'fixed-modals-final.png', fullPage: true });

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

testFixedModals()
  .then(() => {
    console.log('\n🎉 수정된 모달 테스트 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });