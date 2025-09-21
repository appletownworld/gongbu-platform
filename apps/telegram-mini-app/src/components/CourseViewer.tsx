import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n';

interface CourseViewerProps {
  course: any;
  onEdit?: () => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onEdit }) => {
  const { t } = useI18n();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            {t('error.not_found')}
          </h2>
          <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
            Course not found
          </p>
        </div>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const currentLesson = lessons[currentLessonIndex];

  const handleNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const handleMarkComplete = () => {
    // Mark lesson as complete
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(t('viewer.lesson_complete'));
    }
  };

  return (
    <div className="course-viewer min-h-screen" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--tg-theme-hint-color, #999999)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            📚 {course.title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
            {t('viewer.course_progress')}: {currentLessonIndex + 1} / {lessons.length}
          </p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ 
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
              color: 'var(--tg-theme-text-color, #000000)'
            }}
          >
            ✏️
          </button>
        )}
      </div>

      {/* Course Content */}
      <div className="p-4">
        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
              {t('viewer.welcome')}
            </h3>
            <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
              No lessons available yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lesson Content */}
            <div className="bg-white rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
                {currentLesson?.title || `Lesson ${currentLessonIndex + 1}`}
              </h2>
              <div className="prose" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
                {currentLesson?.content || (
                  <p>This lesson content is not available yet.</p>
                )}
              </div>
            </div>

            {/* Lesson Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousLesson}
                disabled={currentLessonIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: currentLessonIndex === 0 
                    ? 'var(--tg-theme-secondary-bg-color, #f0f0f0)'
                    : 'var(--tg-theme-button-color, #2481cc)',
                  color: currentLessonIndex === 0 
                    ? 'var(--tg-theme-hint-color, #999999)'
                    : 'var(--tg-theme-button-text-color, #ffffff)'
                }}
              >
                <span>←</span>
                <span>{t('viewer.previous_lesson')}</span>
              </button>

              <button
                onClick={handleMarkComplete}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
                  color: 'var(--tg-theme-button-text-color, #ffffff)'
                }}
              >
                {t('lesson.mark_complete')}
              </button>

              <button
                onClick={handleNextLesson}
                disabled={currentLessonIndex === lessons.length - 1}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: currentLessonIndex === lessons.length - 1 
                    ? 'var(--tg-theme-secondary-bg-color, #f0f0f0)'
                    : 'var(--tg-theme-button-color, #2481cc)',
                  color: currentLessonIndex === lessons.length - 1 
                    ? 'var(--tg-theme-hint-color, #999999)'
                    : 'var(--tg-theme-button-text-color, #ffffff)'
                }}
              >
                <span>{t('viewer.next_lesson')}</span>
                <span>→</span>
              </button>
            </div>

            {/* Course Completion */}
            {currentLessonIndex === lessons.length - 1 && (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
                  {t('viewer.course_complete')}
                </h3>
                <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
                  Congratulations on completing this course!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { CourseViewer };
export default CourseViewer;
