/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

async function testAdminPages() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3004';
  const adminIssues = [];

  console.log('🔐 관리자 페이지 상세 테스트 시작...\n');

  try {
    // 1. 관리자 로그인
    console.log('📝 관리자 로그인 시도...');
    await page.goto(`${baseUrl}/login`);
    await page.waitForLoadState('networkidle');

    // 로그인 폼 찾기 및 입력
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('admin@osobbq.com');
      await passwordInput.fill('admin123');

      console.log('   📧 로그인 정보 입력 완료');
      await loginButton.click();
      await page.waitForTimeout(2000); // 로그인 처리 대기

      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        console.log('   ✅ 관리자 로그인 성공');
      } else {
        adminIssues.push('❌ 관리자 로그인 실패 - 대시보드로 리다이렉트되지 않음');
        await browser.close();
        return adminIssues;
      }
    } else {
      adminIssues.push('❌ 로그인 폼 요소를 찾을 수 없음');
      await browser.close();
      return adminIssues;
    }

    // 2. 관리자 대시보드 기본 기능 테스트
    console.log('\n🏠 관리자 대시보드 테스트...');
    await page.goto(`${baseUrl}/admin`);
    await page.waitForLoadState('networkidle');

    // 대시보드 카드 확인
    const statsCards = await page.locator('.stats .stat').count();
    console.log(`   📊 통계 카드 개수: ${statsCards}개`);
    if (statsCards === 0) {
      adminIssues.push('❌ 대시보드 통계 카드가 로드되지 않음');
    }

    // 3. 시설 관리 페이지 테스트
    console.log('\n🏢 시설 관리 페이지 테스트...');
    await page.goto(`${baseUrl}/admin/facilities`);
    await page.waitForLoadState('networkidle');

    // 시설 목록 확인
    const facilityCards = await page.locator('[data-testid="facility-card"], .card').count();
    console.log(`   🏢 시설 카드 개수: ${facilityCards}개`);

    // 시설 추가 버튼 테스트
    const addFacilityButton = page.locator('text="시설 추가"').first();
    if (await addFacilityButton.isVisible()) {
      console.log('   🔍 시설 추가 버튼 클릭 테스트...');
      await addFacilityButton.click();
      await page.waitForTimeout(1000);

      // 모달 확인
      const modal = page.locator('.modal.modal-open');
      if (await modal.isVisible()) {
        console.log('   ✅ 시설 추가 모달 정상 열림');

        // 모달 닫기 테스트
        const closeButton = page.locator('.modal .btn').filter({ hasText: '취소' }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);
          console.log('   ✅ 모달 닫기 정상 작동');
        }
      } else {
        adminIssues.push('❌ 시설 추가 모달이 열리지 않음');
      }
    } else {
      adminIssues.push('❌ 시설 추가 버튼을 찾을 수 없음');
    }

    // 4. 시설 수정 기능 테스트
    console.log('\n✏️ 시설 수정 기능 테스트...');
    const editButtons = page.locator('text="수정"');
    const editButtonCount = await editButtons.count();
    console.log(`   ✏️ 수정 버튼 개수: ${editButtonCount}개`);

    if (editButtonCount > 0) {
      console.log('   🔍 첫 번째 시설 수정 버튼 클릭 테스트...');

      // 콘솔 에러 감지
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // 네트워크 에러 감지
      const networkErrors = [];
      page.on('requestfailed', request => {
        networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      });

      try {
        await editButtons.first().click();
        await page.waitForTimeout(2000);

        // 수정 모달 확인
        const editModal = page.locator('.modal.modal-open');
        if (await editModal.isVisible()) {
          console.log('   ✅ 시설 수정 모달 정상 열림');

          // 폼 필드 확인
          const nameInput = editModal.locator('input[name="name"], input[placeholder*="시설명"]');
          const descriptionInput = editModal.locator('textarea[name="description"], textarea[placeholder*="설명"]');

          if (await nameInput.isVisible() && await descriptionInput.isVisible()) {
            console.log('   ✅ 수정 폼 필드 정상 로드됨');

            // 기존 데이터 로드 확인
            const nameValue = await nameInput.inputValue();
            const descValue = await descriptionInput.inputValue();

            if (nameValue && descValue) {
              console.log(`   ✅ 기존 데이터 로드 확인 - 시설명: "${nameValue.slice(0, 20)}..."`);
            } else {
              adminIssues.push('❌ 수정 모달에 기존 데이터가 로드되지 않음');
            }
          } else {
            adminIssues.push('❌ 수정 모달 폼 필드를 찾을 수 없음');
          }

          // 모달 닫기
          const editCloseButton = page.locator('.modal .btn').filter({ hasText: '취소' }).first();
          if (await editCloseButton.isVisible()) {
            await editCloseButton.click();
            await page.waitForTimeout(500);
          }
        } else {
          adminIssues.push('❌ 시설 수정 모달이 열리지 않음');
        }

        // 콘솔 에러 체크
        if (consoleErrors.length > 0) {
          adminIssues.push(`❌ 시설 수정 시 콘솔 에러 발생: ${consoleErrors.slice(0, 2).join(', ')}`);
        }

        // 네트워크 에러 체크
        if (networkErrors.length > 0) {
          adminIssues.push(`❌ 시설 수정 시 네트워크 에러 발생: ${networkErrors.slice(0, 2).join(', ')}`);
        }

      } catch (error) {
        adminIssues.push(`❌ 시설 수정 버튼 클릭 중 예외 발생: ${error.message}`);
      }
    }

    // 5. 콘텐츠 관리 페이지 테스트
    console.log('\n📝 콘텐츠 관리 페이지 테스트...');
    await page.goto(`${baseUrl}/admin/content`);
    await page.waitForLoadState('networkidle');

    // 공지사항 탭 테스트
    const noticesTab = page.locator('text="공지사항"').first();
    if (await noticesTab.isVisible()) {
      await noticesTab.click();
      await page.waitForTimeout(1000);

      const noticeItems = await page.locator('.card, [data-testid="notice-item"]').count();
      console.log(`   📢 공지사항 개수: ${noticeItems}개`);

      // 공지사항 수정 버튼 테스트
      const noticeEditButtons = page.locator('text="수정"');
      const noticeEditCount = await noticeEditButtons.count();

      if (noticeEditCount > 0) {
        console.log('   🔍 공지사항 수정 버튼 테스트...');

        try {
          await noticeEditButtons.first().click();
          await page.waitForTimeout(1500);

          const noticeEditModal = page.locator('.modal.modal-open');
          if (await noticeEditModal.isVisible()) {
            console.log('   ✅ 공지사항 수정 모달 정상 열림');
          } else {
            adminIssues.push('❌ 공지사항 수정 모달이 열리지 않음');
          }

          // 모달 닫기
          const noticeCloseBtn = page.locator('.modal .btn').filter({ hasText: '취소' }).first();
          if (await noticeCloseBtn.isVisible()) {
            await noticeCloseBtn.click();
            await page.waitForTimeout(500);
          }
        } catch (error) {
          adminIssues.push(`❌ 공지사항 수정 중 오류: ${error.message}`);
        }
      }
    }

    // 6. FAQ 탭 테스트
    const faqTab = page.locator('text="FAQ"').first();
    if (await faqTab.isVisible()) {
      console.log('   🔍 FAQ 탭 테스트...');
      await faqTab.click();
      await page.waitForTimeout(1000);

      const faqItems = await page.locator('.card, [data-testid="faq-item"]').count();
      console.log(`   ❓ FAQ 개수: ${faqItems}개`);

      // FAQ 수정 테스트
      const faqEditButtons = page.locator('text="수정"');
      const faqEditCount = await faqEditButtons.count();

      if (faqEditCount > 0) {
        try {
          console.log('   🔍 FAQ 수정 버튼 테스트...');
          await faqEditButtons.first().click();
          await page.waitForTimeout(1500);

          const faqEditModal = page.locator('.modal.modal-open');
          if (await faqEditModal.isVisible()) {
            console.log('   ✅ FAQ 수정 모달 정상 열림');
          } else {
            adminIssues.push('❌ FAQ 수정 모달이 열리지 않음');
          }

          // 모달 닫기
          const faqCloseBtn = page.locator('.modal .btn').filter({ hasText: '취소' }).first();
          if (await faqCloseBtn.isVisible()) {
            await faqCloseBtn.click();
            await page.waitForTimeout(500);
          }
        } catch (error) {
          adminIssues.push(`❌ FAQ 수정 중 오류: ${error.message}`);
        }
      }
    }

    // 7. API 응답 테스트
    console.log('\n🌐 관리자 API 응답 테스트...');
    const adminApiEndpoints = [
      '/api/admin/dashboard/stats',
      '/api/admin/facilities',
      '/api/admin/notices',
      '/api/admin/faqs'
    ];

    // 인증 토큰 추출 (localStorage에서)
    const token = await page.evaluate(() => {
      return localStorage.getItem('accessToken');
    });

    if (token) {
      console.log('   🔑 인증 토큰 확인됨');

      for (const endpoint of adminApiEndpoints) {
        try {
          const response = await page.request.get(`${baseUrl}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const status = response.status();
          console.log(`   ${endpoint}: ${status}`);

          if (status !== 200) {
            adminIssues.push(`❌ 관리자 API ${endpoint} 응답 오류: ${status}`);
          }
        } catch (error) {
          adminIssues.push(`❌ 관리자 API ${endpoint} 요청 실패: ${error.message}`);
        }
      }
    } else {
      adminIssues.push('❌ 관리자 인증 토큰을 찾을 수 없음');
    }

  } catch (error) {
    adminIssues.push(`❌ 관리자 페이지 테스트 중 예외 발생: ${error.message}`);
  }

  // 결과 출력
  console.log('\n📋 관리자 페이지 테스트 결과:');
  console.log('===============================');

  if (adminIssues.length === 0) {
    console.log('✅ 관리자 페이지 모든 기능이 정상 작동합니다!');
  } else {
    console.log(`❌ ${adminIssues.length}개의 관리자 페이지 문제점을 발견했습니다:\n`);
    adminIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }

  await browser.close();
  return adminIssues;
}

// 관리자 테스트 실행
testAdminPages().catch(console.error);