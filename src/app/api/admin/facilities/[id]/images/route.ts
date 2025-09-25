import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { requireAdminAccess } from '@/lib/auth-helpers';

// 이미지 업로드 (POST)
async function uploadImageHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);

  const params = await context.params;
  const facilityId = params.id;

  // 시설 존재 여부 확인
  const { data: facility, error: fetchError } = await supabaseAdmin
    .from('facilities')
    .select('id, name, images')
    .eq('id', facilityId)
    .single();

  if (fetchError || !facility) {
    throw ApiErrors.NotFound(
      '시설을 찾을 수 없습니다.',
      'FACILITY_NOT_FOUND'
    );
  }

  // FormData에서 파일 추출
  const formData = await request.formData();
  const file = formData.get('image') as File;

  if (!file) {
    throw ApiErrors.BadRequest(
      '업로드할 이미지 파일이 없습니다.',
      'IMAGE_FILE_REQUIRED'
    );
  }

  // 파일 크기 제한 (5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw ApiErrors.BadRequest(
      '파일 크기는 5MB를 초과할 수 없습니다.',
      'FILE_SIZE_LIMIT_EXCEEDED'
    );
  }

  // 허용된 파일 타입 확인
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw ApiErrors.BadRequest(
      'JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.',
      'INVALID_FILE_TYPE'
    );
  }

  // 고유한 파일명 생성
  const fileExtension = file.name.split('.').pop();
  const timestamp = new Date().getTime();
  const fileName = `${facilityId}/${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

  try {
    // Supabase Storage에 파일 업로드
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('facility-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw ApiErrors.InternalServerError(
        '이미지 업로드 중 오류가 발생했습니다.',
        'STORAGE_UPLOAD_ERROR'
      );
    }

    // facilities 테이블의 images 배열에 파일 경로 추가
    const currentImages = facility.images || [];
    const updatedImages = [...currentImages, fileName];

    const { error: updateError } = await supabaseAdmin
      .from('facilities')
      .update({
        images: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', facilityId);

    if (updateError) {
      // 업로드된 파일 삭제
      await supabaseAdmin.storage
        .from('facility-images')
        .remove([fileName]);

      console.error('Database update error:', updateError);
      throw ApiErrors.InternalServerError(
        '이미지 정보 저장 중 오류가 발생했습니다.',
        'DATABASE_UPDATE_ERROR'
      );
    }

    // 이미지 URL 생성
    const { data: urlData } = supabaseAdmin.storage
      .from('facility-images')
      .getPublicUrl(fileName);

    return createSuccessResponse({
      fileName,
      url: urlData.publicUrl,
      imageCount: updatedImages.length
    }, '이미지가 성공적으로 업로드되었습니다.');

  } catch (error) {
    // 업로드된 파일이 있다면 정리
    try {
      await supabaseAdmin.storage
        .from('facility-images')
        .remove([fileName]);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    throw error;
  }
}

// 시설 이미지 목록 조회 (GET)
async function getImagesHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);

  const params = await context.params;
  const facilityId = params.id;

  // 시설 정보와 이미지 목록 조회
  const { data: facility, error } = await supabaseAdmin
    .from('facilities')
    .select('id, name, images')
    .eq('id', facilityId)
    .single();

  if (error || !facility) {
    throw ApiErrors.NotFound(
      '시설을 찾을 수 없습니다.',
      'FACILITY_NOT_FOUND'
    );
  }

  // 이미지 URL 생성
  const images = (facility.images || []).map((imagePath, index) => {
    const { data: urlData } = supabaseAdmin.storage
      .from('facility-images')
      .getPublicUrl(imagePath);

    return {
      index,
      path: imagePath,
      url: urlData.publicUrl,
      name: imagePath.split('/').pop()
    };
  });

  return createSuccessResponse({
    facilityId: facility.id,
    facilityName: facility.name,
    images,
    imageCount: images.length
  });
}

// 이미지 삭제 (DELETE)
async function deleteImageHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);

  const params = await context.params;
  const facilityId = params.id;
  const { searchParams } = new URL(request.url);
  const imageIndex = parseInt(searchParams.get('index') || '');

  if (isNaN(imageIndex) || imageIndex < 0) {
    throw ApiErrors.BadRequest(
      '유효한 이미지 인덱스를 제공해주세요.',
      'INVALID_IMAGE_INDEX'
    );
  }

  // 시설 정보 조회
  const { data: facility, error: fetchError } = await supabaseAdmin
    .from('facilities')
    .select('id, name, images')
    .eq('id', facilityId)
    .single();

  if (fetchError || !facility) {
    throw ApiErrors.NotFound(
      '시설을 찾을 수 없습니다.',
      'FACILITY_NOT_FOUND'
    );
  }

  const currentImages = facility.images || [];

  if (imageIndex >= currentImages.length) {
    throw ApiErrors.BadRequest(
      '존재하지 않는 이미지 인덱스입니다.',
      'IMAGE_INDEX_OUT_OF_RANGE'
    );
  }

  const imageToDelete = currentImages[imageIndex];
  const updatedImages = currentImages.filter((_, index) => index !== imageIndex);

  try {
    // Storage에서 파일 삭제
    const { error: storageError } = await supabaseAdmin.storage
      .from('facility-images')
      .remove([imageToDelete]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Storage 삭제 실패해도 DB는 업데이트 진행
    }

    // DB에서 이미지 경로 제거
    const { error: updateError } = await supabaseAdmin
      .from('facilities')
      .update({
        images: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', facilityId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw ApiErrors.InternalServerError(
        '이미지 정보 삭제 중 오류가 발생했습니다.',
        'DATABASE_UPDATE_ERROR'
      );
    }

    return createSuccessResponse({
      deletedImage: imageToDelete,
      remainingCount: updatedImages.length
    }, '이미지가 성공적으로 삭제되었습니다.');

  } catch (error) {
    throw error;
  }
}

// 이미지 순서 변경 (PUT)
async function reorderImagesHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);

  const params = await context.params;
  const facilityId = params.id;
  const body = await request.json();
  const { imageOrder } = body;

  if (!Array.isArray(imageOrder)) {
    throw ApiErrors.BadRequest(
      '이미지 순서는 배열 형태여야 합니다.',
      'INVALID_IMAGE_ORDER_FORMAT'
    );
  }

  // 시설 정보 조회
  const { data: facility, error: fetchError } = await supabaseAdmin
    .from('facilities')
    .select('id, name, images')
    .eq('id', facilityId)
    .single();

  if (fetchError || !facility) {
    throw ApiErrors.NotFound(
      '시설을 찾을 수 없습니다.',
      'FACILITY_NOT_FOUND'
    );
  }

  const currentImages = facility.images || [];

  // 순서 검증
  if (imageOrder.length !== currentImages.length) {
    throw ApiErrors.BadRequest(
      '이미지 순서 배열의 길이가 현재 이미지 수와 일치하지 않습니다.',
      'IMAGE_ORDER_LENGTH_MISMATCH'
    );
  }

  // 모든 인덱스가 유효한지 확인
  const validIndices = imageOrder.every((index: number) =>
    Number.isInteger(index) && index >= 0 && index < currentImages.length
  );

  if (!validIndices) {
    throw ApiErrors.BadRequest(
      '유효하지 않은 이미지 인덱스가 포함되어 있습니다.',
      'INVALID_IMAGE_INDICES'
    );
  }

  // 중복 인덱스 확인
  const uniqueIndices = new Set(imageOrder);
  if (uniqueIndices.size !== imageOrder.length) {
    throw ApiErrors.BadRequest(
      '중복된 이미지 인덱스가 있습니다.',
      'DUPLICATE_IMAGE_INDICES'
    );
  }

  // 새로운 순서로 이미지 배열 재구성
  const reorderedImages = imageOrder.map((index: number) => currentImages[index]);

  // DB 업데이트
  const { error: updateError } = await supabaseAdmin
    .from('facilities')
    .update({
      images: reorderedImages,
      updated_at: new Date().toISOString()
    })
    .eq('id', facilityId);

  if (updateError) {
    console.error('Database update error:', updateError);
    throw ApiErrors.InternalServerError(
      '이미지 순서 변경 중 오류가 발생했습니다.',
      'DATABASE_UPDATE_ERROR'
    );
  }

  return createSuccessResponse({
    reorderedImages,
    imageCount: reorderedImages.length
  }, '이미지 순서가 성공적으로 변경되었습니다.');
}

export const POST = withErrorHandling(uploadImageHandler);
export const GET = withErrorHandling(getImagesHandler);
export const DELETE = withErrorHandling(deleteImageHandler);
export const PUT = withErrorHandling(reorderImagesHandler);