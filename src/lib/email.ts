/**
 * 이메일 알림 시스템
 * Resend를 사용한 예약 관련 이메일 발송
 */

import { Resend } from 'resend';
import { getBankAccountForEmail, BankAccountInfo } from '@/lib/bank-account';
import { getStoreBasicInfo, getStorePolicies } from '@/lib/store-config';
import { getPolicyForEmail } from '@/lib/policies';

// Resend 클라이언트 초기화
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// 이메일 템플릿 타입 정의
export interface EmailTemplateData {
  customerName: string;
  facilityName: string;
  reservationDate: string;
  reservationTime: string;
  totalAmount: number;
  reservationId: string;
  // accountInfo는 자동으로 환경 변수에서 가져오므로 옵셔널 제거
}

/**
 * 예약 확인 이메일 발송
 */
export async function sendReservationConfirmationEmail(
  to: string,
  data: EmailTemplateData
) {
  try {
    if (!resend) {
      console.warn('Resend API key not configured. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const storeInfo = getStoreBasicInfo();
    const { data: result, error } = await resend.emails.send({
      from: `${storeInfo.name} <${storeInfo.noreplyEmail}>`,
      to: [to],
      subject: `[${storeInfo.name}] 예약 확인 - ${data.facilityName}`,
      html: getReservationConfirmationTemplate(data),
    });

    if (error) {
      console.error('예약 확인 이메일 발송 실패:', error);
      return { success: false, error };
    }

    console.log('예약 확인 이메일 발송 성공:', result?.id);
    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('이메일 발송 중 오류:', error);
    return { success: false, error };
  }
}

/**
 * 예약 확정 이메일 발송 (입금 확인 후)
 */
export async function sendReservationConfirmedEmail(
  to: string,
  data: EmailTemplateData
) {
  try {
    if (!resend) {
      console.warn('Resend API key not configured. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const storeInfo = getStoreBasicInfo();
    const { data: result, error } = await resend.emails.send({
      from: `${storeInfo.name} <${storeInfo.noreplyEmail}>`,
      to: [to],
      subject: `[${storeInfo.name}] 예약 확정 안내 - ${data.facilityName}`,
      html: getReservationConfirmedTemplate(data),
    });

    if (error) {
      console.error('예약 확정 이메일 발송 실패:', error);
      return { success: false, error };
    }

    console.log('예약 확정 이메일 발송 성공:', result?.id);
    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('이메일 발송 중 오류:', error);
    return { success: false, error };
  }
}

/**
 * 예약 리마인더 이메일 발송 (D-1)
 */
export async function sendReservationReminderEmail(
  to: string,
  data: EmailTemplateData
) {
  try {
    if (!resend) {
      console.warn('Resend API key not configured. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const storeInfo = getStoreBasicInfo();
    const { data: result, error } = await resend.emails.send({
      from: `${storeInfo.name} <${storeInfo.noreplyEmail}>`,
      to: [to],
      subject: `[${storeInfo.name}] 내일 예약 안내 - ${data.facilityName}`,
      html: getReservationReminderTemplate(data),
    });

    if (error) {
      console.error('예약 리마인더 이메일 발송 실패:', error);
      return { success: false, error };
    }

    console.log('예약 리마인더 이메일 발송 성공:', result?.id);
    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('이메일 발송 중 오류:', error);
    return { success: false, error };
  }
}

/**
 * 예약 취소 이메일 발송
 */
export async function sendReservationCancelledEmail(
  to: string,
  data: EmailTemplateData
) {
  try {
    if (!resend) {
      console.warn('Resend API key not configured. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const storeInfo = getStoreBasicInfo();
    const { data: result, error } = await resend.emails.send({
      from: `${storeInfo.name} <${storeInfo.noreplyEmail}>`,
      to: [to],
      subject: `[${storeInfo.name}] 예약 취소 확인 - ${data.facilityName}`,
      html: getReservationCancelledTemplate(data),
    });

    if (error) {
      console.error('예약 취소 이메일 발송 실패:', error);
      return { success: false, error };
    }

    console.log('예약 취소 이메일 발송 성공:', result?.id);
    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error('이메일 발송 중 오류:', error);
    return { success: false, error };
  }
}

// 이메일 템플릿들
function getReservationConfirmationTemplate(data: EmailTemplateData): string {
  // 환경 변수에서 매장 정보 및 계좌 정보 가져오기
  const storeInfo = getStoreBasicInfo();
  const accountInfo = getBankAccountForEmail();
  const policyInfo = getPolicyForEmail();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>예약 확인</title>
    </head>
    <body style="font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🍖 ${storeInfo.name}</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">예약이 접수되었습니다</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
          <h2 style="color: #495057; margin-top: 0;">안녕하세요, ${data.customerName}님</h2>
          <p>${storeInfo.name} 예약이 성공적으로 접수되었습니다.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">📋 예약 정보</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>시설:</strong> ${data.facilityName}</li>
              <li style="margin-bottom: 10px;"><strong>날짜:</strong> ${data.reservationDate}</li>
              <li style="margin-bottom: 10px;"><strong>시간:</strong> ${data.reservationTime}</li>
              <li style="margin-bottom: 10px;"><strong>결제 금액:</strong> ${data.totalAmount.toLocaleString()}원</li>
              <li style="margin-bottom: 10px;"><strong>예약 번호:</strong> ${data.reservationId}</li>
            </ul>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">💳 입금 안내</h3>
            <p>예약 확정을 위해 아래 계좌로 입금해 주세요:</p>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 8px;"><strong>은행:</strong> ${accountInfo.bank}</li>
              <li style="margin-bottom: 8px;"><strong>계좌번호:</strong> ${accountInfo.accountNumber}</li>
              <li style="margin-bottom: 8px;"><strong>예금주:</strong> ${accountInfo.accountHolder}</li>
              <li style="margin-bottom: 8px;"><strong>입금 금액:</strong> ${data.totalAmount.toLocaleString()}원</li>
            </ul>
            <p style="color: #856404; font-size: 14px; margin-bottom: 0;">
              ⚠️ 입금 확인 후 예약이 최종 확정됩니다.
            </p>
          </div>

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3 style="margin-top: 0; color: #0c5460;">📞 문의사항</h3>
            <p>예약과 관련하여 문의사항이 있으시면 언제든 연락주세요.</p>
            <p style="margin-bottom: 0;">
              📧 이메일: ${storeInfo.email}<br>
              📞 전화: ${storeInfo.phone}
            </p>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">⚠️ 중요 안내</h3>
            <p style="margin-bottom: 0; font-size: 14px;">
              • ${policyInfo.cancellationNotice}<br>
              ${policyInfo.importantNotices.map(notice => `• ${notice}`).join('<br>')}
            </p>
          </div>
        </div>

        <div style="background: #6c757d; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px;">
          <p style="margin: 0;">🍖 ${storeInfo.name}에서 특별한 시간을 보내세요!</p>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">이 이메일은 자동으로 발송된 메시지입니다.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getReservationConfirmedTemplate(data: EmailTemplateData): string {
  const storeInfo = getStoreBasicInfo();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>예약 확정</title>
    </head>
    <body style="font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 예약 확정!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">입금이 확인되었습니다</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
          <h2 style="color: #495057; margin-top: 0;">축하합니다, ${data.customerName}님!</h2>
          <p>입금이 확인되어 예약이 최종 확정되었습니다. 🎊</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #28a745;">✅ 확정된 예약 정보</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>시설:</strong> ${data.facilityName}</li>
              <li style="margin-bottom: 10px;"><strong>날짜:</strong> ${data.reservationDate}</li>
              <li style="margin-bottom: 10px;"><strong>시간:</strong> ${data.reservationTime}</li>
              <li style="margin-bottom: 10px;"><strong>결제 금액:</strong> ${data.totalAmount.toLocaleString()}원</li>
              <li style="margin-bottom: 10px;"><strong>예약 번호:</strong> ${data.reservationId}</li>
            </ul>
          </div>

          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #155724;">🔥 방문 안내</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>예약 시간 10분 전까지 도착해 주세요</li>
              <li>예약 번호를 말씀해 주시면 빠른 안내가 가능합니다</li>
              <li>추가 요청사항은 현장에서 직원에게 말씀해 주세요</li>
              <li>즐거운 바베큐 시간 되세요! 🍖</li>
            </ul>
          </div>

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3 style="margin-top: 0; color: #0c5460;">📞 연락처</h3>
            <p style="margin-bottom: 0;">
              📧 이메일: ${storeInfo.email}<br>
              📞 전화: ${storeInfo.phone}
            </p>
          </div>
        </div>

        <div style="background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px;">
          <p style="margin: 0;">🍖 맛있는 바베큐와 함께 특별한 시간을 보내세요!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getReservationReminderTemplate(data: EmailTemplateData): string {
  const storeInfo = getStoreBasicInfo();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>예약 리마인더</title>
    </head>
    <body style="font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">⏰ 내일 예약!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">예약 리마인더</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
          <h2 style="color: #495057; margin-top: 0;">안녕하세요, ${data.customerName}님!</h2>
          <p>내일 ${storeInfo.name} 예약이 있습니다. 🍖</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">📅 내일의 예약 정보</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>시설:</strong> ${data.facilityName}</li>
              <li style="margin-bottom: 10px;"><strong>날짜:</strong> ${data.reservationDate}</li>
              <li style="margin-bottom: 10px;"><strong>시간:</strong> ${data.reservationTime}</li>
              <li style="margin-bottom: 10px;"><strong>예약 번호:</strong> ${data.reservationId}</li>
            </ul>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">🎯 방문 체크리스트</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>예약 시간 10분 전 도착</li>
              <li>예약 번호 준비: ${data.reservationId}</li>
              <li>즐거운 마음 준비! 😊</li>
            </ul>
          </div>

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3 style="margin-top: 0; color: #0c5460;">📞 문의사항</h3>
            <p style="margin-bottom: 0;">
              📧 이메일: ${storeInfo.email}<br>
              📞 전화: ${storeInfo.phone}
            </p>
          </div>
        </div>

        <div style="background: #fd7e14; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px;">
          <p style="margin: 0;">🍖 ${storeInfo.name}에서 내일 뵙겠습니다!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getReservationCancelledTemplate(data: EmailTemplateData): string {
  const storeInfo = getStoreBasicInfo();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>예약 취소</title>
    </head>
    <body style="font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">❌ 예약 취소</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">취소가 확인되었습니다</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
          <h2 style="color: #495057; margin-top: 0;">안녕하세요, ${data.customerName}님</h2>
          <p>예약 취소가 정상적으로 처리되었습니다.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <h3 style="margin-top: 0; color: #6c757d;">📋 취소된 예약 정보</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>시설:</strong> ${data.facilityName}</li>
              <li style="margin-bottom: 10px;"><strong>날짜:</strong> ${data.reservationDate}</li>
              <li style="margin-bottom: 10px;"><strong>시간:</strong> ${data.reservationTime}</li>
              <li style="margin-bottom: 10px;"><strong>예약 번호:</strong> ${data.reservationId}</li>
            </ul>
          </div>

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3 style="margin-top: 0; color: #0c5460;">💬 다음에 또 만나요!</h3>
            <p>아쉽지만 다음에 더 좋은 조건으로 만나뵙기를 바랍니다.</p>
            <p style="margin-bottom: 0;">
              📧 이메일: ${storeInfo.email}<br>
              📞 전화: ${storeInfo.phone}
            </p>
          </div>
        </div>

        <div style="background: #6c757d; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px;">
          <p style="margin: 0;">🍖 ${storeInfo.name}에 언제든 다시 찾아주세요!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}