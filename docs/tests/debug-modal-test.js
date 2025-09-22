const { chromium } = require('playwright');

async function debugModalTest() {
  console.log('🔍 모달 작동 디버그 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 1500 });
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

    // 시설 관리 페이지로 이동
    console.log('2️⃣ 시설 관리 페이지로 이동...');
    await page.goto('http://localhost:3005/admin/facilities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('  📍 현재 URL:', page.url());

    // 페이지 내 모든 버튼 찾기
    console.log('3️⃣ 페이지 내 버튼들 확인...');
    const allButtons = await page.locator('button').all();
    console.log(`  🔘 총 버튼 개수: ${allButtons.length}`);

    for (let i = 0; i < allButtons.length; i++) {
      try {
        const text = await allButtons[i].textContent();
        const isVisible = await allButtons[i].isVisible();
        const isEnabled = await allButtons[i].isEnabled();

        if (text && text.trim()) {
          console.log(`    ${i + 1}. "${text.trim()}" - 표시: ${isVisible}, 활성: ${isEnabled}`);
        }
      } catch (e) {}
    }

    // "새 시설 등록" 버튼 찾기 및 클릭
    console.log('\n4️⃣ "새 시설 등록" 버튼 테스트...');

    // 다양한 방법으로 버튼 찾기
    const searchMethods = [
      { name: 'text="새 시설 등록"', selector: 'text="새 시설 등록"' },
      { name: 'button:has-text("새 시설")', selector: 'button:has-text("새 시설")' },
      { name: 'button:has-text("등록")', selector: 'button:has-text("등록")' },
      { name: '[onClick*="setShowFacilityModal"]', selector: '[onclick*="setShowFacilityModal"]' }
    ];

    let foundButton = null;
    for (const method of searchMethods) {
      try {
        const button = page.locator(method.selector).first();
        const isVisible = await button.isVisible({ timeout: 1000 });

        if (isVisible) {
          console.log(`  ✅ 버튼 발견: ${method.name}`);
          foundButton = button;
          break;
        } else {
          console.log(`  ❌ 버튼 미발견: ${method.name}`);
        }
      } catch (e) {
        console.log(`  ❌ 오류: ${method.name} - ${e.message}`);
      }
    }

    if (foundButton) {
      console.log('\n5️⃣ 버튼 클릭 및 모달 확인...');

      // 클릭 전 스크린샷
      await page.screenshot({ path: 'before-click.png', fullPage: true });

      await foundButton.click();
      await page.waitForTimeout(2000);

      // 클릭 후 스크린샷
      await page.screenshot({ path: 'after-click.png', fullPage: true });

      // 모달 요소 확인
      const modalSelectors = [
        '.fixed.inset-0.bg-black',
        '.bg-white.rounded-lg',
        '[role="dialog"]',
        '.modal',
        'h2:has-text("새 시설 등록")'
      ];

      console.log('  모달 요소 확인:');
      for (const selector of modalSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 1000 });
          console.log(`    ${isVisible ? '✅' : '❌'} ${selector}`);
        } catch (e) {
          console.log(`    ❌ ${selector} - 오류: ${e.message}`);
        }
      }

      // 페이지 HTML 확인
      const bodyHTML = await page.innerHTML('body');
      const hasModalInHTML = bodyHTML.includes('새 시설 등록');
      console.log(`  📄 HTML에 모달 내용 존재: ${hasModalInHTML ? '✅' : '❌'}`);

    } else {
      console.log('  ❌ "새 시설 등록" 버튼을 찾을 수 없습니다.');
    }

    console.log('\n6️⃣ 최종 상태 확인...');
    const finalScreenshot = await page.screenshot({ path: 'final-state.png', fullPage: true });
    console.log('  📸 최종 스크린샷 저장: final-state.png');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

debugModalTest()
  .then(() => {
    console.log('\n🎉 디버그 테스트 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });