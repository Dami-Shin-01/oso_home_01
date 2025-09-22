const { chromium } = require('playwright');

async function checkAdminStructure() {
  console.log('🔍 관리자 페이지 구조 분석 중...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 로그인
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="example@email.com"]', 'admin@osobbq.com');
    await page.fill('input[placeholder="비밀번호를 입력하세요"]', 'Admin123!@#');
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);

    // 관리자 페이지로 이동
    await page.goto('http://localhost:3005/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    console.log('📍 현재 URL:', page.url());

    // 페이지 내 모든 링크 찾기
    const links = await page.locator('a').all();
    console.log('\n🔗 페이지 내 링크 목록:');
    for (let i = 0; i < Math.min(links.length, 20); i++) {
      try {
        const href = await links[i].getAttribute('href');
        const text = await links[i].textContent();
        if (href && text) {
          console.log(`  - ${text.trim()}: ${href}`);
        }
      } catch (e) {}
    }

    // 버튼 찾기
    const buttons = await page.locator('button').all();
    console.log('\n🔘 페이지 내 버튼 목록:');
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      try {
        const text = await buttons[i].textContent();
        const className = await buttons[i].getAttribute('class');
        if (text) {
          console.log(`  - ${text.trim()} (class: ${className})`);
        }
      } catch (e) {}
    }

    // 네비게이션 메뉴 찾기
    const navElements = await page.locator('nav, .navbar, .navigation, .menu, .sidebar').all();
    console.log('\n📋 네비게이션 요소:');
    for (let i = 0; i < navElements.length; i++) {
      try {
        const text = await navElements[i].textContent();
        const className = await navElements[i].getAttribute('class');
        console.log(`  Nav ${i + 1}: ${className}`);
        console.log(`    내용: ${text?.substring(0, 200)}...`);
      } catch (e) {}
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'admin-structure-analysis.png', fullPage: true });
    console.log('\n📸 스크린샷 저장됨: admin-structure-analysis.png');

    // 페이지 HTML 일부 출력
    const bodyContent = await page.textContent('body');
    console.log('\n📄 페이지 내용 (첫 500자):');
    console.log(bodyContent?.substring(0, 500));

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

checkAdminStructure();