const { chromium } = require('playwright');

async function testAdminPage() {
  console.log('🚀 관리자 페이지 자동화 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    login: false,
    navigation: {},
    buttons: {},
    pages: {},
    errors: []
  };

  try {
    // 1. 로그인 테스트 (일반 로그인 페이지에서 관리자 계정으로 로그인)
    console.log('1️⃣ 관리자 계정으로 로그인 테스트...');
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    // 로그인 폼 입력 (더 정확한 셀렉터 사용)
    const emailField = await page.locator('input[placeholder="example@email.com"]').first();
    const passwordField = await page.locator('input[placeholder="비밀번호를 입력하세요"]').first();

    await emailField.fill('admin@osobbq.com');
    await passwordField.fill('Admin123!@#');

    console.log('  📝 로그인 정보 입력 완료');

    // 로그인 버튼 클릭
    const loginButton = await page.locator('button:has-text("로그인")').first();
    await loginButton.click();

    console.log('  🔄 로그인 버튼 클릭됨, 응답 대기 중...');

    // 로그인 처리 대기 (더 긴 시간)
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // 로그인 후 현재 URL 확인
    let currentUrl = page.url();
    console.log('  📍 로그인 후 현재 URL:', currentUrl);

    // 로그인 성공 후 관리자 페이지 접근 테스트
    console.log('  🔄 관리자 페이지로 이동 중...');
    await page.goto('http://localhost:3005/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    currentUrl = page.url();
    const pageContent = await page.textContent('body');

    console.log('  📍 관리자 페이지 URL:', currentUrl);
    console.log('  📄 페이지 내용 확인 중...');

    // 관리자 페이지 접근 가능 여부 확인
    const hasAdminContent = pageContent.includes('관리자') ||
                           pageContent.includes('대시보드') ||
                           pageContent.includes('DB 테스트') ||
                           pageContent.includes('시설 관리') ||
                           pageContent.includes('예약 관리');

    if (currentUrl.includes('/admin') && !currentUrl.includes('/login') && hasAdminContent) {
      results.login = true;
      console.log('✅ 관리자 로그인 및 페이지 접근 성공');
    } else if (!currentUrl.includes('/admin')) {
      results.login = false;
      console.log('❌ 관리자 페이지에 접근할 수 없음 (권한 부족)');
      results.errors.push('관리자 권한 없음 - 현재 URL: ' + currentUrl);
    } else {
      results.login = false;
      console.log('❌ 관리자 로그인 또는 페이지 접근 실패');
      results.errors.push('관리자 접근 실패 - URL: ' + currentUrl);
    }

    await page.screenshot({ path: 'admin-login-result.png', fullPage: true });

    if (!results.login) {
      throw new Error('관리자 로그인에 실패했습니다.');
    }

    // 2. 관리자 대시보드 네비게이션 테스트
    console.log('\n2️⃣ 네비게이션 메뉴 테스트...');

    const navItems = [
      { name: '대시보드', selector: 'a[href="/admin"]' },
      { name: '예약 관리', selector: 'a[href="/admin/reservations"]' },
      { name: '오늘 예약', selector: 'a[href="/admin/today-reservations"]' },
      { name: '시설 관리', selector: 'a[href="/admin/facilities"]' },
      { name: '사용자 관리', selector: 'a[href="/admin/users"]' },
      { name: '공지사항', selector: 'a[href="/admin/notices"]' },
      { name: 'FAQ', selector: 'a[href="/admin/faqs"]' },
      { name: '미발행 콘텐츠', selector: 'a[href="/admin/unpublished-notices"]' }
    ];

    for (const item of navItems) {
      try {
        console.log(`  📍 ${item.name} 메뉴 테스트...`);

        // 메뉴 클릭
        await page.click(item.selector);
        await page.waitForLoadState('networkidle');

        // 페이지 로드 확인
        const url = page.url();
        const isCorrectPage = url.includes(item.selector.match(/href="([^"]+)"/)[1]);

        results.navigation[item.name] = {
          success: isCorrectPage,
          url: url,
          error: isCorrectPage ? null : '잘못된 페이지로 이동'
        };

        console.log(`    ${isCorrectPage ? '✅' : '❌'} ${item.name}: ${url}`);

        await page.screenshot({
          path: `admin-${item.name.replace(/\s+/g, '-')}.png`,
          fullPage: true
        });

        await page.waitForTimeout(1000);

      } catch (error) {
        results.navigation[item.name] = {
          success: false,
          url: page.url(),
          error: error.message
        };
        console.log(`    ❌ ${item.name}: ${error.message}`);
      }
    }

    // 3. 각 페이지별 주요 버튼 테스트
    console.log('\n3️⃣ 페이지별 버튼 테스트...');

    // 3-1. 예약 관리 페이지
    console.log('  📋 예약 관리 페이지 버튼 테스트...');
    await page.goto('http://localhost:3005/admin/reservations');
    await page.waitForLoadState('networkidle');

    const reservationButtons = [
      { name: '예약 추가', selector: 'button:has-text("예약 추가"), .btn:has-text("예약 추가")' },
      { name: '상태 필터', selector: 'select, .select' },
      { name: '새로고침', selector: 'button:has-text("새로고침"), .btn:has-text("새로고침")' }
    ];

    results.buttons.reservations = {};

    for (const btn of reservationButtons) {
      try {
        const element = await page.locator(btn.selector).first();
        const isVisible = await element.isVisible();
        const isEnabled = await element.isEnabled();

        results.buttons.reservations[btn.name] = {
          visible: isVisible,
          enabled: isEnabled,
          success: isVisible && isEnabled
        };

        console.log(`    ${isVisible && isEnabled ? '✅' : '❌'} ${btn.name}`);

        if (isVisible && isEnabled && btn.name !== '상태 필터') {
          await element.click();
          await page.waitForTimeout(500);
        }

      } catch (error) {
        results.buttons.reservations[btn.name] = {
          visible: false,
          enabled: false,
          success: false,
          error: error.message
        };
        console.log(`    ❌ ${btn.name}: ${error.message}`);
      }
    }

    // 3-2. 시설 관리 페이지
    console.log('  🏢 시설 관리 페이지 버튼 테스트...');
    await page.goto('http://localhost:3005/admin/facilities');
    await page.waitForLoadState('networkidle');

    const facilityButtons = [
      { name: '시설 추가', selector: 'button:has-text("시설 추가"), .btn:has-text("시설 추가")' },
      { name: '구역 추가', selector: 'button:has-text("구역 추가"), .btn:has-text("구역 추가")' },
      { name: '새로고침', selector: 'button:has-text("새로고침"), .btn:has-text("새로고침")' }
    ];

    results.buttons.facilities = {};

    for (const btn of facilityButtons) {
      try {
        const element = await page.locator(btn.selector).first();
        const isVisible = await element.isVisible();
        const isEnabled = await element.isEnabled();

        results.buttons.facilities[btn.name] = {
          visible: isVisible,
          enabled: isEnabled,
          success: isVisible && isEnabled
        };

        console.log(`    ${isVisible && isEnabled ? '✅' : '❌'} ${btn.name}`);

        if (isVisible && isEnabled) {
          await element.click();
          await page.waitForTimeout(1000);

          // 모달이 열렸는지 확인
          const modal = await page.locator('.modal, [role="dialog"]').first();
          const modalVisible = await modal.isVisible();

          if (modalVisible) {
            console.log(`      ✅ ${btn.name} 모달 열림`);
            // 모달 닫기
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        }

      } catch (error) {
        results.buttons.facilities[btn.name] = {
          visible: false,
          enabled: false,
          success: false,
          error: error.message
        };
        console.log(`    ❌ ${btn.name}: ${error.message}`);
      }
    }

    // 3-3. 공지사항 관리 페이지
    console.log('  📢 공지사항 관리 페이지 버튼 테스트...');
    await page.goto('http://localhost:3005/admin/notices');
    await page.waitForLoadState('networkidle');

    const noticeButtons = [
      { name: '공지사항 추가', selector: 'button:has-text("공지사항 추가"), .btn:has-text("공지사항 추가"), button:has-text("추가")' },
      { name: '새로고침', selector: 'button:has-text("새로고침"), .btn:has-text("새로고침")' }
    ];

    results.buttons.notices = {};

    for (const btn of noticeButtons) {
      try {
        const element = await page.locator(btn.selector).first();
        const isVisible = await element.isVisible();
        const isEnabled = await element.isEnabled();

        results.buttons.notices[btn.name] = {
          visible: isVisible,
          enabled: isEnabled,
          success: isVisible && isEnabled
        };

        console.log(`    ${isVisible && isEnabled ? '✅' : '❌'} ${btn.name}`);

      } catch (error) {
        results.buttons.notices[btn.name] = {
          visible: false,
          enabled: false,
          success: false,
          error: error.message
        };
        console.log(`    ❌ ${btn.name}: ${error.message}`);
      }
    }

    // 4. DB 테스트 버튼 확인
    console.log('\n4️⃣ DB 테스트 버튼 확인...');
    await page.goto('http://localhost:3005/admin');
    await page.waitForLoadState('networkidle');

    try {
      const dbTestButton = await page.locator('button:has-text("DB 테스트"), .btn:has-text("DB 테스트")').first();
      const isVisible = await dbTestButton.isVisible();
      const isEnabled = await dbTestButton.isEnabled();

      results.buttons.dbTest = {
        visible: isVisible,
        enabled: isEnabled,
        success: isVisible && isEnabled
      };

      console.log(`  ${isVisible && isEnabled ? '✅' : '❌'} DB 테스트 버튼`);

      if (isVisible && isEnabled) {
        await dbTestButton.click();
        await page.waitForTimeout(2000);

        // 테스트 결과 확인
        const testResults = await page.locator('.alert, .toast, .success, .error').count();
        console.log(`    📊 DB 테스트 결과 요소 개수: ${testResults}`);
      }

    } catch (error) {
      results.buttons.dbTest = {
        visible: false,
        enabled: false,
        success: false,
        error: error.message
      };
      console.log(`  ❌ DB 테스트 버튼: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    results.errors.push(error.message);
  } finally {
    await page.screenshot({ path: 'admin-final-state.png', fullPage: true });
    await browser.close();
  }

  // 5. 테스트 결과 요약
  console.log('\n📊 테스트 결과 요약:');
  console.log('==========================================');
  console.log(`로그인: ${results.login ? '✅ 성공' : '❌ 실패'}`);

  console.log('\n네비게이션:');
  Object.entries(results.navigation).forEach(([name, result]) => {
    console.log(`  ${result.success ? '✅' : '❌'} ${name}`);
  });

  console.log('\n버튼 테스트:');
  Object.entries(results.buttons).forEach(([section, buttons]) => {
    console.log(`  📁 ${section}:`);
    Object.entries(buttons).forEach(([name, result]) => {
      console.log(`    ${result.success ? '✅' : '❌'} ${name}`);
    });
  });

  if (results.errors.length > 0) {
    console.log('\n⚠️ 오류 목록:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n🖼️ 스크린샷이 저장되었습니다:');
  console.log('  - admin-login-result.png');
  console.log('  - admin-대시보드.png, admin-예약-관리.png 등');
  console.log('  - admin-final-state.png');

  return results;
}

// 스크립트 실행
testAdminPage()
  .then(results => {
    console.log('\n🎉 테스트 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });