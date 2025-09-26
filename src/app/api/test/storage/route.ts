import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling
} from '@/lib/api-response';

async function testStorageHandler(request: NextRequest) {
  try {
    // 1. Storage 버킷 목록 확인
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();

    console.log('Available buckets:', buckets);

    if (bucketsError) {
      console.error('Buckets error:', bucketsError);
    }

    // 2. facility-images 버킷 확인
    const facilityImagesBucket = buckets?.find(bucket => bucket.name === 'facility-images');

    // 3. 시설 데이터에서 이미지 정보 확인
    const { data: facilities, error: facilitiesError } = await supabaseAdmin
      .from('facilities')
      .select('id, name, images')
      .limit(5);

    console.log('Facilities with images:', facilities);

    // 4. 상세한 디버깅 정보
    facilities?.forEach((facility, index) => {
      console.log(`Facility ${index + 1}:`, {
        id: facility.id,
        name: facility.name,
        images: facility.images,
        imagesType: typeof facility.images,
        imagesLength: facility.images?.length || 0,
        firstImage: facility.images?.[0] || null
      });
    });

    if (facilitiesError) {
      console.error('Facilities error:', facilitiesError);
    }

    // 4. facility-images 버킷의 파일 목록 확인 (버킷이 있는 경우)
    let files = null;
    let filesError = null;

    if (facilityImagesBucket) {
      const { data: filesList, error: filesListError } = await supabaseAdmin.storage
        .from('facility-images')
        .list('', {
          limit: 10,
          offset: 0
        });

      files = filesList;
      filesError = filesListError;

      console.log('Files in facility-images bucket:', files);

      if (filesError) {
        console.error('Files list error:', filesError);
      }
    }

    return createSuccessResponse({
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })) || [],
      hasFacilityImagesBucket: !!facilityImagesBucket,
      facilityImagesBucketInfo: facilityImagesBucket || null,
      facilitiesCount: facilities?.length || 0,
      facilitiesWithImages: facilities?.filter(f => f.images && f.images.length > 0) || [],
      filesInBucket: files || [],
      errors: {
        bucketsError: bucketsError?.message || null,
        facilitiesError: facilitiesError?.message || null,
        filesError: filesError?.message || null
      }
    }, 'Storage 상태 확인 완료');

  } catch (error: any) {
    console.error('Storage test error:', error);
    return createErrorResponse(
      'Storage 테스트 중 오류가 발생했습니다.',
      'STORAGE_TEST_ERROR',
      500
    );
  }
}

export const GET = withErrorHandling(testStorageHandler);