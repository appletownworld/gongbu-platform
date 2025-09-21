import { useState, useEffect, useCallback } from 'react';

export type SupportedLanguage = 'en' | 'ko' | 'ru';

interface UseI18nReturn {
  t: (key: string, params?: Record<string, any>) => string;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  supportedLanguages: SupportedLanguage[];
  isLoading: boolean;
}

export const useI18n = (): UseI18nReturn => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isLoading] = useState(false);

  // Load language from localStorage or Telegram user language
  useEffect(() => {
    const initializeLanguage = () => {
      // Try to get saved language from localStorage
      const savedLanguage = localStorage.getItem('gongbu_language') as SupportedLanguage;
      
      if (savedLanguage && ['en', 'ko', 'ru'].includes(savedLanguage)) {
        setLanguageState(savedLanguage);
        return;
      }

      // Try to get language from Telegram WebApp
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
        const telegramLang = window.Telegram.WebApp.initDataUnsafe.user.language_code;
        const supportedLang = telegramLang.split('-')[0] as SupportedLanguage;
        
        if (['en', 'ko', 'ru'].includes(supportedLang)) {
          setLanguageState(supportedLang);
          localStorage.setItem('gongbu_language', supportedLang);
          return;
        }
      }

      // Fallback to browser language
      const browserLanguage = navigator.language.split('-')[0] as SupportedLanguage;
      if (['en', 'ko', 'ru'].includes(browserLanguage)) {
        setLanguageState(browserLanguage);
        localStorage.setItem('gongbu_language', browserLanguage);
        return;
      }

      // Default to English
      setLanguageState('en');
      localStorage.setItem('gongbu_language', 'en');
    };

    initializeLanguage();
  }, []);

  const setLanguage = useCallback((newLanguage: SupportedLanguage) => {
    setLanguageState(newLanguage);
    localStorage.setItem('gongbu_language', newLanguage);
    
    // Update document language
    document.documentElement.lang = newLanguage;
    
    // Set document direction (all supported languages are LTR)
    document.documentElement.dir = 'ltr';

    // Notify Telegram WebApp about language change
    if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, any>): string => {
    const translations: Record<SupportedLanguage, Record<string, string>> = {
      en: {
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.create': 'Create',
        'common.search': 'Search',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.confirm': 'Confirm',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.language': 'Language',
        'common.settings': 'Settings',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'common.finish': 'Finish',
        'common.close': 'Close',
        
        'auth.login': 'Login',
        'auth.logout': 'Logout',
        'auth.register': 'Register',
        'auth.welcome': 'Welcome to Gongbu!',
        'auth.login_with_telegram': 'Login with Telegram',
        'auth.login_success': 'Successfully logged in!',
        
        'course.title': 'Course',
        'course.create': 'Create Course',
        'course.edit': 'Edit Course',
        'course.delete': 'Delete Course',
        'course.publish': 'Publish Course',
        'course.unpublish': 'Unpublish Course',
        'course.lessons': 'Lessons',
        'course.students': 'Students',
        'course.reviews': 'Reviews',
        'course.rating': 'Rating',
        'course.difficulty': 'Difficulty',
        'course.duration': 'Duration',
        'course.price': 'Price',
        'course.free': 'Free',
        'course.premium': 'Premium',
        'course.my_courses': 'My Courses',
        'course.create_new': 'Create New Course',
        'course.no_courses': 'No courses yet',
        'course.start_learning': 'Start Learning',
        'course.continue_learning': 'Continue Learning',
        
        'lesson.title': 'Lesson',
        'lesson.create': 'Create Lesson',
        'lesson.edit': 'Edit Lesson',
        'lesson.delete': 'Delete Lesson',
        'lesson.content': 'Content',
        'lesson.video': 'Video',
        'lesson.audio': 'Audio',
        'lesson.quiz': 'Quiz',
        'lesson.assignment': 'Assignment',
        'lesson.completed': 'Completed',
        'lesson.in_progress': 'In Progress',
        'lesson.not_started': 'Not Started',
        'lesson.mark_complete': 'Mark as Complete',
        
        'editor.title': 'Course Editor',
        'editor.add_lesson': 'Add Lesson',
        'editor.add_content': 'Add Content',
        'editor.preview': 'Preview',
        'editor.save_draft': 'Save Draft',
        'editor.publish': 'Publish',
        'editor.lesson_title': 'Lesson Title',
        'editor.lesson_content': 'Lesson Content',
        
        'viewer.welcome': 'Welcome to the course!',
        'viewer.lesson_complete': 'Lesson completed!',
        'viewer.course_complete': 'Congratulations! Course completed!',
        'viewer.next_lesson': 'Next Lesson',
        'viewer.previous_lesson': 'Previous Lesson',
        'viewer.course_progress': 'Course Progress',
        
        'error.not_found': 'Not Found',
        'error.unauthorized': 'Unauthorized',
        'error.network_error': 'Network Error',
        'error.loading_failed': 'Failed to load data',
        'error.save_failed': 'Failed to save data',
        'error.try_again': 'Try Again'
      },
      ko: {
        'common.save': '저장',
        'common.cancel': '취소',
        'common.delete': '삭제',
        'common.edit': '편집',
        'common.create': '생성',
        'common.search': '검색',
        'common.loading': '로딩 중...',
        'common.error': '오류',
        'common.success': '성공',
        'common.confirm': '확인',
        'common.yes': '예',
        'common.no': '아니오',
        'common.language': '언어',
        'common.settings': '설정',
        'common.back': '뒤로',
        'common.next': '다음',
        'common.previous': '이전',
        'common.finish': '완료',
        'common.close': '닫기',
        
        'auth.login': '로그인',
        'auth.logout': '로그아웃',
        'auth.register': '회원가입',
        'auth.welcome': 'Gongbu에 오신 것을 환영합니다!',
        'auth.login_with_telegram': 'Telegram으로 로그인',
        'auth.login_success': '성공적으로 로그인했습니다!',
        
        'course.title': '강의',
        'course.create': '강의 만들기',
        'course.edit': '강의 편집',
        'course.delete': '강의 삭제',
        'course.publish': '강의 발행',
        'course.unpublish': '강의 발행 취소',
        'course.lessons': '강의',
        'course.students': '학생',
        'course.reviews': '리뷰',
        'course.rating': '평점',
        'course.difficulty': '난이도',
        'course.duration': '소요 시간',
        'course.price': '가격',
        'course.free': '무료',
        'course.premium': '프리미엄',
        'course.my_courses': '내 강의',
        'course.create_new': '새 강의 만들기',
        'course.no_courses': '아직 강의가 없습니다',
        'course.start_learning': '학습 시작',
        'course.continue_learning': '학습 계속하기',
        
        'lesson.title': '강의',
        'lesson.create': '강의 만들기',
        'lesson.edit': '강의 편집',
        'lesson.delete': '강의 삭제',
        'lesson.content': '내용',
        'lesson.video': '비디오',
        'lesson.audio': '오디오',
        'lesson.quiz': '퀴즈',
        'lesson.assignment': '과제',
        'lesson.completed': '완료됨',
        'lesson.in_progress': '진행 중',
        'lesson.not_started': '시작 안함',
        'lesson.mark_complete': '완료로 표시',
        
        'editor.title': '강의 편집기',
        'editor.add_lesson': '강의 추가',
        'editor.add_content': '내용 추가',
        'editor.preview': '미리보기',
        'editor.save_draft': '초안 저장',
        'editor.publish': '발행',
        'editor.lesson_title': '강의 제목',
        'editor.lesson_content': '강의 내용',
        
        'viewer.welcome': '강의에 오신 것을 환영합니다!',
        'viewer.lesson_complete': '강의를 완료했습니다!',
        'viewer.course_complete': '축하합니다! 강의를 완료했습니다!',
        'viewer.next_lesson': '다음 강의',
        'viewer.previous_lesson': '이전 강의',
        'viewer.course_progress': '강의 진행률',
        
        'error.not_found': '찾을 수 없음',
        'error.unauthorized': '인증되지 않음',
        'error.network_error': '네트워크 오류',
        'error.loading_failed': '데이터 로드 실패',
        'error.save_failed': '데이터 저장 실패',
        'error.try_again': '다시 시도'
      },
      ru: {
        'common.save': 'Сохранить',
        'common.cancel': 'Отмена',
        'common.delete': 'Удалить',
        'common.edit': 'Редактировать',
        'common.create': 'Создать',
        'common.search': 'Поиск',
        'common.loading': 'Загрузка...',
        'common.error': 'Ошибка',
        'common.success': 'Успешно',
        'common.confirm': 'Подтвердить',
        'common.yes': 'Да',
        'common.no': 'Нет',
        'common.language': 'Язык',
        'common.settings': 'Настройки',
        'common.back': 'Назад',
        'common.next': 'Далее',
        'common.previous': 'Предыдущий',
        'common.finish': 'Завершить',
        'common.close': 'Закрыть',
        
        'auth.login': 'Войти',
        'auth.logout': 'Выйти',
        'auth.register': 'Регистрация',
        'auth.welcome': 'Добро пожаловать в Gongbu!',
        'auth.login_with_telegram': 'Войти через Telegram',
        'auth.login_success': 'Успешно вошли в систему!',
        
        'course.title': 'Курс',
        'course.create': 'Создать курс',
        'course.edit': 'Редактировать курс',
        'course.delete': 'Удалить курс',
        'course.publish': 'Опубликовать курс',
        'course.unpublish': 'Снять с публикации',
        'course.lessons': 'Уроки',
        'course.students': 'Студенты',
        'course.reviews': 'Отзывы',
        'course.rating': 'Рейтинг',
        'course.difficulty': 'Сложность',
        'course.duration': 'Длительность',
        'course.price': 'Цена',
        'course.free': 'Бесплатно',
        'course.premium': 'Премиум',
        'course.my_courses': 'Мои курсы',
        'course.create_new': 'Создать новый курс',
        'course.no_courses': 'Пока нет курсов',
        'course.start_learning': 'Начать обучение',
        'course.continue_learning': 'Продолжить обучение',
        
        'lesson.title': 'Урок',
        'lesson.create': 'Создать урок',
        'lesson.edit': 'Редактировать урок',
        'lesson.delete': 'Удалить урок',
        'lesson.content': 'Содержание',
        'lesson.video': 'Видео',
        'lesson.audio': 'Аудио',
        'lesson.quiz': 'Викторина',
        'lesson.assignment': 'Задание',
        'lesson.completed': 'Завершено',
        'lesson.in_progress': 'В процессе',
        'lesson.not_started': 'Не начато',
        'lesson.mark_complete': 'Отметить как завершенное',
        
        'editor.title': 'Редактор курса',
        'editor.add_lesson': 'Добавить урок',
        'editor.add_content': 'Добавить содержание',
        'editor.preview': 'Предпросмотр',
        'editor.save_draft': 'Сохранить черновик',
        'editor.publish': 'Опубликовать',
        'editor.lesson_title': 'Название урока',
        'editor.lesson_content': 'Содержание урока',
        
        'viewer.welcome': 'Добро пожаловать на курс!',
        'viewer.lesson_complete': 'Урок завершен!',
        'viewer.course_complete': 'Поздравляем! Курс завершен!',
        'viewer.next_lesson': 'Следующий урок',
        'viewer.previous_lesson': 'Предыдущий урок',
        'viewer.course_progress': 'Прогресс курса',
        
        'error.not_found': 'Не найдено',
        'error.unauthorized': 'Не авторизован',
        'error.network_error': 'Ошибка сети',
        'error.loading_failed': 'Не удалось загрузить данные',
        'error.save_failed': 'Не удалось сохранить данные',
        'error.try_again': 'Попробовать снова'
      }
    };

    const translation = translations[language]?.[key] || translations.en[key] || key;
    
    if (params) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }
    
    return translation;
  }, [language]);

  return {
    t,
    language,
    setLanguage,
    supportedLanguages: ['en', 'ko', 'ru'],
    isLoading
  };
};
