'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Button from '@/components/atoms/Button';

interface ImageData {
  index: number;
  path: string;
  url: string;
  name: string;
}

interface ImageUploadSectionProps {
  facilityId: string;
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
  disabled?: boolean;
}

export default function ImageUploadSection({
  facilityId,
  images,
  onImagesChange,
  disabled = false
}: ImageUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    if (disabled) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 체크 (5MB)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = imageFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError('파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    // 허용된 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = imageFiles.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError('JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const uploadPromises = imageFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`/api/admin/facilities/${facilityId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '이미지 업로드에 실패했습니다.');
        }

        return response.json();
      });

      await Promise.all(uploadPromises);

      // 이미지 목록 새로고침
      await refreshImages();

    } catch (err: any) {
      console.error('Image upload error:', err);
      setError(err.message || '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const refreshImages = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/facilities/${facilityId}/images`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        onImagesChange(data.data.images || []);
      }
    } catch (err) {
      console.error('Images refresh error:', err);
    }
  };

  const handleDeleteImage = async (imageIndex: number) => {
    if (disabled || !confirm('이 이미지를 삭제하시겠습니까?')) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/facilities/${facilityId}/images?index=${imageIndex}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        // 이미지 목록에서 해당 이미지 제거
        const updatedImages = images.filter((_, index) => index !== imageIndex);
        onImagesChange(updatedImages);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '이미지 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Image delete error:', err);
      setError('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleMoveImage = async (fromIndex: number, toIndex: number) => {
    if (disabled || fromIndex === toIndex) return;

    const reorderedImages = [...images];
    const [movedImage] = reorderedImages.splice(fromIndex, 1);
    reorderedImages.splice(toIndex, 0, movedImage);

    // UI 먼저 업데이트
    onImagesChange(reorderedImages);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const imageOrder = reorderedImages.map((_, index) => {
        // 원래 인덱스를 찾아서 전송
        const originalIndex = images.findIndex(img => img.path === reorderedImages[index].path);
        return originalIndex;
      });

      const response = await fetch(`/api/admin/facilities/${facilityId}/images`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageOrder })
      });

      if (!response.ok) {
        // 실패 시 원래 순서로 복원
        onImagesChange(images);
        const errorData = await response.json();
        setError(errorData.message || '이미지 순서 변경에 실패했습니다.');
      }
    } catch (err: any) {
      // 실패 시 원래 순서로 복원
      onImagesChange(images);
      console.error('Image reorder error:', err);
      setError('이미지 순서 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          시설 이미지
        </label>
        <span className="text-xs text-gray-500">
          {images.length}/10개 (최대 10개)
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <div className="text-3xl text-gray-400">📸</div>
          <div className="text-sm text-gray-600">
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>업로드 중...</span>
              </div>
            ) : (
              <>
                <p>이미지를 여기에 드래그하거나</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || images.length >= 10}
                >
                  파일 선택
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">
            JPEG, PNG, WebP 형식, 최대 5MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || images.length >= 10}
        />
      </div>

      {/* 이미지 목록 */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">업로드된 이미지</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={`${image.path}-${index}`} className="relative group border rounded-lg overflow-hidden">
                <div className="relative w-full h-24">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>

                {/* 대표 이미지 표시 */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    대표
                  </div>
                )}

                {/* 순서 표시 */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                  {index + 1}
                </div>

                {/* 컨트롤 버튼들 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="flex space-x-1">
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveImage(index, index - 1)}
                        disabled={disabled}
                        className="text-xs p-1 h-6 w-6 bg-white"
                      >
                        ←
                      </Button>
                    )}
                    {index < images.length - 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveImage(index, index + 1)}
                        disabled={disabled}
                        className="text-xs p-1 h-6 w-6 bg-white"
                      >
                        →
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteImage(index)}
                      disabled={disabled}
                      className="text-xs p-1 h-6 w-6 bg-white text-red-600 hover:bg-red-50"
                    >
                      ×
                    </Button>
                  </div>
                </div>

                {/* 이미지 이름 */}
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-600 truncate" title={image.name}>
                    {image.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• 첫 번째 이미지가 시설의 대표 이미지로 사용됩니다.</p>
            <p>• 화살표 버튼으로 이미지 순서를 변경할 수 있습니다.</p>
            <p>• × 버튼으로 이미지를 삭제할 수 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}