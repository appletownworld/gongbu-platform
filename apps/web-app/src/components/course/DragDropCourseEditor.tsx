import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  Bars3Icon,
  DocumentTextIcon,
  PlayIcon,
  MicrophoneIcon,
  PhotoIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { coursesApi } from '@/services/api'
import { Lesson, LessonContentType } from '@/types/course'
import { useTranslation } from '@/hooks/useTranslation'

interface DragDropCourseEditorProps {
  courseId: string
  lessons: Lesson[]
  onLessonsUpdate: (lessons: Lesson[]) => void
  onEditLesson: (lesson: Lesson) => void
  onDeleteLesson: (lessonId: string) => void
  onAddLesson: () => void
}

const DragDropCourseEditor: React.FC<DragDropCourseEditorProps> = ({
  courseId,
  lessons,
  onLessonsUpdate,
  onEditLesson,
  onDeleteLesson,
  onAddLesson
}) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update lesson order mutation
  const updateLessonOrderMutation = useMutation({
    mutationFn: async (updatedLessons: Lesson[]) => {
      // Update each lesson's order
      const updatePromises = updatedLessons.map((lesson, index) =>
        coursesApi.updateLesson(lesson.id, { order: index })
      )
      await Promise.all(updatePromises)
    },
    onSuccess: () => {
      toast.success('Порядок уроков обновлен!')
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
    },
    onError: (error: any) => {
      toast.error('Ошибка обновления порядка: ' + error.message)
    }
  })

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex(lesson => lesson.id === active.id)
      const newIndex = lessons.findIndex(lesson => lesson.id === over.id)

      const newLessons = arrayMove(lessons, oldIndex, newIndex)
      onLessonsUpdate(newLessons)
      
      // Update order in backend
      updateLessonOrderMutation.mutate(newLessons)
    }

    setActiveId(null)
  }

  const getContentIcon = (contentType: LessonContentType) => {
    switch (contentType) {
      case LessonContentType.VIDEO:
        return PlayIcon
      case LessonContentType.AUDIO:
        return MicrophoneIcon
      case LessonContentType.IMAGE:
        return PhotoIcon
      case LessonContentType.TEXT:
      default:
        return DocumentTextIcon
    }
  }

  const getContentTypeLabel = (contentType: LessonContentType) => {
    switch (contentType) {
      case LessonContentType.VIDEO:
        return 'Видео'
      case LessonContentType.AUDIO:
        return 'Аудио'
      case LessonContentType.IMAGE:
        return 'Изображение'
      case LessonContentType.TEXT:
      default:
        return 'Текст'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900">
          Уроки курса ({lessons.length})
        </h3>
        <button
          onClick={onAddLesson}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Добавить урок</span>
        </button>
      </div>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={lessons.map(lesson => lesson.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <SortableLessonItem
                key={lesson.id}
                lesson={lesson}
                onEdit={onEditLesson}
                onDelete={onDeleteLesson}
                getContentIcon={getContentIcon}
                getContentTypeLabel={getContentTypeLabel}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="bg-white rounded-lg shadow-lg border border-primary-300 p-4 opacity-90">
              <div className="flex items-center space-x-3">
                <Bars3Icon className="h-5 w-5 text-primary-600" />
                <div className="flex-1">
                  <h4 className="font-medium text-secondary-900">
                    {lessons.find(l => l.id === activeId)?.title || 'Урок'}
                  </h4>
                  <p className="text-sm text-secondary-500">
                    Перетаскивание...
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {lessons.length === 0 && (
        <div className="text-center py-12 bg-secondary-50 rounded-lg border-2 border-dashed border-secondary-300">
          <DocumentTextIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-secondary-700 mb-2">
            Пока нет уроков
          </h4>
          <p className="text-secondary-500 mb-4">
            Добавьте первый урок, чтобы начать создавать курс
          </p>
          <button
            onClick={onAddLesson}
            className="btn-primary"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Создать первый урок
          </button>
        </div>
      )}

      {/* Update Status */}
      {updateLessonOrderMutation.isPending && (
        <div className="flex items-center justify-center space-x-2 text-primary-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          <span className="text-sm">Обновление порядка...</span>
        </div>
      )}
    </div>
  )
}

// Sortable Lesson Item Component
interface SortableLessonItemProps {
  lesson: Lesson
  onEdit: (lesson: Lesson) => void
  onDelete: (lessonId: string) => void
  getContentIcon: (type: LessonContentType) => any
  getContentTypeLabel: (type: LessonContentType) => string
}

const SortableLessonItem: React.FC<SortableLessonItemProps> = ({
  lesson,
  onEdit,
  onDelete,
  getContentIcon,
  getContentTypeLabel
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const ContentIcon = getContentIcon(lesson.contentType)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-secondary-200 p-4 transition-all duration-200 ${
        isDragging ? 'shadow-lg border-primary-300 opacity-50' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center space-x-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-2 text-secondary-400 hover:text-primary-600 cursor-grab active:cursor-grabbing transition-colors"
        >
          <Bars3Icon className="h-5 w-5" />
        </div>

        {/* Lesson Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-secondary-500 bg-secondary-100 px-2 py-1 rounded">
                {lesson.order + 1}
              </span>
              <ContentIcon className="h-4 w-4 text-secondary-400" />
            </div>
            
            <h4 className="text-lg font-medium text-secondary-900 truncate">
              {lesson.title}
            </h4>

            {/* Status Badges */}
            <div className="flex items-center space-x-2">
              {lesson.isFree && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Бесплатный
                </span>
              )}
              {lesson.isPreview && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Превью
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-secondary-500">
            <span className="flex items-center">
              <ContentIcon className="h-3 w-3 mr-1" />
              {getContentTypeLabel(lesson.contentType)}
            </span>
            
            {lesson.duration && (
              <span className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                {lesson.duration} мин
              </span>
            )}

            <span className="flex items-center">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              {lesson.isPublished ? 'Опубликован' : 'Черновик'}
            </span>
          </div>

          {lesson.description && (
            <p className="mt-2 text-sm text-secondary-600 line-clamp-2">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(lesson)}
            className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Редактировать"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(lesson.id)}
            className="p-2 text-secondary-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
            title="Удалить"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DragDropCourseEditor
