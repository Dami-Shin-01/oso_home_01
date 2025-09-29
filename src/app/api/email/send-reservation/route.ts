/**
 * 예약 관련 이메일 발송 API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendReservationConfirmationEmail,
  sendReservationConfirmedEmail,
  sendReservationReminderEmail,
  sendReservationCancelledEmail,
  EmailTemplateData
} from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data }: {
      type: 'confirmation' | 'confirmed' | 'reminder' | 'cancelled';
      to: string;
      data: EmailTemplateData;
    } = body;

    // 필수 필드 검증
    if (!type || !to || !data) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이메일 유효성 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: '유효하지 않은 이메일 주소입니다.' },
        { status: 400 }
      );
    }

    let result;

    // 이메일 타입에 따라 적절한 함수 호출
    switch (type) {
      case 'confirmation':
        result = await sendReservationConfirmationEmail(to, data);
        break;
      case 'confirmed':
        result = await sendReservationConfirmedEmail(to, data);
        break;
      case 'reminder':
        result = await sendReservationReminderEmail(to, data);
        break;
      case 'cancelled':
        result = await sendReservationCancelledEmail(to, data);
        break;
      default:
        return NextResponse.json(
          { error: '지원하지 않는 이메일 타입입니다.' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: '이메일이 성공적으로 발송되었습니다.'
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: '이메일 발송에 실패했습니다.'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('이메일 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}