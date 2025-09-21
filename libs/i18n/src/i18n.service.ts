import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SupportedLanguage = 'en' | 'ko' | 'ru';
export type TranslationKey = string;

@Injectable()
export class I18nService {
  private translations: Record<SupportedLanguage, Record<TranslationKey, string>> = {
    en: {},
    ko: {},
    ru: {}
  };

  constructor(private configService: ConfigService) {
    this.loadTranslations();
  }

  private loadTranslations() {
    // Load English translations
    this.translations.en = {
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
      
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'auth.register': 'Register',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirm_password': 'Confirm Password',
      'auth.forgot_password': 'Forgot Password?',
      'auth.remember_me': 'Remember Me',
      
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
      
      'lesson.title': 'Lesson',
      'lesson.create': 'Create Lesson',
      'lesson.edit': 'Edit Lesson',
      'lesson.delete': 'Delete Lesson',
      'lesson.content': 'Content',
      'lesson.video': 'Video',
      'lesson.audio': 'Audio',
      'lesson.quiz': 'Quiz',
      'lesson.assignment': 'Assignment',
      
      'review.title': 'Review',
      'review.create': 'Write Review',
      'review.edit': 'Edit Review',
      'review.delete': 'Delete Review',
      'review.rating': 'Rating',
      'review.comment': 'Comment',
      'review.helpful': 'Helpful',
      'review.not_helpful': 'Not Helpful',
      
      'comment.title': 'Comment',
      'comment.create': 'Add Comment',
      'comment.edit': 'Edit Comment',
      'comment.delete': 'Delete Comment',
      'comment.reply': 'Reply',
      'comment.like': 'Like',
      
      'user.profile': 'Profile',
      'user.settings': 'Settings',
      'user.courses': 'My Courses',
      'user.followers': 'Followers',
      'user.following': 'Following',
      'user.follow': 'Follow',
      'user.unfollow': 'Unfollow',
      
      'error.not_found': 'Not Found',
      'error.unauthorized': 'Unauthorized',
      'error.forbidden': 'Forbidden',
      'error.bad_request': 'Bad Request',
      'error.server_error': 'Server Error',
      'error.network_error': 'Network Error',
      'error.validation_error': 'Validation Error'
    };

    // Load Korean translations
    this.translations.ko = {
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
      
      'auth.login': '로그인',
      'auth.logout': '로그아웃',
      'auth.register': '회원가입',
      'auth.email': '이메일',
      'auth.password': '비밀번호',
      'auth.confirm_password': '비밀번호 확인',
      'auth.forgot_password': '비밀번호를 잊으셨나요?',
      'auth.remember_me': '로그인 상태 유지',
      
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
      
      'lesson.title': '강의',
      'lesson.create': '강의 만들기',
      'lesson.edit': '강의 편집',
      'lesson.delete': '강의 삭제',
      'lesson.content': '내용',
      'lesson.video': '비디오',
      'lesson.audio': '오디오',
      'lesson.quiz': '퀴즈',
      'lesson.assignment': '과제',
      
      'review.title': '리뷰',
      'review.create': '리뷰 작성',
      'review.edit': '리뷰 편집',
      'review.delete': '리뷰 삭제',
      'review.rating': '평점',
      'review.comment': '댓글',
      'review.helpful': '도움됨',
      'review.not_helpful': '도움 안됨',
      
      'comment.title': '댓글',
      'comment.create': '댓글 추가',
      'comment.edit': '댓글 편집',
      'comment.delete': '댓글 삭제',
      'comment.reply': '답글',
      'comment.like': '좋아요',
      
      'user.profile': '프로필',
      'user.settings': '설정',
      'user.courses': '내 강의',
      'user.followers': '팔로워',
      'user.following': '팔로잉',
      'user.follow': '팔로우',
      'user.unfollow': '언팔로우',
      
      'error.not_found': '찾을 수 없음',
      'error.unauthorized': '인증되지 않음',
      'error.forbidden': '접근 금지',
      'error.bad_request': '잘못된 요청',
      'error.server_error': '서버 오류',
      'error.network_error': '네트워크 오류',
      'error.validation_error': '유효성 검사 오류'
    };

    // Load Russian translations
    this.translations.ru = {
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
      
      'auth.login': 'Войти',
      'auth.logout': 'Выйти',
      'auth.register': 'Регистрация',
      'auth.email': 'Email',
      'auth.password': 'Пароль',
      'auth.confirm_password': 'Подтвердите пароль',
      'auth.forgot_password': 'Забыли пароль?',
      'auth.remember_me': 'Запомнить меня',
      
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
      
      'lesson.title': 'Урок',
      'lesson.create': 'Создать урок',
      'lesson.edit': 'Редактировать урок',
      'lesson.delete': 'Удалить урок',
      'lesson.content': 'Содержание',
      'lesson.video': 'Видео',
      'lesson.audio': 'Аудио',
      'lesson.quiz': 'Викторина',
      'lesson.assignment': 'Задание',
      
      'review.title': 'Отзыв',
      'review.create': 'Написать отзыв',
      'review.edit': 'Редактировать отзыв',
      'review.delete': 'Удалить отзыв',
      'review.rating': 'Оценка',
      'review.comment': 'Комментарий',
      'review.helpful': 'Полезно',
      'review.not_helpful': 'Не полезно',
      
      'comment.title': 'Комментарий',
      'comment.create': 'Добавить комментарий',
      'comment.edit': 'Редактировать комментарий',
      'comment.delete': 'Удалить комментарий',
      'comment.reply': 'Ответить',
      'comment.like': 'Нравится',
      
      'user.profile': 'Профиль',
      'user.settings': 'Настройки',
      'user.courses': 'Мои курсы',
      'user.followers': 'Подписчики',
      'user.following': 'Подписки',
      'user.follow': 'Подписаться',
      'user.unfollow': 'Отписаться',
      
      'error.not_found': 'Не найдено',
      'error.unauthorized': 'Не авторизован',
      'error.forbidden': 'Доступ запрещен',
      'error.bad_request': 'Неверный запрос',
      'error.server_error': 'Ошибка сервера',
      'error.network_error': 'Ошибка сети',
      'error.validation_error': 'Ошибка валидации'
    };
  }

  translate(key: TranslationKey, language: SupportedLanguage = 'en', params?: Record<string, any>): string {
    const translation = this.translations[language]?.[key] || this.translations.en[key] || key;
    
    if (params) {
      return this.interpolate(translation, params);
    }
    
    return translation;
  }

  private interpolate(text: string, params: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return ['en', 'ko', 'ru'];
  }

  getDefaultLanguage(): SupportedLanguage {
    return this.configService.get<string>('DEFAULT_LANGUAGE', 'en') as SupportedLanguage;
  }

  isValidLanguage(language: string): language is SupportedLanguage {
    return this.getSupportedLanguages().includes(language as SupportedLanguage);
  }
}
