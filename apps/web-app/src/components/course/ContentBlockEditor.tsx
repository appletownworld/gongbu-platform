import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
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
  Bars3Icon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  CodeBracketIcon,
  ListBulletIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { useTranslation } from '@/hooks/useTranslation'

export interface ContentBlock {
  id: string
  type: ContentBlockType
  content: string
  order: number
  metadata?: Record<string, any>
}

export enum ContentBlockType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  CODE = 'CODE',
  LIST = 'LIST',
  QUIZ = 'QUIZ',
  EXERCISE = 'EXERCISE'
}

interface ContentBlockEditorProps {
  blocks: ContentBlock[]
  onBlocksUpdate: (blocks: ContentBlock[]) => void
  onBlockEdit: (block: ContentBlock) => void
  onBlockDelete: (blockId: string) => void
  onBlockAdd: (type: ContentBlockType) => void
  className?: string
}

const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  blocks,
  onBlocksUpdate,
  onBlockEdit,
  onBlockDelete,
  onBlockAdd,
  className = ''
}) => {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(block => block.id === active.id)
      const newIndex = blocks.findIndex(block => block.id === over.id)

      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        order: index
      }))
      onBlocksUpdate(newBlocks)
    }

    setActiveId(null)
  }

  const getBlockIcon = (type: ContentBlockType) => {
    switch (type) {
      case ContentBlockType.TEXT:
        return DocumentTextIcon
      case ContentBlockType.IMAGE:
        return PhotoIcon
      case ContentBlockType.VIDEO:
        return VideoCameraIcon
      case ContentBlockType.AUDIO:
        return MusicalNoteIcon
      case ContentBlockType.CODE:
        return CodeBracketIcon
      case ContentBlockType.LIST:
        return ListBulletIcon
      case ContentBlockType.QUIZ:
      case ContentBlockType.EXERCISE:
        return QuestionMarkCircleIcon
      default:
        return DocumentTextIcon
    }
  }

  const getBlockTypeLabel = (type: ContentBlockType) => {
    switch (type) {
      case ContentBlockType.TEXT:
        return 'Текстовый блок'
      case ContentBlockType.IMAGE:
        return 'Изображение'
      case ContentBlockType.VIDEO:
        return 'Видео'
      case ContentBlockType.AUDIO:
        return 'Аудио'
      case ContentBlockType.CODE:
        return 'Код'
      case ContentBlockType.LIST:
        return 'Список'
      case ContentBlockType.QUIZ:
        return 'Викторина'
      case ContentBlockType.EXERCISE:
        return 'Упражнение'
      default:
        return 'Блок контента'
    }
  }

  const getBlockPreview = (block: ContentBlock) => {
    switch (block.type) {
      case ContentBlockType.TEXT:
        return block.content.length > 100 
          ? block.content.substring(0, 100) + '...'
          : block.content
      case ContentBlockType.IMAGE:
        return 'Изображение: ' + (block.metadata?.alt || 'Без описания')
      case ContentBlockType.VIDEO:
        return 'Видео: ' + (block.metadata?.title || 'Без названия')
      case ContentBlockType.AUDIO:
        return 'Аудио: ' + (block.metadata?.title || 'Без названия')
      case ContentBlockType.CODE:
        return 'Код: ' + (block.metadata?.language || 'Текст')
      case ContentBlockType.LIST:
        return 'Список: ' + (block.metadata?.items?.length || 0) + ' элементов'
      case ContentBlockType.QUIZ:
        return 'Викторина: ' + (block.metadata?.questions?.length || 0) + ' вопросов'
      case ContentBlockType.EXERCISE:
        return 'Упражнение: ' + (block.metadata?.title || 'Без названия')
      default:
        return block.content
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary-900">
          Блоки контента ({blocks.length})
        </h3>
        <BlockTypeSelector onSelect={onBlockAdd} />
      </div>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map(block => block.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {blocks.map((block) => (
              <SortableContentBlock
                key={block.id}
                block={block}
                onEdit={onBlockEdit}
                onDelete={onBlockDelete}
                getBlockIcon={getBlockIcon}
                getBlockTypeLabel={getBlockTypeLabel}
                getBlockPreview={getBlockPreview}
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
                    {blocks.find(b => b.id === activeId)?.type || 'Блок'}
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
      {blocks.length === 0 && (
        <div className="text-center py-12 bg-secondary-50 rounded-lg border-2 border-dashed border-secondary-300">
          <DocumentTextIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-secondary-700 mb-2">
            Пока нет блоков контента
          </h4>
          <p className="text-secondary-500 mb-4">
            Добавьте первый блок, чтобы начать создавать урок
          </p>
          <BlockTypeSelector onSelect={onBlockAdd} />
        </div>
      )}
    </div>
  )
}

// Block Type Selector Component
interface BlockTypeSelectorProps {
  onSelect: (type: ContentBlockType) => void
}

const BlockTypeSelector: React.FC<BlockTypeSelectorProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false)

  const blockTypes = [
    { type: ContentBlockType.TEXT, label: 'Текстовый блок', icon: DocumentTextIcon },
    { type: ContentBlockType.IMAGE, label: 'Изображение', icon: PhotoIcon },
    { type: ContentBlockType.VIDEO, label: 'Видео', icon: VideoCameraIcon },
    { type: ContentBlockType.AUDIO, label: 'Аудио', icon: MusicalNoteIcon },
    { type: ContentBlockType.CODE, label: 'Код', icon: CodeBracketIcon },
    { type: ContentBlockType.LIST, label: 'Список', icon: ListBulletIcon },
    { type: ContentBlockType.QUIZ, label: 'Викторина', icon: QuestionMarkCircleIcon },
    { type: ContentBlockType.EXERCISE, label: 'Упражнение', icon: QuestionMarkCircleIcon },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-primary flex items-center space-x-2"
      >
        <PlusIcon className="h-4 w-4" />
        <span>Добавить блок</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-secondary-200 z-20">
            <div className="p-2">
              <h4 className="px-3 py-2 text-sm font-medium text-secondary-700">
                Выберите тип блока
              </h4>
              <div className="space-y-1">
                {blockTypes.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => {
                      onSelect(type)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-700 rounded-md transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Sortable Content Block Component
interface SortableContentBlockProps {
  block: ContentBlock
  onEdit: (block: ContentBlock) => void
  onDelete: (blockId: string) => void
  getBlockIcon: (type: ContentBlockType) => any
  getBlockTypeLabel: (type: ContentBlockType) => string
  getBlockPreview: (block: ContentBlock) => string
}

const SortableContentBlock: React.FC<SortableContentBlockProps> = ({
  block,
  onEdit,
  onDelete,
  getBlockIcon,
  getBlockTypeLabel,
  getBlockPreview
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const BlockIcon = getBlockIcon(block.type)

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

        {/* Block Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-secondary-500 bg-secondary-100 px-2 py-1 rounded">
                {block.order + 1}
              </span>
              <BlockIcon className="h-4 w-4 text-secondary-400" />
            </div>
            
            <h4 className="text-lg font-medium text-secondary-900">
              {getBlockTypeLabel(block.type)}
            </h4>
          </div>

          <p className="text-sm text-secondary-600 line-clamp-2">
            {getBlockPreview(block)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(block)}
            className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Редактировать"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(block.id)}
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

export default ContentBlockEditor
