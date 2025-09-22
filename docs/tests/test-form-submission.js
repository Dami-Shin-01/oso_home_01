const { chromium } = require('playwright');

async function testFormSubmissionFunctionality() {
  console.log('🧪 실제 폼 제출 기능 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testResults = {
    facilityCreation: {},
    noticeCreation: {},
    facilityEdit: {},
    noticeEdit: {}
  };

  try {
    // 로그인
    console.log('1️⃣ 로그인...');
    await page.goto('http://localhost:3005/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="example@email.com"]', 'admin@osobbq.com');
    await page.fill('input[placeholder="비밀번호를 입력하세요"]', 'Admin123!@#');
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);

    // 1. 시설 등록 테스트
    testResults.facilityCreation = await testFacilityCreation(page);

    // 2. 공지사항 등록 테스트
    testResults.noticeCreation = await testNoticeCreation(page);

    // 3. 시설 수정 테스트
    testResults.facilityEdit = await testFacilityEdit(page);

    // 4. 공지사항 수정 테스트
    testResults.noticeEdit = await testNoticeEdit(page);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }

  // 결과 요약
  printSubmissionTestResults(testResults);
  return testResults;
}

async function testFacilityCreation(page) {
  console.log('\n2️⃣ 시설 등록 실제 기능 테스트...');
  const result = { success: false, error: null, steps: [] };

  try {
    await page.goto('http://localhost:3005/admin/facilities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 기존 시설 개수 확인
    const beforeCount = await getFacilityCount(page);
    result.steps.push(`등록 전 시설 개수: ${beforeCount}`);
    console.log(`  📊 등록 전 시설 개수: ${beforeCount}`);

    // 새 시설 등록 버튼 클릭
    await page.click('text="새 시설 등록"');
    await page.waitForTimeout(1000);

    // 폼 필드 채우기
    const testFacilityName = `테스트시설_${Date.now()}`;
    await page.fill('input[placeholder*="시설명"], input[name="name"]', testFacilityName);
    await page.fill('textarea', '테스트용 시설입니다.');
    await page.selectOption('select', '야외');
    await page.fill('input[type="number"]:first', '6'); // 수용인원
    await page.fill('input[placeholder*="평일"], input[name*="weekday"]', '50000');
    await page.fill('input[placeholder*="주말"], input[name*="weekend"]', '60000');

    result.steps.push('폼 필드 입력 완료');
    console.log('  📝 폼 필드 입력 완료');

    await page.screenshot({ path: 'facility-form-filled.png' });

    // 저장 버튼 클릭
    await page.click('button:has-text("저장"), button:has-text("등록")');
    await page.waitForTimeout(3000);

    // 성공 알림 또는 모달 닫힘 확인
    const modalStillVisible = await page.locator('.fixed.inset-0.bg-black').isVisible();

    if (!modalStillVisible) {
      result.steps.push('모달 닫힘 확인됨');
      console.log('  ✅ 모달이 닫혔습니다');

      // 페이지 새로고침 후 개수 확인
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const afterCount = await getFacilityCount(page);
      result.steps.push(`등록 후 시설 개수: ${afterCount}`);
      console.log(`  📊 등록 후 시설 개수: ${afterCount}`);

      if (afterCount > beforeCount) {
        result.success = true;
        result.steps.push('✅ 시설 등록 성공');
        console.log('  ✅ 시설 등록 성공');
      } else {
        result.error = '시설 개수가 증가하지 않음';
        console.log('  ❌ 시설 개수가 증가하지 않음');
      }
    } else {
      result.error = '모달이 닫히지 않음 - 저장 실패 가능성';
      console.log('  ❌ 모달이 닫히지 않음 - 저장 실패 가능성');
    }

  } catch (error) {
    result.error = error.message;
    console.log(`  ❌ 시설 등록 오류: ${error.message}`);
  }

  return result;
}

async function testNoticeCreation(page) {
  console.log('\n3️⃣ 공지사항 등록 실제 기능 테스트...');
  const result = { success: false, error: null, steps: [] };

  try {
    await page.goto('http://localhost:3005/admin/content');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 기존 공지사항 개수 확인
    const beforeCount = await getNoticeCount(page);
    result.steps.push(`등록 전 공지사항 개수: ${beforeCount}`);
    console.log(`  📊 등록 전 공지사항 개수: ${beforeCount}`);

    // 새 공지사항 작성 버튼 클릭
    await page.click('text="새 공지사항 작성"');
    await page.waitForTimeout(1000);

    // 폼 필드 채우기
    const testNoticeTitle = `테스트공지_${Date.now()}`;
    await page.fill('input[placeholder*="제목"], input[name="title"]', testNoticeTitle);
    await page.fill('textarea', '테스트용 공지사항 내용입니다.');

    result.steps.push('폼 필드 입력 완료');
    console.log('  📝 폼 필드 입력 완료');

    await page.screenshot({ path: 'notice-form-filled.png' });

    // 저장 버튼 클릭
    await page.click('button:has-text("저장"), button:has-text("작성")');
    await page.waitForTimeout(3000);

    // 성공 알림 또는 모달 닫힘 확인
    const modalStillVisible = await page.locator('.fixed.inset-0.bg-black').isVisible();

    if (!modalStillVisible) {
      result.steps.push('모달 닫힘 확인됨');
      console.log('  ✅ 모달이 닫혔습니다');

      // 페이지 새로고침 후 개수 확인
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const afterCount = await getNoticeCount(page);
      result.steps.push(`등록 후 공지사항 개수: ${afterCount}`);
      console.log(`  📊 등록 후 공지사항 개수: ${afterCount}`);

      if (afterCount > beforeCount) {
        result.success = true;
        result.steps.push('✅ 공지사항 등록 성공');
        console.log('  ✅ 공지사항 등록 성공');
      } else {
        result.error = '공지사항 개수가 증가하지 않음';
        console.log('  ❌ 공지사항 개수가 증가하지 않음');
      }
    } else {
      result.error = '모달이 닫히지 않음 - 저장 실패 가능성';
      console.log('  ❌ 모달이 닫히지 않음 - 저장 실패 가능성');
    }

  } catch (error) {
    result.error = error.message;
    console.log(`  ❌ 공지사항 등록 오류: ${error.message}`);
  }

  return result;
}

async function testFacilityEdit(page) {
  console.log('\n4️⃣ 시설 수정 실제 기능 테스트...');
  const result = { success: false, error: null, steps: [] };

  try {
    await page.goto('http://localhost:3005/admin/facilities');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 첫 번째 시설의 수정 버튼 클릭
    const editButtons = await page.locator('button:has-text("수정")').all();
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(1000);

      // 기존 값 확인
      const originalName = await page.inputValue('input[name="name"], input[placeholder*="시설명"]');
      result.steps.push(`수정 전 시설명: ${originalName}`);

      // 값 수정
      const newName = `${originalName}_수정됨_${Date.now()}`;
      await page.fill('input[name="name"], input[placeholder*="시설명"]', newName);

      result.steps.push(`새 시설명: ${newName}`);
      console.log(`  📝 시설명 수정: ${originalName} → ${newName}`);

      // 저장 버튼 클릭
      await page.click('button:has-text("저장"), button:has-text("수정")');
      await page.waitForTimeout(3000);

      // 모달 닫힘 확인
      const modalStillVisible = await page.locator('.fixed.inset-0.bg-black').isVisible();

      if (!modalStillVisible) {
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 수정된 내용 확인
        const pageContent = await page.textContent('body');
        if (pageContent.includes(newName)) {
          result.success = true;
          result.steps.push('✅ 시설 수정 성공');
          console.log('  ✅ 시설 수정 성공');
        } else {
          result.error = '수정된 내용이 반영되지 않음';
          console.log('  ❌ 수정된 내용이 반영되지 않음');
        }
      } else {
        result.error = '모달이 닫히지 않음 - 수정 실패 가능성';
        console.log('  ❌ 모달이 닫히지 않음');
      }
    } else {
      result.error = '수정할 시설이 없음';
      console.log('  ❌ 수정할 시설이 없음');
    }

  } catch (error) {
    result.error = error.message;
    console.log(`  ❌ 시설 수정 오류: ${error.message}`);
  }

  return result;
}

