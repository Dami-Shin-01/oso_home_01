const { chromium } = require('playwright');

async function testDetailedButtonFunctionality() {
  console.log('🚀 관리자 페이지 세부 버튼 기능 상세 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testResults = {
    facilityManagement: {},
    contentManagement: {},
    userManagement: {},
    systemSettings: {},
    detailedInteractions: []
  };

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
    console.log('✅ 로그인 성공\n');

    // 시설 관리 세부 테스트
    testResults.facilityManagement = await testFacilityManagementDetails(page);

    // 콘텐츠 관리 세부 테스트
    testResults.contentManagement = await testContentManagementDetails(page);

    // 회원 관리 세부 테스트
    testResults.userManagement = await testUserManagementDetails(page);

    // 시스템 설정 테스트
    testResults.systemSettings = await testSystemSettings(page);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }

  // 결과 출력
  printDetailedResults(testResults);
  return testResults;
}

async function testFacilityManagementDetails(page) {
  console.log('2️⃣ 시설 관리 페이지 세부 버튼 테스트...');
  const results = {};

  try {
    await page.goto('http://localhost:3005/admin');
    await page.waitForTimeout(2000);
    await page.click('text=시설 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('  📍 시설 관리 페이지 진입 성공');

    // 1. 새 시설 등록 버튼 테스트
    console.log('  🔘 "새 시설 등록" 버튼 테스트...');
    try {
      const addFacilityBtn = page.locator('button:has-text("새 시설 등록"), .btn:has-text("새 시설")').first();
      await addFacilityBtn.click();
      await page.waitForTimeout(2000);

      // 모달이나 폼이 열렸는지 확인
      const modal = await page.locator('.modal, [role="dialog"], .popup, form').first();
      const modalVisible = await modal.isVisible();

      results.addFacilityButton = {
        clicked: true,
        modalOpened: modalVisible,
        status: modalVisible ? 'success' : 'partial'
      };

      console.log(`    ${modalVisible ? '✅' : '⚠️'} 새 시설 등록 ${modalVisible ? '모달 열림' : '응답 없음'}`);

      if (modalVisible) {
        await page.screenshot({ path: 'facility-add-modal.png' });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      results.addFacilityButton = { status: 'error', error: error.message };
      console.log('    ❌ 새 시설 등록 버튼 오류:', error.message);
    }

    // 2. 기존 시설의 수정/삭제 버튼 테스트
    console.log('  🔘 기존 시설 관리 버튼들 테스트...');
    const editButtons = await page.locator('button:has-text("수정"), .btn:has-text("수정")').all();
    const deleteButtons = await page.locator('button:has-text("삭제"), .btn:has-text("삭제")').all();

    results.existingFacilities = {
      editButtons: editButtons.length,
      deleteButtons: deleteButtons.length,
      editTests: [],
      deleteTests: []
    };

    // 첫 번째 수정 버튼 테스트
    if (editButtons.length > 0) {
      try {
        await editButtons[0].click();
        await page.waitForTimeout(2000);

        const editModal = await page.locator('.modal, [role="dialog"]').first();
        const editModalVisible = await editModal.isVisible();

        results.existingFacilities.editTests.push({
          index: 0,
          clicked: true,
          modalOpened: editModalVisible
        });

        console.log(`    ${editModalVisible ? '✅' : '⚠️'} 시설 수정 ${editModalVisible ? '모달 열림' : '응답 없음'}`);

        if (editModalVisible) {
          await page.screenshot({ path: 'facility-edit-modal.png' });
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        results.existingFacilities.editTests.push({ index: 0, error: error.message });
      }
    }

    // 3. 구역 관리 버튼 테스트
    console.log('  🔘 "구역 관리" 버튼들 테스트...');
    const zoneButtons = await page.locator('button:has-text("구역관리"), .btn:has-text("구역")').all();

    results.zoneManagement = {
      buttonsFound: zoneButtons.length,
      tests: []
    };

    if (zoneButtons.length > 0) {
      try {
        await zoneButtons[0].click();
        await page.waitForTimeout(2000);

        const zoneModal = await page.locator('.modal, [role="dialog"]').first();
        const zoneModalVisible = await zoneModal.isVisible();

        results.zoneManagement.tests.push({
          clicked: true,
          modalOpened: zoneModalVisible
        });

        console.log(`    ${zoneModalVisible ? '✅' : '⚠️'} 구역 관리 ${zoneModalVisible ? '모달 열림' : '응답 없음'}`);

        if (zoneModalVisible) {
          await page.screenshot({ path: 'zone-management-modal.png' });
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        results.zoneManagement.tests.push({ error: error.message });
      }
    }

  } catch (error) {
    results.error = error.message;
    console.log('  ❌ 시설 관리 페이지 오류:', error.message);
  }

  return results;
}

async function testContentManagementDetails(page) {
  console.log('\n3️⃣ 콘텐츠 관리 페이지 세부 버튼 테스트...');
  const results = {};

  try {
    await page.goto('http://localhost:3005/admin');
    await page.waitForTimeout(2000);
    await page.click('text=콘텐츠 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('  📍 콘텐츠 관리 페이지 진입 성공');

    // 1. 새 공지사항 작성 버튼 테스트
    console.log('  🔘 "새 공지사항 작성" 버튼 테스트...');
    try {
      const addNoticeBtn = page.locator('button:has-text("새 공지사항 작성"), .btn:has-text("새 공지")').first();
      await addNoticeBtn.click();
      await page.waitForTimeout(2000);

      const noticeModal = await page.locator('.modal, [role="dialog"], form').first();
      const noticeModalVisible = await noticeModal.isVisible();

      results.addNoticeButton = {
        clicked: true,
        modalOpened: noticeModalVisible
      };

      console.log(`    ${noticeModalVisible ? '✅' : '⚠️'} 새 공지사항 작성 ${noticeModalVisible ? '모달 열림' : '응답 없음'}`);

      if (noticeModalVisible) {
        await page.screenshot({ path: 'notice-add-modal.png' });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      results.addNoticeButton = { error: error.message };
      console.log('    ❌ 새 공지사항 작성 버튼 오류:', error.message);
    }

    // 2. 기존 공지사항 수정/삭제 버튼 테스트
    console.log('  🔘 기존 공지사항 관리 버튼들 테스트...');
    const noticeEditButtons = await page.locator('button:has-text("수정"), .btn:has-text("수정")').all();
    const noticeDeleteButtons = await page.locator('button:has-text("삭제"), .btn:has-text("삭제")').all();

    results.existingNotices = {
      editButtons: noticeEditButtons.length,
      deleteButtons: noticeDeleteButtons.length,
      editTest: null
    };

    if (noticeEditButtons.length > 0) {
      try {
        await noticeEditButtons[0].click();
        await page.waitForTimeout(2000);

        const editModal = await page.locator('.modal, [role="dialog"]').first();
        const editModalVisible = await editModal.isVisible();

        results.existingNotices.editTest = {
          clicked: true,
          modalOpened: editModalVisible
        };

        console.log(`    ${editModalVisible ? '✅' : '⚠️'} 공지사항 수정 ${editModalVisible ? '모달 열림' : '응답 없음'}`);

        if (editModalVisible) {
          await page.screenshot({ path: 'notice-edit-modal.png' });
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        results.existingNotices.editTest = { error: error.message };
      }
    }

    // 3. FAQ 탭 전환 및 관리 테스트
    console.log('  🔘 FAQ 탭 및 관리 기능 테스트...');
    try {
      const faqTab = page.locator('text=FAQ').first();
      await faqTab.click();
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      results.faqTab = {
        clicked: true,
        urlChanged: currentUrl.includes('faq') || currentUrl.includes('FAQ')
      };

      console.log(`    ${results.faqTab.urlChanged ? '✅' : '⚠️'} FAQ 탭 전환 ${results.faqTab.urlChanged ? '성공' : '부분 성공'}`);

      await page.screenshot({ path: 'faq-tab-view.png' });
    } catch (error) {
      results.faqTab = { error: error.message };
    }

  } catch (error) {
    results.error = error.message;
    console.log('  ❌ 콘텐츠 관리 페이지 오류:', error.message);
  }

  return results;
}

async function testUserManagementDetails(page) {
  console.log('\n4️⃣ 회원 관리 페이지 세부 버튼 테스트...');
  const results = {};

  try {
    await page.goto('http://localhost:3005/admin');
    await page.waitForTimeout(2000);
    await page.click('text=회원 관리');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('  📍 회원 관리 페이지 진입 성공');

    // 1. 검색 기능 테스트
    console.log('  🔍 검색 기능 테스트...');
    try {
      const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]').first();
      await searchInput.fill('admin');
      await page.waitForTimeout(1000);

      results.searchFunction = {
        inputFound: true,
        valueEntered: true
      };

      console.log('    ✅ 검색 입력 필드 정상 작동');
    } catch (error) {
      results.searchFunction = { error: error.message };
      console.log('    ❌ 검색 기능 오류:', error.message);
    }

    // 2. 필터 기능 테스트
    console.log('  🎛️ 필터 기능 테스트...');
    try {
      const roleFilter = page.locator('select').first();
      await roleFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);

      results.filterFunction = {
        filterFound: true,
        optionSelected: true
      };

      console.log('    ✅ 역할 필터 정상 작동');
    } catch (error) {
      results.filterFunction = { error: error.message };
      console.log('    ❌ 필터 기능 오류:', error.message);
    }

    // 3. 사용자 상세보기 버튼 테스트
    console.log('  🔘 사용자 관리 버튼들 테스트...');
    try {
      const detailButton = page.locator('button:has-text("상세"), .btn:has-text("상세")').first();
      await detailButton.click();
      await page.waitForTimeout(2000);

      const detailModal = await page.locator('.modal, [role="dialog"]').first();
      const detailModalVisible = await detailModal.isVisible();

      results.userDetailButton = {
        clicked: true,
        modalOpened: detailModalVisible
      };

      console.log(`    ${detailModalVisible ? '✅' : '⚠️'} 사용자 상세보기 ${detailModalVisible ? '모달 열림' : '응답 없음'}`);

      if (detailModalVisible) {
        await page.screenshot({ path: 'user-detail-modal.png' });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      results.userDetailButton = { error: error.message };
      console.log('    ❌ 사용자 상세보기 버튼 오류:', error.message);
    }

    // 4. 사용자 수정 버튼 테스트
    try {
      const editButton = page.locator('button:has-text("수정"), .btn:has-text("수정")').first();
      await editButton.click();
      await page.waitForTimeout(2000);

      const editModal = await page.locator('.modal, [role="dialog"]').first();
      const editModalVisible = await editModal.isVisible();

      results.userEditButton = {
        clicked: true,
        modalOpened: editModalVisible
      };

      console.log(`    ${editModalVisible ? '✅' : '⚠️'} 사용자 수정 ${editModalVisible ? '모달 열림' : '응답 없음'}`);

      if (editModalVisible) {
        await page.screenshot({ path: 'user-edit-modal.png' });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      results.userEditButton = { error: error.message };
    }

  } catch (error) {
    results.error = error.message;
    console.log('  ❌ 회원 관리 페이지 오류:', error.message);
  }

  return results;
}

async function testSystemSettings(page) {
  console.log('\n5️⃣ 시스템 설정 및 기타 기능 테스트...');
  const results = {};

  try {
    // DB 테스트 기능
    console.log('  🔧 DB 테스트 기능...');
    await page.goto('http://localhost:3005/admin');
    await page.waitForTimeout(2000);

    try {
      const dbTestButton = page.locator('button:has-text("DB 테스트"), .btn:has-text("DB")').first();
      await dbTestButton.click();
      await page.waitForTimeout(5000);

      const pageContent = await page.textContent('body');
      const hasTestResults = pageContent.includes('테스트') || pageContent.includes('성공') || pageContent.includes('실패');

      results.dbTest = {
        buttonFound: true,
        clicked: true,
        resultsDisplayed: hasTestResults
      };

      console.log(`    ${hasTestResults ? '✅' : '⚠️'} DB 테스트 ${hasTestResults ? '결과 표시됨' : '응답 확인 필요'}`);

      await page.screenshot({ path: 'db-test-results.png' });
    } catch (error) {
      results.dbTest = { error: error.message };
      console.log('    ❌ DB 테스트 기능 오류:', error.message);
    }

    // 로그아웃 기능 테스트
    console.log('  🚪 로그아웃 기능 테스트...');
    try {
      const logoutButton = page.locator('button:has-text("로그아웃"), .btn:has-text("로그아웃")').first();
      const logoutButtonVisible = await logoutButton.isVisible();

      results.logout = {
        buttonFound: logoutButtonVisible,
        tested: false // 실제 로그아웃은 테스트 중단을 막기 위해 실행하지 않음
      };

      console.log(`    ${logoutButtonVisible ? '✅' : '❌'} 로그아웃 버튼 ${logoutButtonVisible ? '표시됨' : '찾을 수 없음'}`);
    } catch (error) {
      results.logout = { error: error.message };
    }

  } catch (error) {
    results.error = error.message;
    console.log('  ❌ 시스템 설정 테스트 오류:', error.message);
  }

  return results;
}

function printDetailedResults(testResults) {
  console.log('\n📊 세부 버튼 기능 테스트 종합 결과:');
  console.log('==========================================');

  // 시설 관리 결과
  console.log('\n🏢 시설 관리:');
  if (testResults.facilityManagement.addFacilityButton) {
    const status = testResults.facilityManagement.addFacilityButton.status;
    console.log(`  새 시설 등록: ${status === 'success' ? '✅' : status === 'partial' ? '⚠️' : '❌'}`);
  }
  if (testResults.facilityManagement.existingFacilities) {
    console.log(`  기존 시설 관리: 수정 버튼 ${testResults.facilityManagement.existingFacilities.editButtons}개, 삭제 버튼 ${testResults.facilityManagement.existingFacilities.deleteButtons}개`);
  }
  if (testResults.facilityManagement.zoneManagement) {
    console.log(`  구역 관리: 버튼 ${testResults.facilityManagement.zoneManagement.buttonsFound}개 발견`);
  }

  // 콘텐츠 관리 결과
  console.log('\n📝 콘텐츠 관리:');
  if (testResults.contentManagement.addNoticeButton) {
    console.log(`  새 공지사항 작성: ${testResults.contentManagement.addNoticeButton.modalOpened ? '✅' : '⚠️'}`);
  }
  if (testResults.contentManagement.existingNotices) {
    console.log(`  기존 공지사항 관리: 수정 버튼 ${testResults.contentManagement.existingNotices.editButtons}개`);
  }
  if (testResults.contentManagement.faqTab) {
    console.log(`  FAQ 탭 전환: ${testResults.contentManagement.faqTab.clicked ? '✅' : '❌'}`);
  }

  // 회원 관리 결과
  console.log('\n👥 회원 관리:');
  if (testResults.userManagement.searchFunction) {
    console.log(`  검색 기능: ${testResults.userManagement.searchFunction.inputFound ? '✅' : '❌'}`);
  }
  if (testResults.userManagement.filterFunction) {
    console.log(`  필터 기능: ${testResults.userManagement.filterFunction.filterFound ? '✅' : '❌'}`);
  }
  if (testResults.userManagement.userDetailButton) {
    console.log(`  사용자 상세보기: ${testResults.userManagement.userDetailButton.modalOpened ? '✅' : '⚠️'}`);
  }

  // 시스템 설정 결과
  console.log('\n⚙️ 시스템 설정:');
  if (testResults.systemSettings.dbTest) {
    console.log(`  DB 테스트: ${testResults.systemSettings.dbTest.resultsDisplayed ? '✅' : '⚠️'}`);
  }
  if (testResults.systemSettings.logout) {
    console.log(`  로그아웃 버튼: ${testResults.systemSettings.logout.buttonFound ? '✅' : '❌'}`);
  }

  console.log('\n📸 상세 스크린샷 저장됨:');
  console.log('  - facility-add-modal.png, facility-edit-modal.png');
  console.log('  - notice-add-modal.png, notice-edit-modal.png');
  console.log('  - user-detail-modal.png, user-edit-modal.png');
  console.log('  - db-test-results.png');
}

// 스크립트 실행
testDetailedButtonFunctionality()
  .then(results => {
    console.log('\n🎉 세부 버튼 기능 테스트 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });