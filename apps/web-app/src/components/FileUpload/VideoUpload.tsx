import React, { useState, useRef } from 'react';
import FileUpload, { FileUploadProps, UploadResult } from './FileUpload';
import { VideoCameraIcon, PlayIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface VideoUploadProps extends Omit<FileUploadProps, 'accept' | 'children' | 'context'> {
  context: 'lesson-video';
  showPreview?: boolean;
  maxDuration?: number; // в секундах
  generateThumbnail?: boolean;
}

interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  size: number;
  thumbnailUrl?: string;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  context,
  showPreview = true,
  maxDuration,
  generateThumbnail = true,
  onUpload,
  maxSize = 500 * 1024 * 1024, // 500MB для видео
  className,
  ...props
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<UploadResult | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Получение информации о видео
  const getVideoInfo = (file: File): Promise<VideoInfo> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const info: VideoInfo = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size
        };
        
        URL.revokeObjectURL(url);
        resolve(info);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Не удалось загрузить видео'));
      };
      
      video.src = url;
    });
  };

  // Создание миниатюры видео
  const generateVideoThumbnail = (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.onloadeddata = () => {
        // Переходим к 10% длительности видео для миниатюры
        video.currentTime = video.duration * 0.1;
      };

      video.onseeked = () => {
        // Устанавливаем размер canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Рисуем кадр на canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Получаем data URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(video.src);
        resolve(thumbnailDataUrl);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Ошибка обработки видео'));
      };

      video.src = URL.createObjectURL(videoFile);
    });
  };

  // Форматирование времени
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Обработка загрузки видео
  const handleUpload = async (files: File[]): Promise<UploadResult[]> => {
    const file = files[0]; // Берем только первый файл

    try {
      // Получаем информацию о видео
      const info = await getVideoInfo(file);
      setVideoInfo(info);

      // Проверяем длительность
      if (maxDuration && info.duration > maxDuration) {
        throw new Error(`Видео слишком длинное. Максимальная длительность: ${formatDuration(maxDuration)}`);
      }

      // Создаем предварительный просмотр
      if (showPreview) {
        const videoUrl = URL.createObjectURL(file);
        setPreviewUrl(videoUrl);
      }

      // Генерируем миниатюру
      if (generateThumbnail) {
        try {
          const thumbnail = await generateVideoThumbnail(file);
          setThumbnailUrl(thumbnail);
        } catch (error) {
          console.warn('Failed to generate thumbnail:', error);
        }
      }

      // Вызываем родительский обработчик загрузки
      const results = await onUpload(files);
      
      if (results.length > 0) {
        setUploadedVideo(results[0]);
      }

      return results;

    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Превью видео */}
      {showPreview && (uploadedVideo?.url || previewUrl) && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={uploadedVideo?.url || previewUrl || ''}
            className="w-full h-auto max-h-64"
            controls
            preload="metadata"
          >
            Ваш браузер не поддерживает видео.
          </video>
          
          {/* Информация о видео */}
          {videoInfo && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
              <div className="flex justify-between text-xs">
                <span>Длительность: {formatDuration(videoInfo.duration)}</span>
                <span>Размер: {formatFileSize(videoInfo.size)}</span>
                <span>Разрешение: {videoInfo.width}×{videoInfo.height}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Миниатюра (если сгенерирована) */}
      {thumbnailUrl && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-700 mb-2">
            Автоматически созданная миниатюра:
          </div>
          <div className="relative inline-block">
            <img 
              src={thumbnailUrl} 
              alt="Миниатюра видео" 
              className="w-32 h-18 object-cover rounded border"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayIcon className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>
      )}

      <FileUpload
        {...props}
        accept="video/mp4,video/webm,video/avi,video/mov,video/quicktime"
        multiple={false}
        maxFiles={1}
        maxSize={maxSize}
        context={context}
        onUpload={handleUpload}
        helperText="MP4, WebM, AVI, MOV до 500МБ"
      >
        <div className="space-y-2">
          <VideoCameraIcon className="w-12 h-12 text-gray-400 mx-auto" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              Загрузить видео урока
            </div>
            <div className="text-xs text-gray-500 mt-1">
              MP4, WebM, AVI, MOV до 500МБ
              {maxDuration && ` • Макс. ${formatDuration(maxDuration)}`}
            </div>
          </div>
        </div>
      </FileUpload>

      {/* Рекомендации по видео */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <div className="text-xs text-yellow-800">
          <strong>🎥 Рекомендации для видео:</strong>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            <li>Используйте формат MP4 для лучшей совместимости</li>
            <li>Рекомендуемое разрешение: 1920×1080 (Full HD) или 1280×720 (HD)</li>
            <li>Оптимальная частота кадров: 24-30 FPS</li>
            <li>Используйте хорошее освещение и четкое аудио</li>
            <li>Структурируйте контент урока с введением и заключением</li>
          </ul>
        </div>
      </div>

      {/* Скрытый canvas для генерации миниатюр */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VideoUpload;
