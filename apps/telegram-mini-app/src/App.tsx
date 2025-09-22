import React, { useState, useEffect } from 'react';
import { WebApp } from '@twa-dev/types';
import { CourseEditor } from './components/CourseEditor';
import { CourseViewer } from './components/CourseViewer';
import { LoadingScreen } from './components/LoadingScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import SettingsScreen from './components/SettingsScreen';
import LanguageSelector from './components/LanguageSelector';
import PaymentScreen from './components/PaymentScreen';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { useAuth } from './hooks/useAuth';
import { useCourses } from './hooks/useCourses';
import { useI18n } from './hooks/useI18n';
import { usePayment } from './hooks/usePayment';
import './App.css';

// Инициализация Telegram WebApp
declare global {
  interface Window {
    Telegram: {
      WebApp: WebApp;
    };
  }
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'main' | 'settings' | 'payment'>('main');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [paymentCourse, setPaymentCourse] = useState<any>(null);
  
  const { webApp, isReady } = useTelegramWebApp();
  const { user, isAuthenticated, login } = useAuth();
  const { courses, currentCourse, setCurrentCourse, createCourse, updateCourse } = useCourses();
  const { markPaymentCompleted } = usePayment();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Инициализация Telegram WebApp
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
          
          // Настройка темы
          const theme = window.Telegram.WebApp.themeParams;
          document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color || '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color || '#000000');
          document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color || '#999999');
          document.documentElement.style.setProperty('--tg-theme-link-color', theme.link_color || '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color || '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color || '#ffffff');
        }

        // Проверка аутентификации
        if (webApp?.initData) {
          console.log('🔄 Начинаем автоматическую аутентификацию...');
          await login(webApp.initData);
          
          // Check URL parameters for direct navigation
          const urlParams = new URLSearchParams(window.location.search);
          const action = urlParams.get('action');
          
          // Check if we should show welcome screen
          const userData = JSON.parse(localStorage.getItem('gongbu_user') || '{}');
          
          if (action === 'my_courses' || action === 'courses') {
            // Direct navigation to courses - skip welcome screen
            console.log('🎯 Прямой переход к курсам - пропускаем Welcome Screen');
            setShowWelcome(false);
            setCurrentScreen('main');
          } else if (userData && !welcomeShown) {
            console.log('👋 Показываем Welcome Screen для пользователя:', userData.first_name);
            setShowWelcome(true);
            setWelcomeShown(true);
          } else {
            console.log('🏠 Переход к главному экрану');
            setCurrentScreen('main');
          }
        } else {
          console.warn('⚠️ WebApp initData недоступен - возможно тестируется в браузере');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Ошибка инициализации:', err);
        setError('Ошибка инициализации приложения');
        setIsLoading(false);
      }
    };

    if (isReady) {
      initializeApp();
    }
  }, [isReady, webApp, login]);

  // Обработка команд от Telegram
  useEffect(() => {
    if (!webApp) return;

    const handleCommand = (command: string) => {
      switch (command) {
        case 'create_course':
          setCurrentCourse(null);
          break;
        case 'edit_course':
          // Получаем ID курса из параметров
          const courseId = (webApp as any).startParam;
          if (courseId) {
            const course = courses.find(c => c.id === courseId);
            if (course) {
              setCurrentCourse(course);
            }
          }
          break;
        case 'view_course':
          // Режим просмотра курса
          const viewCourseId = (webApp as any).startParam;
          if (viewCourseId) {
            const course = courses.find(c => c.id === viewCourseId);
            if (course) {
              setCurrentCourse(course);
            }
          }
          break;
      }
    };

    // Слушаем команды от Telegram
    webApp.onEvent('mainButtonClicked', () => {
      // Обработка нажатия главной кнопки
      console.log('Main button clicked');
    });

    webApp.onEvent('backButtonClicked', () => {
      // Обработка нажатия кнопки "Назад"
      console.log('Back button clicked');
    });

    // Обработка стартового параметра
    if ((webApp as any).startParam) {
      handleCommand((webApp as any).startParam);
    }
  }, [webApp, courses, setCurrentCourse]);

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorBoundary error={error} onRetry={() => window.location.reload()} />
    );
  }

  // Определяем режим работы приложения
  const isEditMode = (webApp as any)?.startParam === 'create_course' || (webApp as any)?.startParam?.startsWith('edit_');
  const isViewMode = (webApp as any)?.startParam?.startsWith('view_');

  return (
    <div className="telegram-mini-app">
      <ErrorBoundary>
        {showWelcome && user ? (
          <WelcomeScreen
            user={user}
            isNewUser={user.isNewUser || false}
            onContinue={() => {
              setShowWelcome(false);
              setCurrentScreen('main');
            }}
          />
        ) : currentScreen === 'settings' ? (
          <SettingsScreen onBack={() => setCurrentScreen('main')} />
        ) : currentScreen === 'payment' && paymentCourse ? (
          <PaymentScreen
            course={paymentCourse}
            onPaymentSuccess={(paymentData) => {
              markPaymentCompleted(paymentData.paymentKey, paymentData.orderId);
              setCurrentScreen('main');
              setPaymentCourse(null);
            }}
            onPaymentCancel={() => {
              setCurrentScreen('main');
              setPaymentCourse(null);
            }}
          />
        ) : isEditMode ? (
          <CourseEditor
            course={currentCourse}
            onSave={async (courseId: string, updates: any) => {
              await updateCourse(courseId, updates);
            }}
            onCreate={createCourse}
            onCancel={() => setCurrentCourse(null)}
          />
        ) : isViewMode ? (
          <CourseViewer
            course={currentCourse}
            onEdit={() => setCurrentCourse(currentCourse)}
          />
        ) : (
          <CourseList
            courses={courses}
            onSelectCourse={setCurrentCourse}
            onCreateCourse={() => setCurrentCourse(null)}
            onOpenSettings={() => setCurrentScreen('settings')}
            onPurchaseCourse={(course) => {
              setPaymentCourse(course);
              setCurrentScreen('payment');
            }}
            user={user}
          />
        )}
      </ErrorBoundary>
    </div>
  );
};

