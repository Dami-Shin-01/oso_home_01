/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

async function detailedTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3004';
  const detailedIssues = [];

  console.log('🔍 상세 분석 시작...\n');

  try {
    // 1. 메인 페이지 상세 분석
    console.log('📄 메인 페이지 상세 분석...');
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    // 모든 링크 요소 찾기
    const allLinks = await page.locator('a').all();
    console.log(`   🔗 총 링크 개수: ${allLinks.length}개`);

    for (let i = 0; i < allLinks.length; i++) {
      const link = allLinks[i];
      try {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        const isVisible = await link.isVisible();

        console.log(`   ${i+1}. "${text?.trim()}" -> "${href}" (표시됨: ${isVisible})`);

        if (href === null) {
          detailedIssues.push(`❌ 링크 "${text?.trim()}"에 href 속성이 없음`);
        }

        if (href === '#' || href === '') {
          detailedIssues.push(`❌ 링크 "${text?.trim()}"이 구현되지 않음 (href: "${href}")`);
        }
      } catch (error) {
        detailedIssues.push(`❌ 링크 ${i+1} 분석 중 오류: ${error.message}`);
      }
    }

    // 2. 버튼 요소 분석
    console.log('\n🔘 버튼 요소 분석...');
    const allButtons = await page.locator('button, .btn').all();
    console.log(`   🔘 총 버튼 개수: ${allButtons.length}개`);

    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      try {
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        const onClick = await button.getAttribute('onclick');

        console.log(`   ${i+1}. "${text?.trim()}" (표시됨: ${isVisible}, 활성화: ${isEnabled})`);

        if (onClick === null && !isVisible) {
          detailedIssues.push(`❌ 버튼 "${text?.trim()}"에 클릭 이벤트가 없음`);
        }
      } catch (error) {
        detailedIssues.push(`❌ 버튼 ${i+1} 분석 중 오류: ${error.message}`);
      }
    }

    // 3. 폼 요소 분석
    console.log('\n📝 폼 요소 분석...');
    const forms = await page.locator('form').all();
    console.log(`   📝 총 폼 개수: ${forms.length}개`);

    if (forms.length === 0) {
      detailedIssues.push('❌ 메인 페이지에 폼이 없음 (검색, 예약 등)');
    }

    // 4. 예약 페이지 상세 분석
    console.log('\n📅 예약 페이지 상세 분석...');
    await page.goto(`${baseUrl}/reservation`);
    await page.waitForLoadState('networkidle');

    // 페이지 내용 확인
    const pageContent = await page.textContent('body');
    console.log(`   📄 페이지 내용 길이: ${pageContent?.length || 0}자`);

    if (pageContent?.includes('404') || pageContent?.includes('Not Found')) {
      detailedIssues.push('❌ 예약 페이지가 존재하지 않음 (404)');
    } else if ((pageContent?.length || 0) < 100) {
      detailedIssues.push('❌ 예약 페이지 내용이 거의 없음 (미구현)');
    }

    // 입력 필드 확인
    const inputs = await page.locator('input').all();
    const selects = await page.locator('select').all();
    const textareas = await page.locator('textarea').all();

    console.log(`   📝 입력 필드: ${inputs.length}개, 선택 박스: ${selects.length}개, 텍스트 영역: ${textareas.length}개`);

    if (inputs.length + selects.length + textareas.length === 0) {
      detailedIssues.push('❌ 예약 페이지에 입력 요소가 없음');
    }

    // 5. API 엔드포인트 테스트
    console.log('\n🌐 API 엔드포인트 테스트...');
    const apiEndpoints = [
      '/api/public/facilities',
      '/api/public/notices',
      '/api/public/faqs'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await page.request.get(`${baseUrl}${endpoint}`);
        const status = response.status();
        console.log(`   ${endpoint}: ${status}`);

        if (status !== 200) {
          detailedIssues.push(`❌ API ${endpoint} 응답 오류: ${status}`);
        }
      } catch (error) {
        detailedIssues.push(`❌ API ${endpoint} 요청 실패: ${error.message}`);
      }
    }

    // 6. 콘솔 에러 및 네트워크 에러 확인
    console.log('\n🚨 콘솔 및 네트워크 에러 확인...');
    const consoleErrors = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // 페이지 새로고침으로 에러 수집
    await page.reload();
    await page.waitForLoadState('networkidle');

    if (consoleErrors.length > 0) {
      detailedIssues.push(`❌ 콘솔 에러 ${consoleErrors.length}개: ${consoleErrors.slice(0, 3).join(', ')}`);
    }

    if (networkErrors.length > 0) {
      detailedIssues.push(`❌ 네트워크 에러 ${networkErrors.length}개: ${networkErrors.slice(0, 3).join(', ')}`);
    }

    // 7. 성능 분석
    console.log('\n⚡ 성능 분석...');
    const performanceEntries = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'));
    });

    const navigation = JSON.parse(performanceEntries)[0];
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.navigationStart;
      console.log(`   ⏱️ 페이지 로드 시간: ${loadTime}ms`);

      if (loadTime > 3000) {
        detailedIssues.push(`❌ 페이지 로드 시간이 너무 느림: ${loadTime}ms (목표: 3초 이하)`);
      }
    }

  } catch (error) {
    detailedIssues.push(`❌ 상세 분석 중 예외 발생: ${error.message}`);
  }

  // 결과 출력
  console.log('\n📋 상세 분석 결과:');
  console.log('===============================');

  if (detailedIssues.length === 0) {
    console.log('✅ 상세 분석에서 추가 문제점을 발견하지 못했습니다.');
  } else {
    console.log(`❌ ${detailedIssues.length}개의 상세 문제점을 발견했습니다:\n`);
    detailedIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }

  await browser.close();
  return detailedIssues;
}

// 상세 테스트 실행
detailedTest().catch(console.error);