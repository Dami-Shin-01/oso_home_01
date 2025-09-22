const { chromium } = require('playwright');

async function testAdminPagesInDetail() {
  console.log('🚀 관리자 페이지 세부 버튼 기능 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    login: false,
    reservationPage: {},
    contentPage: {},
    facilityPage: {},
    userPage: {},
    dbTest: {},
    errors: []
  };

  try {
    // 1. 로그인
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

    // 2. 예약 관리 페이지 테스트
    console.log('2️⃣ 예약 관리 페이지 세부 테스트...');
    await page.click('text=예약 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('  📍 현재 URL:', page.url());
    await page.screenshot({ path: 'admin-reservations-page.png', fullPage: true });

    // 예약 관리 페이지 버튼들 테스트
    const reservationButtons = [
      { name: '예약 추가', selectors: ['button:has-text("예약 추가")', 'button:has-text("추가")', '.btn:has-text("추가")'] },
      { name: '새로고침', selectors: ['button:has-text("새로고침")', '.btn:has-text("새로고침")'] },
      { name: '엑셀 다운로드', selectors: ['button:has-text("엑셀")', 'button:has-text("다운로드")'] },
      { name: '필터', selectors: ['select', '.select', 'button:has-text("필터")'] }
    ];

    results.reservationPage = await testButtonsOnPage(page, reservationButtons, '예약 관리');

    // 3. 콘텐츠 관리 페이지 테스트
    console.log('\n3️⃣ 콘텐츠 관리 페이지 세부 테스트...');
    await page.click('text=콘텐츠 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('  📍 현재 URL:', page.url());
    await page.screenshot({ path: 'admin-content-page.png', fullPage: true });

    const contentButtons = [
      { name: '공지사항 추가', selectors: ['button:has-text("공지사항 추가")', 'button:has-text("추가")', '.btn:has-text("추가")'] },
      { name: 'FAQ 추가', selectors: ['button:has-text("FAQ 추가")', 'button:has-text("FAQ")', '.btn:has-text("FAQ")'] },
      { name: '발행', selectors: ['button:has-text("발행")', '.btn:has-text("발행")'] },
      { name: '수정', selectors: ['button:has-text("수정")', '.btn:has-text("수정")'] },
      { name: '삭제', selectors: ['button:has-text("삭제")', '.btn:has-text("삭제")'] }
    ];

    results.contentPage = await testButtonsOnPage(page, contentButtons, '콘텐츠 관리');

    // 4. 시설 관리 페이지 테스트
    console.log('\n4️⃣ 시설 관리 페이지 세부 테스트...');
    await page.click('text=시설 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('  📍 현재 URL:', page.url());
    await page.screenshot({ path: 'admin-facilities-page.png', fullPage: true });

    const facilityButtons = [
      { name: '시설 추가', selectors: ['button:has-text("시설 추가")', 'button:has-text("추가")', '.btn:has-text("시설")'] },
      { name: '구역 추가', selectors: ['button:has-text("구역 추가")', 'button:has-text("구역")', '.btn:has-text("구역")'] },
      { name: '수정', selectors: ['button:has-text("수정")', '.btn:has-text("수정")'] },
      { name: '삭제', selectors: ['button:has-text("삭제")', '.btn:has-text("삭제")'] },
      { name: '새로고침', selectors: ['button:has-text("새로고침")', '.btn:has-text("새로고침")'] }
    ];

    results.facilityPage = await testButtonsOnPage(page, facilityButtons, '시설 관리');

    // 5. 회원 관리 페이지 테스트
    console.log('\n5️⃣ 회원 관리 페이지 세부 테스트...');
    await page.click('text=회원 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('  📍 현재 URL:', page.url());
    await page.screenshot({ path: 'admin-users-page.png', fullPage: true });

    const userButtons = [
      { name: '회원 추가', selectors: ['button:has-text("회원 추가")', 'button:has-text("추가")', '.btn:has-text("회원")'] },
      { name: '권한 변경', selectors: ['button:has-text("권한")', 'select', '.select'] },
      { name: '상태 변경', selectors: ['button:has-text("상태")', 'button:has-text("활성")', 'button:has-text("비활성")'] },
      { name: '검색', selectors: ['button:has-text("검색")', 'input[type="search"]', '.search'] },
      { name: '엑셀 다운로드', selectors: ['button:has-text("엑셀")', 'button:has-text("다운로드")'] }
    ];

    results.userPage = await testButtonsOnPage(page, userButtons, '회원 관리');

    // 6. DB 테스트 기능 테스트
    console.log('\n6️⃣ DB 테스트 기능 세부 테스트...');
    await page.goto('http://localhost:3005/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    try {
      const dbTestButton = page.locator('button:has-text("DB 테스트"), .btn:has-text("DB")').first();
      const isVisible = await dbTestButton.isVisible();

      if (isVisible) {
        console.log('  🔧 DB 테스트 버튼 클릭...');
        await dbTestButton.click();
        await page.waitForTimeout(5000); // DB 테스트 완료 대기

        // 테스트 결과 확인
        const alerts = await page.locator('.alert, .toast, .success, .error, .notification').count();
        const pageContent = await page.textContent('body');

        results.dbTest = {
          buttonVisible: true,
          clicked: true,
          alertsShown: alerts,
          hasResults: pageContent.includes('테스트') || pageContent.includes('결과') || pageContent.includes('성공') || pageContent.includes('실패')
        };

        console.log(`  ✅ DB 테스트 실행됨 (알림 ${alerts}개, 결과 표시: ${results.dbTest.hasResults})`);
        await page.screenshot({ path: 'admin-db-test-result.png', fullPage: true });
      } else {
        results.dbTest = { buttonVisible: false, error: 'DB 테스트 버튼을 찾을 수 없음' };
      }
    } catch (error) {
      results.dbTest = { error: error.message };
      console.log(`  ❌ DB 테스트 오류: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }

  // 결과 요약 출력
  console.log('\n📊 세부 버튼 테스트 결과 요약:');
  console.log('==========================================');

  console.log('\n📋 예약 관리 페이지:');
  printPageResults(results.reservationPage);

  console.log('\n📝 콘텐츠 관리 페이지:');
  printPageResults(results.contentPage);

  console.log('\n🏢 시설 관리 페이지:');
  printPageResults(results.facilityPage);

  console.log('\n👥 회원 관리 페이지:');
  printPageResults(results.userPage);

  console.log('\n🔧 DB 테스트:');
  if (results.dbTest.error) {
    console.log(`  ❌ 오류: ${results.dbTest.error}`);
  } else {
    console.log(`  ${results.dbTest.buttonVisible ? '✅' : '❌'} 버튼 표시`);
    console.log(`  ${results.dbTest.clicked ? '✅' : '❌'} 클릭 실행`);
    console.log(`  ${results.dbTest.hasResults ? '✅' : '❌'} 결과 표시`);
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️ 오류 목록:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n🖼️ 스크린샷 저장됨:');
  console.log('  - admin-reservations-page.png');
  console.log('  - admin-content-page.png');
  console.log('  - admin-facilities-page.png');
  console.log('  - admin-users-page.png');
  console.log('  - admin-db-test-result.png');

  return results;
}

// 페이지별 버튼 테스트 함수
async function testButtonsOnPage(page, buttons, pageName) {
  const results = {};

  for (const button of buttons) {
    let found = false;
    let error = null;

    for (const selector of button.selectors) {
      try {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 3000 });

        if (isVisible) {
          const isEnabled = await element.isEnabled();
          results[button.name] = {
            found: true,
            visible: true,
            enabled: isEnabled,
            selector: selector
          };

          console.log(`  ${isEnabled ? '✅' : '⚠️'} ${button.name} (${selector})`);

          // 버튼 클릭 테스트 (모달이나 폼을 여는 버튼들)
          if (isEnabled && (button.name.includes('추가') || button.name.includes('수정'))) {
            try {
              await element.click();
              await page.waitForTimeout(1000);

              // 모달이나 폼이 열렸는지 확인
              const modal = await page.locator('.modal, [role="dialog"], .popup, .form').first();
              const modalVisible = await modal.isVisible();

              results[button.name].modalOpened = modalVisible;

              if (modalVisible) {
                console.log(`    ✅ ${button.name} 모달/폼 열림`);
                // 모달 닫기
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
              }
            } catch (clickError) {
              results[button.name].clickError = clickError.message;
            }
          }

          found = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!found) {
      results[button.name] = {
        found: false,
        visible: false,
        enabled: false,
        error: '버튼을 찾을 수 없음'
      };
      console.log(`  ❌ ${button.name} (찾을 수 없음)`);
    }
  }

  return results;
}

// 결과 출력 함수
function printPageResults(pageResults) {
  Object.entries(pageResults).forEach(([buttonName, result]) => {
    if (result.found && result.visible && result.enabled) {
      const modalStatus = result.modalOpened ? ' (모달 열림)' : '';
      console.log(`  ✅ ${buttonName}${modalStatus}`);
    } else if (result.found && result.visible && !result.enabled) {
      console.log(`  ⚠️ ${buttonName} (비활성화)`);
    } else {
      console.log(`  ❌ ${buttonName} (${result.error || '찾을 수 없음'})`);
    }
  });
}

// 스크립트 실행
testAdminPagesInDetail()
  .then(results => {
    console.log('\n🎉 세부 버튼 테스트 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });