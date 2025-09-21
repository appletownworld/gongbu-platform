import React, { useState } from 'react';
import { Lesson } from '../hooks/useCourses';

interface CourseEditorProps {
  course?: any;
  onSave: (courseId: string, updates: any) => Promise<void>;
  onCreate: (courseData: any) => Promise<any>;
  onCancel: () => void;
}

export const CourseEditor: React.FC<CourseEditorProps> = ({
  course,
  onSave,
  onCreate,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    image: course?.image || '',
  });
  const [lessons, setLessons] = useState<Lesson[]>(course?.lessons || []);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'lessons'>('info');

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (course) {
        await onSave(course.id, { ...formData, lessons });
      } else {
        await onCreate({ ...formData, lessons });
      }
    } catch (error) {
      console.error('Ошибка сохранения курса:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'Новый урок',
      description: '',
      content: '',
      type: 'text',
      order: lessons.length + 1,
      isPaid: false,
    };
    setLessons([...lessons, newLesson]);
  };

  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    setLessons(lessons.map(lesson =>
      lesson.id === lessonId ? { ...lesson, ...updates } : lesson
    ));
  };

  const deleteLesson = (lessonId: string) => {
    setLessons(lessons.filter(lesson => lesson.id !== lessonId));
  };

  const moveLesson = (lessonId: string, direction: 'up' | 'down') => {
    const index = lessons.findIndex(lesson => lesson.id === lessonId);
    if (index === -1) return;

    const newLessons = [...lessons];
    if (direction === 'up' && index > 0) {
      [newLessons[index], newLessons[index - 1]] = [newLessons[index - 1], newLessons[index]];
    } else if (direction === 'down' && index < lessons.length - 1) {
      [newLessons[index], newLessons[index + 1]] = [newLessons[index + 1], newLessons[index]];
    }

    // Обновляем порядок
    newLessons.forEach((lesson, idx) => {
      lesson.order = idx + 1;
    });

    setLessons(newLessons);
  };

  return (
    <div className="course-editor">
      <div className="editor-header">
        <h1>{course ? 'Редактирование курса' : 'Создание курса'}</h1>
        <div className="editor-actions">
          <button onClick={onCancel} className="btn-secondary">
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="btn-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="editor-tabs">
        <button
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          📝 Информация
        </button>
        <button
          className={`tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          📚 Уроки ({lessons.length})
        </button>
      </div>

      <div className="editor-content">
        {activeTab === 'info' && (
          <div className="course-info-editor">
            <div className="form-group">
              <label>Название курса</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Введите название курса"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишите, что изучают в этом курсе"
                className="form-textarea"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Изображение курса (URL)</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="form-input"
              />
              {formData.image && (
                <div className="image-preview">
                  <img src={formData.image} alt="Превью" />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="lessons-editor">
            <div className="lessons-header">
              <h3>Уроки курса</h3>
              <button onClick={addLesson} className="btn-primary">
                ➕ Добавить урок
              </button>
            </div>

            <div className="lessons-list">
              {lessons.map((lesson, index) => (
                <LessonEditor
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  onUpdate={(updates) => updateLesson(lesson.id, updates)}
                  onDelete={() => deleteLesson(lesson.id)}
                  onMove={(direction) => moveLesson(lesson.id, direction)}
                  canMoveUp={index > 0}
                  canMoveDown={index < lessons.length - 1}
                />
              ))}

              {lessons.length === 0 && (
                <div className="empty-lessons">
                  <p>Уроков пока нет</p>
                  <button onClick={addLesson} className="btn-primary">
                    Создать первый урок
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface LessonEditorProps {
  lesson: Lesson;
  index: number;
  onUpdate: (updates: Partial<Lesson>) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const LessonEditor: React.FC<LessonEditorProps> = ({
  lesson,
  index,
  onUpdate,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="lesson-editor">
      <div className="lesson-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="lesson-info">
          <span className="lesson-number">{index + 1}</span>
          <div className="lesson-details">
            <h4>{lesson.title || 'Без названия'}</h4>
            <span className="lesson-type">{getLessonTypeLabel(lesson.type)}</span>
            {lesson.isPaid && (
              <span className="lesson-price">
                💰 {lesson.price} {lesson.currency || 'RUB'}
              </span>
            )}
          </div>
        </div>
        <div className="lesson-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove('up');
            }}
            disabled={!canMoveUp}
            className="btn-icon"
          >
            ⬆️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove('down');
            }}
            disabled={!canMoveDown}
            className="btn-icon"
          >
            ⬇️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="btn-icon danger"
          >
            🗑️
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="lesson-content">
          <div className="form-group">
            <label>Название урока</label>
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Введите название урока"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={lesson.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Краткое описание урока"
              className="form-textarea"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Тип урока</label>
            <select
              value={lesson.type}
              onChange={(e) => onUpdate({ type: e.target.value as Lesson['type'] })}
              className="form-select"
            >
              <option value="text">📝 Текстовый урок</option>
              <option value="video">🎥 Видео урок</option>
              <option value="quiz">❓ Квиз</option>
              <option value="assignment">📋 Задание</option>
            </select>
          </div>

          <div className="form-group">
            <label>Содержимое</label>
            <textarea
              value={lesson.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="Содержимое урока..."
              className="form-textarea"
              rows={6}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={lesson.isPaid}
                onChange={(e) => onUpdate({ isPaid: e.target.checked })}
              />
              <span>Платный урок</span>
            </label>
          </div>

          {lesson.isPaid && (
            <div className="form-row">
              <div className="form-group">
                <label>Цена</label>
                <input
                  type="number"
                  value={lesson.price || 0}
                  onChange={(e) => onUpdate({ price: Number(e.target.value) })}
                  placeholder="0"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Валюта</label>
                <select
                  value={lesson.currency || 'RUB'}
                  onChange={(e) => onUpdate({ currency: e.target.value })}
                  className="form-select"
                >
                  <option value="RUB">RUB</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function getLessonTypeLabel(type: Lesson['type']): string {
  switch (type) {
    case 'text': return '📝 Текст';
    case 'video': return '🎥 Видео';
    case 'quiz': return '❓ Квиз';
    case 'assignment': return '📋 Задание';
    default: return '❓ Неизвестно';
  }
}
