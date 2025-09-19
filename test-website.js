const { chromium } = require('playwright');

async function testWebsite() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const issues = [];
  const baseUrl = 'http://localhost:3004';

  console.log('🚀 웹사이트 전체 테스트 시작...\n');

  try {
    // 1. 메인 페이지 테스트
    console.log('📄 메인 페이지 테스트...');
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    // 메인 페이지 요소 확인
    const heroSection = await page.locator('.hero').isVisible();
    if (!heroSection) {
      issues.push('❌ 메인 페이지: 히어로 섹션이 로드되지 않음');
    }

    // 시설 데이터 로딩 확인
    const facilitiesCards = await page.locator('.card').count();
    console.log(`   📊 시설 카드 개수: ${facilitiesCards}개`);
    if (facilitiesCards === 0) {
      issues.push('❌ 메인 페이지: 시설 데이터가 로드되지 않음');
    }

    // 2. 네비게이션 링크 테스트
    console.log('🔗 네비게이션 링크 테스트...');
    const navLinks = [
      { text: '시설 둘러보기', url: '/facilities' },
      { text: '지금 예약하기', url: '/reservation' },
      { text: '모든 시설 보기', url: '/facilities' }
    ];

    for (const link of navLinks) {
      try {
        const linkElement = page.locator(`text="${link.text}"`).first();
        if (await linkElement.isVisible()) {
          await linkElement.click();
          await page.waitForLoadState('networkidle');
          const currentUrl = page.url();
          if (currentUrl.includes(link.url)) {
            console.log(`   ✅ "${link.text}" 링크 정상 작동`);
          } else {
            issues.push(`❌ "${link.text}" 링크가 잘못된 페이지로 이동: ${currentUrl}`);
          }
          await page.goBack();
          await page.waitForLoadState('networkidle');
        } else {
          issues.push(`❌ "${link.text}" 링크를 찾을 수 없음`);
        }
      } catch (error) {
        issues.push(`❌ "${link.text}" 링크 클릭 오류: ${error.message}`);
      }
    }

    // 3. 시설 페이지 테스트
    console.log('🏢 시설 페이지 테스트...');
    await page.goto(`${baseUrl}/facilities`);
    await page.waitForLoadState('networkidle');

    const facilityCards = await page.locator('.bg-white.rounded-lg.shadow-md').count();
    console.log(`   📊 시설 페이지 카드 개수: ${facilityCards}개`);

    if (facilityCards === 0) {
      issues.push('❌ 시설 페이지: 시설 데이터가 표시되지 않음');
    }

    // 예약하기 버튼 테스트
    const reservationButtons = await page.locator('text="예약하기"').count();
    if (reservationButtons > 0) {
      try {
        await page.locator('text="예약하기"').first().click();
        await page.waitForLoadState('networkidle');
        if (page.url().includes('/reservation')) {
          console.log('   ✅ 예약하기 버튼 정상 작동');
        } else {
          issues.push('❌ 예약하기 버튼이 예약 페이지로 이동하지 않음');
        }
      } catch (error) {
        issues.push(`❌ 예약하기 버튼 클릭 오류: ${error.message}`);
      }
    }

    // 4. 예약 페이지 테스트
    console.log('📅 예약 페이지 테스트...');
    await page.goto(`${baseUrl}/reservation`);
    await page.waitForLoadState('networkidle');

    // 예약 폼 확인
    const reservationForm = await page.locator('form').isVisible();
    if (!reservationForm) {
      issues.push('❌ 예약 페이지: 예약 폼이 표시되지 않음');
    }

    // 5. 관리자 페이지 접근 테스트
    console.log('🔐 관리자 페이지 접근 테스트...');
    await page.goto(`${baseUrl}/admin`);
    await page.waitForLoadState('networkidle');

    // 로그인 폼 또는 대시보드 확인
    const hasLoginForm = await page.locator('input[type="email"]').isVisible();
    const hasDashboard = await page.locator('text="관리자 대시보드"').isVisible();

    if (!hasLoginForm && !hasDashboard) {
      issues.push('❌ 관리자 페이지: 로그인 폼이나 대시보드가 표시되지 않음');
    }

    // 6. 404 페이지 테스트
    console.log('🚫 404 페이지 테스트...');
    await page.goto(`${baseUrl}/nonexistent-page`);
    await page.waitForLoadState('networkidle');

    const has404 = await page.locator('text="404"').isVisible() ||
                   await page.locator('text="Page Not Found"').isVisible() ||
                   await page.locator('text="찾을 수 없습니다"').isVisible();

    if (!has404) {
      issues.push('❌ 404 페이지가 제대로 구현되지 않음');
    }

    // 7. 반응형 디자인 테스트
    console.log('📱 반응형 디자인 테스트...');
    await page.goto(baseUrl);

    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    const mobileNav = await page.locator('.navbar').isVisible();
    if (!mobileNav) {
      issues.push('❌ 모바일: 네비게이션이 표시되지 않음');
    }

    // 8. JavaScript 에러 확인
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    if (jsErrors.length > 0) {
      issues.push(`❌ JavaScript 에러 발견: ${jsErrors.join(', ')}`);
    }

  } catch (error) {
    issues.push(`❌ 전체 테스트 중 예외 발생: ${error.message}`);
  }

  // 결과 출력
  console.log('\n🔍 테스트 결과 요약:');
  console.log('===============================');

  if (issues.length === 0) {
    console.log('✅ 모든 테스트 통과! 웹사이트가 정상적으로 작동합니다.');
  } else {
    console.log(`❌ ${issues.length}개의 문제점을 발견했습니다:\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }

  await browser.close();
  return issues;
}

// 테스트 실행
testWebsite().catch(console.error);