async function testNoticeEdit(page) {
  console.log('\n5️⃣ 공지사항 수정 실제 기능 테스트...');
  const result = { success: false, error: null, steps: [] };

  try {
    await page.goto('http://localhost:3005/admin/content');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 첫 번째 공지사항의 수정 버튼 클릭
    const editButtons = await page.locator('button:has-text("수정")').all();
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(1000);

      // 기존 값 확인
      const originalTitle = await page.inputValue('input[name="title"], input[placeholder*="제목"]');
      result.steps.push(`수정 전 제목: ${originalTitle}`);

      // 값 수정
      const newTitle = `${originalTitle}_수정됨_${Date.now()}`;
      await page.fill('input[name="title"], input[placeholder*="제목"]', newTitle);

      result.steps.push(`새 제목: ${newTitle}`);
      console.log(`  📝 제목 수정: ${originalTitle} → ${newTitle}`);

      // 저장 버튼 클릭
      await page.click('button:has-text("저장"), button:has-text("수정")');
      await page.waitForTimeout(3000);

      // 모달 닫힘 확인
      const modalStillVisible = await page.locator('.fixed.inset-0.bg-black').isVisible();

      if (!modalStillVisible) {
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 수정된 내용 확인
        const pageContent = await page.textContent('body');
        if (pageContent.includes(newTitle)) {
          result.success = true;
          result.steps.push('✅ 공지사항 수정 성공');
          console.log('  ✅ 공지사항 수정 성공');
        } else {
          result.error = '수정된 내용이 반영되지 않음';
          console.log('  ❌ 수정된 내용이 반영되지 않음');
        }
      } else {
        result.error = '모달이 닫히지 않음 - 수정 실패 가능성';
        console.log('  ❌ 모달이 닫히지 않음');
      }
    } else {
      result.error = '수정할 공지사항이 없음';
      console.log('  ❌ 수정할 공지사항이 없음');
    }

  } catch (error) {
    result.error = error.message;
    console.log(`  ❌ 공지사항 수정 오류: ${error.message}`);
  }

  return result;
}

