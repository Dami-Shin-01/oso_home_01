/**
 * 은행 계좌 정보 관리 유틸리티 (데이터베이스 기반)
 * 데이터베이스에서 계좌 정보를 가져와 일관된 형태로 제공
 */

import { getPaymentInfo } from '@/lib/store-settings';

export interface BankAccountInfo {
  bank: string;
  accountNumber: string;
  accountHolder: string;
}

/**
 * 데이터베이스에서 계좌 정보를 가져옵니다
 * @returns Promise<BankAccountInfo | null>
 */
export async function getBankAccountInfo(): Promise<BankAccountInfo | null> {
  try {
    const paymentInfo = await getPaymentInfo();

    // 모든 필수 정보가 있는지 확인
    if (!paymentInfo.bankName || !paymentInfo.accountNumber || !paymentInfo.accountHolder) {
      console.warn('은행 계좌 정보가 데이터베이스에 설정되지 않았습니다.');
      return null;
    }

    return {
      bank: paymentInfo.bankName,
      accountNumber: paymentInfo.accountNumber,
      accountHolder: paymentInfo.accountHolder
    };
  } catch (error) {
    console.error('Error fetching bank account info:', error);
    return null;
  }
}

/**
 * 계좌 정보를 사용자에게 표시할 형태로 포맷팅합니다
 */
export async function formatBankAccountInfo(): Promise<string> {
  const accountInfo = await getBankAccountInfo();

  if (!accountInfo) {
    return '계좌 정보를 확인해주세요.';
  }

  return `${accountInfo.bank} ${accountInfo.accountNumber} (${accountInfo.accountHolder})`;
}

/**
 * 이메일 템플릿에서 사용할 계좌 정보를 반환합니다
 */
export async function getBankAccountForEmail(): Promise<BankAccountInfo> {
  const accountInfo = await getBankAccountInfo();

  // 데이터베이스에 없으면 기본값 사용
  return accountInfo || {
    bank: '계좌 정보',
    accountNumber: '확인 필요',
    accountHolder: '오소바베큐장'
  };
}

/**
 * API 응답에 포함할 계좌 정보를 생성합니다
 */
export async function getBankAccountForApi() {
  const accountInfo = await getBankAccountInfo();

  if (!accountInfo) {
    return {
      bank_account: '계좌 정보를 확인해주세요.',
      payment_instructions: '관리자에게 문의하여 입금 계좌를 확인해주세요.'
    };
  }

  const formattedAccount = await formatBankAccountInfo();
  return {
    bank_account: formattedAccount,
    payment_instructions: `위 계좌로 입금 후 예약이 확정됩니다. 입금자명은 예약자명과 동일하게 해주세요.`,
    bank_details: accountInfo
  };
}