import React, { useRef, useState, useCallback } from 'react';
import { CloudArrowUpIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // в байтах
  maxFiles?: number;
  onUpload: (files: File[]) => Promise<UploadResult[]>;
  onProgress?: (progress: number) => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  context: FileUploadContext;
  helperText?: string;
}

export type FileUploadContext = 
  | 'course-cover'
  | 'course-thumbnail' 
  | 'lesson-video'
  | 'lesson-audio'
  | 'lesson-attachment'
  | 'assignment-submission'
  | 'user-avatar'
  | 'temp';

export interface UploadResult {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

interface FileUploadState {
  isDragOver: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadedFiles: UploadResult[];
  errors: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB по умолчанию
  maxFiles = 1,
  onUpload,
  onProgress,
  className,
  children,
  disabled = false,
  context: _context, // Переименовываем чтобы избежать ошибки unused
  helperText
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FileUploadState>({
    isDragOver: false,
    isUploading: false,
    uploadProgress: 0,
    uploadedFiles: [],
    errors: []
  });

  // Валидация файлов
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `Файл "${file.name}" слишком большой. Максимальный размер: ${maxSizeMB} МБ`;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isAccepted) {
        return `Тип файла "${file.type}" не поддерживается`;
      }
    }

    return null;
  }, [maxSize, accept]);

  // Обработка выбора файлов
  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const errors: string[] = [];

    // Проверка количества файлов
    if (fileArray.length > maxFiles) {
      errors.push(`Можно загрузить максимум ${maxFiles} файлов`);
      setState(prev => ({ ...prev, errors }));
      return;
    }

    // Валидация каждого файла
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      setState(prev => ({ ...prev, errors }));
      return;
    }

    // Загрузка файлов
    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      uploadProgress: 0, 
      errors: [] 
    }));

    try {
      const results = await onUpload(fileArray);
      
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        uploadProgress: 100,
        uploadedFiles: [...prev.uploadedFiles, ...results],
        errors: []
      }));

      onProgress?.(100);
    } catch (error) {
      console.error('Upload error:', error);
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        uploadProgress: 0,
        errors: ['Ошибка загрузки файла. Попробуйте снова.']
      }));
    }
  }, [maxFiles, validateFile, onUpload, onProgress]);

  // Обработчики событий
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: true }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled && !state.isUploading) {
      fileInputRef.current?.click();
    }
  };

  const removeFile = (index: number) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const clearErrors = () => {
    setState(prev => ({ ...prev, errors: [] }));
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Зона загрузки */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          {
            'border-primary-500 bg-primary-50': state.isDragOver,
            'border-gray-300 hover:border-gray-400': !state.isDragOver && !disabled,
            'border-gray-200 bg-gray-50 cursor-not-allowed': disabled,
            'border-green-400 bg-green-50': state.uploadedFiles.length > 0,
          }
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {state.isUploading ? (
          <div className="space-y-3">
            <div className="animate-pulse">
              <CloudArrowUpIcon className="w-12 h-12 text-primary-500 mx-auto" />
            </div>
            <div className="text-sm font-medium text-gray-900">
              Загружаем файл...
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : state.uploadedFiles.length > 0 ? (
          <div className="space-y-2">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />
            <div className="text-sm font-medium text-green-900">
              Файлы загружены!
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
            {children || (
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Нажмите для выбора файлов или перетащите сюда
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {helperText || `Максимальный размер: ${formatFileSize(maxSize)}`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Список загруженных файлов */}
      {state.uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Загруженные файлы:</h4>
          {state.uploadedFiles.map((file, index) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {file.mimeType}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 text-xs"
                >
                  Просмотр
                </a>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ошибки */}
      {state.errors.length > 0 && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Ошибки загрузки:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc space-y-1 pl-5">
                  {state.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={clearErrors}
                  className="text-xs text-red-800 hover:text-red-600 underline"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
