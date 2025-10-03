'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  validateVideoFileSize,
  validateVideoFileType,
  generateVideoUploadPath,
  getHeroVideoUrl
} from '@/lib/video-utils';

/**
 * 관리자 영상 업로드 섹션
 * - Hero 영상 업로드 및 교체
 * - 진행 상태 표시
 * - 미리보기 기능
 */
export default function VideoUploadSection() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // 현재 영상 URL 로드
  const loadCurrentVideo = () => {
    const videoUrl = getHeroVideoUrl();
    setCurrentVideoUrl(videoUrl);
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 초기화
    setError(null);
    setSuccess(null);
    setPreviewUrl(null);

    // 파일 타입 검증
    if (!validateVideoFileType(file.name)) {
      setError('지원하지 않는 파일 형식입니다. MP4, WebM, MOV 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (100MB)
    if (!validateVideoFileSize(file.size)) {
      setError('파일 크기는 100MB 이하여야 합니다.');
      return;
    }

    // 미리보기 URL 생성
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // 업로드 핸들러
  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      // 업로드 경로 생성
      const uploadPath = generateVideoUploadPath(file.name);

      // 기존 파일이 있는지 확인하고 삭제
      const { data: existingFiles } = await supabase.storage
        .from('hero-videos')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (existingFiles && existingFiles.length > 0) {
        // 기존 파일 삭제
        const filesToRemove = existingFiles.map(f => f.name);
        await supabase.storage.from('hero-videos').remove(filesToRemove);
      }

      // 새 파일 업로드
      const { data, error: uploadError } = await supabase.storage
        .from('hero-videos')
        .upload(uploadPath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(100);
      setSuccess('영상이 성공적으로 업로드되었습니다!');

      // 현재 영상 URL 업데이트
      loadCurrentVideo();

      // 미리보기 URL 해제
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 영상 삭제 핸들러
  const handleDelete = async () => {
    if (!confirm('현재 히어로 영상을 삭제하시겠습니까?')) {
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // 모든 파일 삭제
      const { data: existingFiles } = await supabase.storage
        .from('hero-videos')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map(f => f.name);
        const { error: deleteError } = await supabase.storage
          .from('hero-videos')
          .remove(filesToRemove);

        if (deleteError) {
          throw deleteError;
        }

        setSuccess('영상이 삭제되었습니다.');
        setCurrentVideoUrl(null);
      } else {
        setError('삭제할 영상이 없습니다.');
      }

    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">히어로 영상 관리</h2>
        <p className="text-gray-600">메인 페이지 상단에 표시될 영상을 업로드하거나 교체할 수 있습니다.</p>
      </div>

      {/* 현재 영상 */}
      {currentVideoUrl && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">현재 영상</h3>
          <video
            src={currentVideoUrl}
            controls
            className="w-full max-w-2xl rounded-lg"
            poster="/images/hero-poster.jpg"
          >
            현재 브라우저는 비디오를 지원하지 않습니다.
          </video>
          <button
            onClick={handleDelete}
            disabled={uploading}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            영상 삭제
          </button>
        </div>
      )}

      {/* 파일 선택 */}
      <div className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">영상 파일 선택</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50"
          />
          <p className="mt-2 text-sm text-gray-500">
            지원 형식: MP4, WebM, MOV | 최대 크기: 100MB
          </p>
        </div>

        {/* 미리보기 */}
        {previewUrl && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">미리보기</h3>
            <video
              src={previewUrl}
              controls
              className="w-full max-w-2xl rounded-lg"
            >
              현재 브라우저는 비디오를 지원하지 않습니다.
            </video>
          </div>
        )}

        {/* 업로드 버튼 */}
        <button
          onClick={handleUpload}
          disabled={uploading || !previewUrl}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? '업로드 중...' : '영상 업로드'}
        </button>

        {/* 진행 상태 */}
        {uploading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}
      </div>

      {/* 사용 안내 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">📹 영상 업로드 가이드</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>권장 포맷: MP4 (H.264 codec)</li>
          <li>권장 해상도: 1920x1080 (Full HD)</li>
          <li>권장 파일 크기: 10-30MB</li>
          <li>영상은 자동으로 반복 재생되며 음소거 상태로 표시됩니다</li>
          <li>영상이 없으면 자동으로 포스터 이미지가 표시됩니다</li>
        </ul>
      </div>
    </div>
  );
}