// Компонент списка курсов
const CourseList: React.FC<{
  courses: any[];
  onSelectCourse: (course: any) => void;
  onCreateCourse: () => void;
  onOpenSettings: () => void;
  onPurchaseCourse: (course: any) => void;
  user: any;
}> = ({ courses, onSelectCourse, onCreateCourse, onOpenSettings, onPurchaseCourse, user }) => {
  const { t } = useI18n();

  return (
    <div className="course-list min-h-screen" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
      {/* Header with Settings Button */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            📚 {t('course.my_courses')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
            {t('auth.welcome')} {user?.first_name}!
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <LanguageSelector compact={true} />
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ 
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
              color: 'var(--tg-theme-text-color, #000000)'
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Courses List */}
      <div className="px-4 pb-4">
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
              {t('course.no_courses')}
            </h3>
            <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
              {t('course.create_new')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">
                    📖
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
                      {course.title}
                    </h3>
                    <p className="text-sm truncate mt-1" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
                      {course.description || 'No description'}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
                      <span>👥 {course.studentsCount || 0}</span>
                      <span>📊 {course.completionRate || 0}%</span>
                      {course.price > 0 && (
                        <span className="font-medium" style={{ color: 'var(--tg-theme-button-color, #2481cc)' }}>
                          💰 {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(course.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => onSelectCourse(course)}
                    className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
                      color: 'var(--tg-theme-button-text-color, #ffffff)'
                    }}
                  >
                    📖 보기
                  </button>
                  {course.price > 0 && (
                    <button
                      onClick={() => onPurchaseCourse(course)}
                      className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
                        color: 'var(--tg-theme-text-color, #000000)',
                        border: '1px solid var(--tg-theme-hint-color, #999999)'
                      }}
                    >
                      💳 구매
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Course Button */}
      <div className="p-4">
        <button
          className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
            color: 'var(--tg-theme-button-text-color, #ffffff)'
          }}
          onClick={onCreateCourse}
        >
          ➕ {t('course.create_new')}
        </button>
      </div>
    </div>
  );
};

export default App;