// 헬퍼 함수들
async function getFacilityCount(page) {
  try {
    const facilityCards = await page.locator('.border.rounded-lg.p-4').count();
    return facilityCards;
  } catch {
    return 0;
  }
}

async function getNoticeCount(page) {
  try {
    const noticeCards = await page.locator('.border.rounded-lg.p-4').count();
    return noticeCards;
  } catch {
    return 0;
  }
}

function printSubmissionTestResults(testResults) {
  console.log('\n📊 실제 폼 제출 기능 테스트 결과:');
  console.log('==========================================');

  console.log('\n🏢 시설 등록:');
  console.log(`  상태: ${testResults.facilityCreation.success ? '✅ 성공' : '❌ 실패'}`);
  if (testResults.facilityCreation.error) {
    console.log(`  오류: ${testResults.facilityCreation.error}`);
  }
  testResults.facilityCreation.steps?.forEach(step => console.log(`  - ${step}`));

  console.log('\n📝 공지사항 등록:');
  console.log(`  상태: ${testResults.noticeCreation.success ? '✅ 성공' : '❌ 실패'}`);
  if (testResults.noticeCreation.error) {
    console.log(`  오류: ${testResults.noticeCreation.error}`);
  }
  testResults.noticeCreation.steps?.forEach(step => console.log(`  - ${step}`));

  console.log('\n🔧 시설 수정:');
  console.log(`  상태: ${testResults.facilityEdit.success ? '✅ 성공' : '❌ 실패'}`);
  if (testResults.facilityEdit.error) {
    console.log(`  오류: ${testResults.facilityEdit.error}`);
  }
  testResults.facilityEdit.steps?.forEach(step => console.log(`  - ${step}`));

  console.log('\n📄 공지사항 수정:');
  console.log(`  상태: ${testResults.noticeEdit.success ? '✅ 성공' : '❌ 실패'}`);
  if (testResults.noticeEdit.error) {
    console.log(`  오류: ${testResults.noticeEdit.error}`);
  }
  testResults.noticeEdit.steps?.forEach(step => console.log(`  - ${step}`));

  console.log('\n📸 스크린샷 저장됨:');
  console.log('  - facility-form-filled.png');
  console.log('  - notice-form-filled.png');
}

// 스크립트 실행
testFormSubmissionFunctionality()
  .then(results => {
    console.log('\n🎉 실제 폼 제출 기능 테스트 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });