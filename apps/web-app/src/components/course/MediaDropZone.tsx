import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from '@/hooks/useTranslation'

interface MediaFile {
  id: string
  file: File
  type: 'image' | 'video' | 'audio' | 'document'
  preview?: string
  progress?: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface MediaDropZoneProps {
  onFilesUploaded: (files: MediaFile[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
  className?: string
}

const MediaDropZone: React.FC<MediaDropZoneProps> = ({
  onFilesUploaded,
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  className = ''
}) => {
  const { t } = useTranslation()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const getFileType = (file: File): MediaFile['type'] => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const getFileIcon = (type: MediaFile['type']) => {
    switch (type) {
      case 'image':
        return PhotoIcon
      case 'video':
        return VideoCameraIcon
      case 'audio':
        return MusicalNoteIcon
      case 'document':
      default:
        return DocumentIcon
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`Файл ${file.name} слишком большой. Максимальный размер: ${formatFileSize(maxSize)}`)
          } else if (error.code === 'file-invalid-type') {
            toast.error(`Неподдерживаемый тип файла: ${file.name}`)
          } else {
            toast.error(`Ошибка с файлом ${file.name}: ${error.message}`)
          }
        })
      })
    }

    // Process accepted files
    const newFiles: MediaFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: getFileType(file),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'uploading' as const,
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
    setIsUploading(true)

    // Simulate upload progress
    newFiles.forEach(mediaFile => {
      simulateUpload(mediaFile)
    })
  }, [maxSize])

  const simulateUpload = (mediaFile: MediaFile) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, status: 'success' as const, progress: 100 }
            : f
        ))
        
        // Check if all files are uploaded
        setTimeout(() => {
          setFiles(prev => {
            const allUploaded = prev.every(f => f.status === 'success')
            if (allUploaded) {
              setIsUploading(false)
              onFilesUploaded(prev)
            }
            return prev
          })
        }, 500)
      } else {
        setFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, progress }
            : f
        ))
      }
    }, 200)
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId)
      if (updated.length === 0) {
        setIsUploading(false)
      }
      return updated
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize,
    multiple: true
  })

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <CloudArrowUpIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
        
        {isDragActive ? (
          <div>
            <p className="text-lg font-medium text-primary-600 mb-2">
              Отпустите файлы здесь...
            </p>
            <p className="text-sm text-primary-500">
              Файлы будут загружены автоматически
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-secondary-700 mb-2">
              Перетащите файлы сюда или нажмите для выбора
            </p>
            <p className="text-sm text-secondary-500 mb-4">
              Поддерживаются изображения, видео, аудио и документы
            </p>
            <div className="text-xs text-secondary-400 space-y-1">
              <p>Максимум файлов: {maxFiles}</p>
              <p>Максимальный размер: {formatFileSize(maxSize)}</p>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-secondary-700">
            Загружаемые файлы ({files.length})
          </h4>
          
          <div className="space-y-2">
            {files.map((mediaFile) => {
              const FileIcon = getFileIcon(mediaFile.type)
              
              return (
                <div
                  key={mediaFile.id}
                  className="flex items-center space-x-3 p-3 bg-white border border-secondary-200 rounded-lg"
                >
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {mediaFile.preview ? (
                      <img
                        src={mediaFile.preview}
                        alt={mediaFile.file.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-secondary-100 rounded flex items-center justify-center">
                        <FileIcon className="h-5 w-5 text-secondary-500" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">
                      {mediaFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-secondary-500">
                      <span>{formatFileSize(mediaFile.file.size)}</span>
                      <span>•</span>
                      <span className="capitalize">{mediaFile.type}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    {mediaFile.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="w-full bg-secondary-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${mediaFile.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-secondary-500 mt-1">
                          {Math.round(mediaFile.progress || 0)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {mediaFile.status === 'uploading' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
                    )}
                    {mediaFile.status === 'success' && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                    {mediaFile.status === 'error' && (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(mediaFile.id)}
                    className="flex-shrink-0 p-1 text-secondary-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Upload Status */}
          {isUploading && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center space-x-2 text-primary-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
                <span className="text-sm">Загрузка файлов...</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {!isUploading && files.length > 0 && files.every(f => f.status === 'success') && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Все файлы успешно загружены!</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MediaDropZone
