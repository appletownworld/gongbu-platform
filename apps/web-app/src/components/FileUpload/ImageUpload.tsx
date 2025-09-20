import React, { useState } from 'react';
import FileUpload, { FileUploadProps, UploadResult } from './FileUpload';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface ImageUploadProps extends Omit<FileUploadProps, 'accept' | 'children' | 'context'> {
  context: 'course-cover' | 'course-thumbnail' | 'user-avatar';
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  showPreview?: boolean;
  previewSize?: 'sm' | 'md' | 'lg';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  context,
  aspectRatio = 'auto',
  showPreview = true,
  previewSize = 'md',
  onUpload,
  maxSize = 5 * 1024 * 1024, // 5MB для изображений
  className,
  ...props
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadResult | null>(null);

  // Обработка загрузки с предварительным просмотром
  const handleUpload = async (files: File[]): Promise<UploadResult[]> => {
    const file = files[0]; // Берем только первый файл для изображения

    // Создаем предварительный просмотр
    if (showPreview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Вызываем родительский обработчик загрузки
    const results = await onUpload(files);
    
    if (results.length > 0) {
      setUploadedImage(results[0]);
    }

    return results;
  };

  // Размеры превью в зависимости от размера
  const getPreviewSize = () => {
    const sizes = {
      sm: 'w-16 h-16',
      md: 'w-24 h-24', 
      lg: 'w-32 h-32'
    };
    return sizes[previewSize];
  };

  // Aspect ratio классы
  const getAspectRatioClass = () => {
    const ratios = {
      square: 'aspect-square',
      video: 'aspect-video', 
      banner: 'aspect-[3/1]',
      auto: ''
    };
    return ratios[aspectRatio];
  };

  // Подсказки для разных контекстов
  const getContextHelperText = () => {
    const helpers = {
      'course-cover': 'Рекомендуемый размер: 1280x720px, JPG/PNG, до 5МБ',
      'course-thumbnail': 'Рекомендуемый размер: 400x225px, JPG/PNG, до 2МБ', 
      'user-avatar': 'Рекомендуемый размер: 200x200px, JPG/PNG, до 3МБ'
    };
    return helpers[context];
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Превью загруженного изображения */}
      {showPreview && (uploadedImage?.url || previewUrl) && (
        <div className="flex justify-center">
          <div className={clsx(
            'relative overflow-hidden rounded-lg border-2 border-gray-200',
            getPreviewSize(),
            getAspectRatioClass()
          )}>
            <img
              src={uploadedImage?.url || previewUrl || ''}
              alt="Предварительный просмотр"
              className="w-full h-full object-cover"
            />
            {uploadedImage?.thumbnailUrl && (
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs">Загружено</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <FileUpload
        {...props}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple={false}
        maxFiles={1}
        maxSize={maxSize}
        context={context}
        onUpload={handleUpload}
        helperText={getContextHelperText()}
      >
        <div className="space-y-2">
          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              Загрузить изображение
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {getContextHelperText()}
            </div>
          </div>
        </div>
      </FileUpload>

      {/* Дополнительные подсказки по оптимизации */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="text-xs text-blue-800">
          <strong>💡 Советы по оптимизации:</strong>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            <li>Используйте JPG для фотографий, PNG для графики с прозрачностью</li>
            <li>Сжимайте изображения перед загрузкой</li>
            {context === 'course-cover' && (
              <li>Используйте яркие контрастные изображения для лучшей видимости</li>
            )}
            {context === 'user-avatar' && (
              <li>Квадратные изображения лучше всего подходят для аватаров</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
