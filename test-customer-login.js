const { chromium } = require('playwright');

async function testCustomerLoginFlow() {
  console.log('🚀 고객 로그인 플로우 테스트 시작...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인 페이지 접속
    console.log('📄 로그인 페이지 접속...');
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    // 페이지 내용 디버깅
    console.log('🔍 페이지 내용 확인...');
    const pageContent = await page.content();
    console.log('페이지 길이:', pageContent.length);

    // h1 태그가 있는지 확인
    const h1Elements = await page.$$('h1');
    console.log('H1 태그 개수:', h1Elements.length);

    // 만약 h1이 없다면 다른 헤더 태그들 찾기
    if (h1Elements.length === 0) {
      const allHeadings = await page.$$('h1, h2, h3, h4, h5, h6');
      console.log('모든 헤딩 태그 개수:', allHeadings.length);

      // 페이지에 있는 모든 텍스트 확인
      const bodyText = await page.textContent('body');
      console.log('페이지 텍스트 (처음 200자):', bodyText?.substring(0, 200));
    }

    // 2. 페이지 제목 확인 (더 안전한 방법)
    if (h1Elements.length > 0) {
      const title = await page.textContent('h1');
      console.log(`✅ 페이지 제목: ${title}`);
    } else {
      console.log('⚠️ H1 태그를 찾을 수 없습니다.');
    }

    // 3. 고객 탭이 기본 선택되어 있는지 확인
    const customerTab = page.locator('button:has-text("고객 로그인")');
    const isActive = await customerTab.getAttribute('class');
    console.log(`✅ 고객 탭 활성화 상태: ${isActive.includes('tab-active') ? '활성' : '비활성'}`);

    // 4. 관리자 탭으로 전환 테스트
    console.log('🔄 관리자 탭으로 전환...');
    await page.click('button:has-text("관리자 로그인")');
    await page.waitForTimeout(500);

    // 5. 플레이스홀더 변경 확인
    const emailPlaceholder = await page.locator('input[type="email"]').getAttribute('placeholder');
    console.log(`✅ 관리자 탭 이메일 플레이스홀더: ${emailPlaceholder}`);

    // 6. 다시 고객 탭으로 전환
    console.log('🔄 고객 탭으로 전환...');
    await page.click('button:has-text("고객 로그인")');
    await page.waitForTimeout(500);

    // 7. 고객 로그인 폼 요소 확인
    console.log('🔍 고객 로그인 폼 요소 확인...');

    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    const registerLink = page.locator('a[href="/register"]');
    const guestLink = page.locator('a[href="/guest-reservation"]');

    console.log(`✅ 이메일 필드 존재: ${await emailField.count() > 0}`);
    console.log(`✅ 비밀번호 필드 존재: ${await passwordField.count() > 0}`);
    console.log(`✅ 로그인 버튼 존재: ${await loginButton.count() > 0}`);
    console.log(`✅ 회원가입 링크 존재: ${await registerLink.count() > 0}`);
    console.log(`✅ 비회원 예약 조회 링크 존재: ${await guestLink.count() > 0}`);

    // 8. 폼 검증 테스트 (빈 값 제출)
    console.log('🧪 폼 검증 테스트 (빈 값)...');
    await loginButton.click();
    await page.waitForTimeout(500);

    const errorAlert = page.locator('.alert-error');
    if (await errorAlert.count() > 0) {
      const errorText = await errorAlert.textContent();
      console.log(`✅ 검증 오류 메시지: ${errorText}`);
    }

    // 9. 잘못된 이메일 형식 테스트
    console.log('🧪 잘못된 이메일 형식 테스트...');
    await emailField.fill('invalid-email');
    await passwordField.fill('123456');
    await loginButton.click();
    await page.waitForTimeout(500);

    if (await errorAlert.count() > 0) {
      const errorText = await errorAlert.textContent();
      console.log(`✅ 이메일 형식 오류: ${errorText}`);
    }

    // 10. 존재하지 않는 계정으로 로그인 시도
    console.log('🧪 존재하지 않는 계정 로그인 테스트...');
    await emailField.fill('nonexistent@test.com');
    await passwordField.fill('password123');
    await loginButton.click();
    await page.waitForTimeout(2000);

    if (await errorAlert.count() > 0) {
      const errorText = await errorAlert.textContent();
      console.log(`✅ 로그인 실패 메시지: ${errorText}`);
    }

    // 11. 회원가입 링크 클릭 테스트
    console.log('🔗 회원가입 링크 테스트...');
    await registerLink.click();
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    console.log(`✅ 회원가입 페이지 이동: ${currentUrl.includes('/register') ? '성공' : '실패'}`);

    // 12. 다시 로그인 페이지로 이동
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    // 13. 비회원 예약 조회 링크 테스트
    console.log('🔗 비회원 예약 조회 링크 테스트...');
    const guestLinkAfterReturn = page.locator('a[href="/guest-reservation"]');
    await guestLinkAfterReturn.click();
    await page.waitForTimeout(1000);

    const guestUrl = page.url();
    console.log(`✅ 비회원 예약 조회 페이지 이동: ${guestUrl.includes('/guest-reservation') ? '성공' : '실패'}`);

    // 14. URL 파라미터 테스트
    console.log('🔗 URL 파라미터 테스트...');
    await page.goto('http://localhost:3005/login?tab=admin');
    await page.waitForLoadState('networkidle');

    const adminTabAfterUrl = page.locator('button:has-text("관리자 로그인")');
    const adminTabClass = await adminTabAfterUrl.getAttribute('class');
    console.log(`✅ URL 파라미터로 관리자 탭 활성화: ${adminTabClass.includes('tab-active') ? '성공' : '실패'}`);

    console.log('✅ 고객 로그인 플로우 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    await browser.close();
  }
}

testCustomerLoginFlow();