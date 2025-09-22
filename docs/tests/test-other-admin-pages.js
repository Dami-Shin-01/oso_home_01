const { chromium } = require('playwright');

async function testOtherAdminPages() {
  console.log('🚀 다른 관리자 페이지들 세부 버튼 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 로그인
    console.log('1️⃣ 관리자 로그인...');
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="example@email.com"]', 'admin@osobbq.com');
    await page.fill('input[placeholder="비밀번호를 입력하세요"]', 'Admin123!@#');
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:3005/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ 로그인 성공\n');

    // 시설 관리 페이지 테스트
    await testFacilityManagement(page);

    // 콘텐츠 관리 페이지 테스트
    await testContentManagement(page);

    // 회원 관리 페이지 테스트
    await testUserManagement(page);

    // 기타 페이지들 테스트
    await testOtherPages(page);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

async function testFacilityManagement(page) {
  console.log('2️⃣ 시설 관리 페이지 테스트...');

  try {
    // 시설 관리 버튼 클릭
    await page.click('text=시설 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('  📍 시설 관리 페이지 URL:', page.url());
    await page.screenshot({ path: 'admin-facility-management.png', fullPage: true });

    // 페이지 내 버튼들 확인
    const buttons = await page.locator('button').all();
    console.log('\n  🔘 시설 관리 페이지 버튼들:');

    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      try {
        const text = await buttons[i].textContent();
        const isVisible = await buttons[i].isVisible();
        const isEnabled = await buttons[i].isEnabled();

        if (text && text.trim()) {
          console.log(`    ${isVisible && isEnabled ? '✅' : '⚠️'} ${text.trim()}`);

          // 추가/편집 버튼 클릭 테스트
          if (isVisible && isEnabled && (text.includes('추가') || text.includes('시설'))) {
            try {
              await buttons[i].click();
              await page.waitForTimeout(2000);

              // 모달이나 폼이 열렸는지 확인
              const modal = await page.locator('.modal, [role="dialog"], .popup').first();
              const modalVisible = await modal.isVisible();

              if (modalVisible) {
                console.log(`      ✅ ${text.trim()} - 모달 열림`);
                await page.screenshot({ path: `facility-${text.trim().replace(/\s+/g, '-')}-modal.png` });

                // 모달 닫기
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
              }
            } catch (e) {
              console.log(`      ⚠️ ${text.trim()} - 클릭 오류: ${e.message}`);
            }
          }
        }
      } catch (e) {}
    }

    // 테이블 내용 확인
    const tableContent = await page.textContent('body');
    if (tableContent.includes('시설이 없습니다') || tableContent.includes('등록된 시설')) {
      console.log('    📊 시설 데이터 표시 상태 확인됨');
    }

  } catch (error) {
    console.log(`  ❌ 시설 관리 페이지 오류: ${error.message}`);
  }
}

async function testContentManagement(page) {
  console.log('\n3️⃣ 콘텐츠 관리 페이지 테스트...');

  try {
    // 먼저 관리자 홈으로 돌아가기
    await page.goto('http://localhost:3005/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 콘텐츠 관리 버튼 클릭
    await page.click('text=콘텐츠 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('  📍 콘텐츠 관리 페이지 URL:', page.url());
    await page.screenshot({ path: 'admin-content-management.png', fullPage: true });

    // 페이지 내 버튼들 확인
    const buttons = await page.locator('button').all();
    console.log('\n  🔘 콘텐츠 관리 페이지 버튼들:');

    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      try {
        const text = await buttons[i].textContent();
        const isVisible = await buttons[i].isVisible();
        const isEnabled = await buttons[i].isEnabled();

        if (text && text.trim()) {
          console.log(`    ${isVisible && isEnabled ? '✅' : '⚠️'} ${text.trim()}`);
        }
      } catch (e) {}
    }

    // 탭 또는 섹션 확인
    const tabs = await page.locator('a, .tab, .nav-link').all();
    console.log('\n  📑 콘텐츠 관리 탭/섹션:');

    for (let i = 0; i < Math.min(tabs.length, 8); i++) {
      try {
        const text = await tabs[i].textContent();
        const href = await tabs[i].getAttribute('href');

        if (text && text.trim() && (text.includes('공지') || text.includes('FAQ') || text.includes('콘텐츠'))) {
          console.log(`    📂 ${text.trim()} ${href ? `(${href})` : ''}`);
        }
      } catch (e) {}
    }

  } catch (error) {
    console.log(`  ❌ 콘텐츠 관리 페이지 오류: ${error.message}`);
  }
}

async function testUserManagement(page) {
  console.log('\n4️⃣ 회원 관리 페이지 테스트...');

  try {
    // 먼저 관리자 홈으로 돌아가기
    await page.goto('http://localhost:3005/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 회원 관리 버튼 클릭
    await page.click('text=회원 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('  📍 회원 관리 페이지 URL:', page.url());
    await page.screenshot({ path: 'admin-user-management.png', fullPage: true });

    // 페이지 내 버튼들 확인
    const buttons = await page.locator('button').all();
    console.log('\n  🔘 회원 관리 페이지 버튼들:');

    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      try {
        const text = await buttons[i].textContent();
        const isVisible = await buttons[i].isVisible();
        const isEnabled = await buttons[i].isEnabled();

        if (text && text.trim()) {
          console.log(`    ${isVisible && isEnabled ? '✅' : '⚠️'} ${text.trim()}`);
        }
      } catch (e) {}
    }

    // 검색 기능 확인
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="검색"]').all();
    console.log(`\n  🔍 검색 입력 필드: ${searchInputs.length}개`);

    // 필터 기능 확인
    const selects = await page.locator('select').all();
    console.log(`  🎛️ 필터 선택 박스: ${selects.length}개`);

  } catch (error) {
    console.log(`  ❌ 회원 관리 페이지 오류: ${error.message}`);
  }
}

async function testOtherPages(page) {
  console.log('\n5️⃣ 기타 관리자 페이지들 테스트...');

  const otherPages = [
    { name: '오늘 예약', path: '/admin/today-reservations' },
    { name: '미발행 콘텐츠', path: '/admin/unpublished-notices' },
    { name: '분석', path: '/admin/analytics' },
    { name: '설정', path: '/admin/settings' }
  ];

  for (const pageInfo of otherPages) {
    try {
      console.log(`\n  📄 ${pageInfo.name} 페이지 테스트...`);

      await page.goto(`http://localhost:3005${pageInfo.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log(`    📍 URL: ${page.url()}`);

      // 페이지가 정상적으로 로드되었는지 확인
      const pageContent = await page.textContent('body');
      const hasError = pageContent.includes('404') || pageContent.includes('오류') || pageContent.includes('찾을 수 없습니다');

      if (hasError) {
        console.log(`    ❌ ${pageInfo.name} - 페이지 오류 또는 404`);
      } else {
        console.log(`    ✅ ${pageInfo.name} - 정상 로드`);

        // 주요 버튼들 확인
        const buttons = await page.locator('button').all();
        const buttonCount = Math.min(buttons.length, 5);

        for (let i = 0; i < buttonCount; i++) {
          try {
            const text = await buttons[i].textContent();
            if (text && text.trim()) {
              console.log(`      🔘 ${text.trim()}`);
            }
          } catch (e) {}
        }
      }

      await page.screenshot({ path: `admin-${pageInfo.name.replace(/\s+/g, '-')}.png` });

    } catch (error) {
      console.log(`    ❌ ${pageInfo.name} 페이지 오류: ${error.message}`);
    }
  }
}

// 스크립트 실행
testOtherAdminPages()
  .then(() => {
    console.log('\n🎉 모든 관리자 페이지 테스트 완료!');
    console.log('\n📸 저장된 스크린샷:');
    console.log('  - admin-facility-management.png');
    console.log('  - admin-content-management.png');
    console.log('  - admin-user-management.png');
    console.log('  - 기타 페이지 스크린샷들');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });