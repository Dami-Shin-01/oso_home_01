/**
 * 은행 계좌 정보 관리 유틸리티
 * 환경 변수에서 계좌 정보를 가져와 일관된 형태로 제공
 */

export interface BankAccountInfo {
  bank: string;
  accountNumber: string;
  accountHolder: string;
}

/**
 * 환경 변수에서 계좌 정보를 가져옵니다
 * @returns BankAccountInfo 객체 또는 null (환경 변수가 설정되지 않은 경우)
 */
export function getBankAccountInfo(): BankAccountInfo | null {
  const bank = process.env.BANK_NAME;
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER;
  const accountHolder = process.env.BANK_ACCOUNT_HOLDER;

  // 모든 필수 정보가 있는지 확인
  if (!bank || !accountNumber || !accountHolder) {
    console.warn('은행 계좌 정보가 환경 변수에 설정되지 않았습니다.');
    return null;
  }

  return {
    bank,
    accountNumber,
    accountHolder
  };
}

/**
 * 계좌 정보를 사용자에게 표시할 형태로 포맷팅합니다
 */
export function formatBankAccountInfo(): string {
  const accountInfo = getBankAccountInfo();

  if (!accountInfo) {
    return '계좌 정보를 확인해주세요.';
  }

  return `${accountInfo.bank} ${accountInfo.accountNumber} (${accountInfo.accountHolder})`;
}

/**
 * 이메일 템플릿에서 사용할 계좌 정보를 반환합니다
 */
export function getBankAccountForEmail(): BankAccountInfo {
  const accountInfo = getBankAccountInfo();

  // 환경 변수가 없으면 기본값 사용
  return accountInfo || {
    bank: '계좌 정보',
    accountNumber: '확인 필요',
    accountHolder: '오소바베큐장'
  };
}

/**
 * API 응답에 포함할 계좌 정보를 생성합니다
 */
export function getBankAccountForApi() {
  const accountInfo = getBankAccountInfo();

  if (!accountInfo) {
    return {
      bank_account: '계좌 정보를 확인해주세요.',
      payment_instructions: '관리자에게 문의하여 입금 계좌를 확인해주세요.'
    };
  }

  return {
    bank_account: formatBankAccountInfo(),
    payment_instructions: `위 계좌로 입금 후 예약이 확정됩니다. 입금자명은 예약자명과 동일하게 해주세요.`,
    bank_details: accountInfo
  };
}