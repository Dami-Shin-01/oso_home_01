const { chromium } = require('playwright');

async function debugContentModalTest() {
  console.log('🔍 콘텐츠 관리 모달 디버그 테스트 시작...\n');

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

    // 콘텐츠 관리 페이지로 이동
    console.log('2️⃣ 콘텐츠 관리 페이지로 이동...');
    await page.goto('http://localhost:3005/admin/content');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('  📍 현재 URL:', page.url());

    // "새 공지사항 작성" 버튼 찾기
    console.log('3️⃣ "새 공지사항 작성" 버튼 찾기...');

    const searchMethods = [
      { name: 'text="새 공지사항 작성"', selector: 'text="새 공지사항 작성"' },
      { name: 'button:has-text("새 공지사항")', selector: 'button:has-text("새 공지사항")' },
      { name: 'button:has-text("작성")', selector: 'button:has-text("작성")' }
    ];

    let foundButton = null;
    for (const method of searchMethods) {
      try {
        const button = page.locator(method.selector).first();
        const isVisible = await button.isVisible({ timeout: 2000 });

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
      console.log('\n4️⃣ 버튼 클릭 및 모달 확인...');

      // 클릭 전 스크린샷
      await page.screenshot({ path: 'content-before-click.png', fullPage: true });

      await foundButton.click();
      await page.waitForTimeout(2000);

      // 클릭 후 스크린샷
      await page.screenshot({ path: 'content-after-click.png', fullPage: true });

      // 모달 요소 확인
      const modalSelectors = [
        '.fixed.inset-0.bg-black',
        '.bg-white.rounded-lg',
        'h2:has-text("새 공지사항 작성")',
        'input[placeholder*="제목"], input[name="title"]',
        'textarea'
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
      const hasModalInHTML = bodyHTML.includes('새 공지사항 작성');
      console.log(`  📄 HTML에 모달 내용 존재: ${hasModalInHTML ? '✅' : '❌'}`);

      // 모달 내 입력 필드 테스트
      console.log('\n5️⃣ 모달 입력 필드 테스트...');
      try {
        const titleInput = page.locator('input[placeholder*="제목"], input[name="title"]').first();
        const titleVisible = await titleInput.isVisible({ timeout: 1000 });

        if (titleVisible) {
          await titleInput.fill('테스트 공지사항');
          console.log('  ✅ 제목 입력 필드 정상 작동');
        }

        const contentTextarea = page.locator('textarea').first();
        const textareaVisible = await contentTextarea.isVisible({ timeout: 1000 });

        if (textareaVisible) {
          await contentTextarea.fill('테스트 내용입니다.');
          console.log('  ✅ 내용 입력 필드 정상 작동');
        }

        await page.screenshot({ path: 'content-form-filled.png', fullPage: true });

      } catch (inputError) {
        console.log(`  ❌ 입력 필드 테스트 오류: ${inputError.message}`);
      }

    } else {
      console.log('  ❌ "새 공지사항 작성" 버튼을 찾을 수 없습니다.');
    }

    console.log('\n6️⃣ 최종 상태 확인...');
    await page.screenshot({ path: 'content-final-state.png', fullPage: true });
    console.log('  📸 최종 스크린샷 저장: content-final-state.png');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

debugContentModalTest()
  .then(() => {
    console.log('\n🎉 콘텐츠 모달 디버그 테스트 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });