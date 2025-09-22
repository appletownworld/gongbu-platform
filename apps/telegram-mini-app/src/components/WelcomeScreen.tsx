import React from 'react';
import { useI18n } from '../hooks/useI18n';

interface WelcomeScreenProps {
  user: any;
  isNewUser: boolean;
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, isNewUser, onContinue }) => {
  const { t, language } = useI18n();

  const getWelcomeMessage = () => {
    if (isNewUser) {
      return {
        title: language === 'ko' ? '🎉 공부에 오신 것을 환영합니다!' :
               language === 'ru' ? '🎉 Добро пожаловать в Gongbu!' :
               '🎉 Welcome to Gongbu!',
        subtitle: language === 'ko' ? `안녕하세요 ${user?.first_name || 'Student'}님! 함께 학습을 시작해볼까요?` :
                  language === 'ru' ? `Привет, ${user?.first_name || 'Student'}! Давайте начнем ваше обучение!` :
                  `Hi ${user?.first_name || 'Student'}! Let's start your learning journey!`,
        description: language === 'ko' ? '🌟 Gongbu는 한국어와 프로그래밍을 배울 수 있는 현대적인 교육 플랫폼입니다.' :
                     language === 'ru' ? '🌟 Gongbu - это современная образовательная платформа для изучения корейского языка и программирования.' :
                     '🌟 Gongbu is a modern educational platform for learning Korean and programming.',
        features: language === 'ko' ? [
          '🇰🇷 한국어 기초부터 고급까지',
          '🐍 Python 프로그래밍',
          '📱 텔레그램에서 바로 학습',
          '💳 안전한 결제 시스템',
          '🌍 다국어 지원 (EN/KO/RU)'
        ] : language === 'ru' ? [
          '🇰🇷 Корейский язык с нуля до продвинутого',
          '🐍 Программирование на Python',
          '📱 Обучение прямо в Telegram',
          '💳 Безопасная платежная система',
          '🌍 Поддержка многих языков (EN/KO/RU)'
        ] : [
          '🇰🇷 Korean language from basics to advanced',
          '🐍 Python programming',
          '📱 Learning directly in Telegram',
          '💳 Secure payment system',
          '🌍 Multi-language support (EN/KO/RU)'
        ],
        buttonText: language === 'ko' ? '시작하기' :
                    language === 'ru' ? 'Начать обучение' :
                    'Start Learning'
      };
    } else {
      return {
        title: language === 'ko' ? '👋 다시 오신 것을 환영합니다!' :
               language === 'ru' ? '👋 С возвращением!' :
               '👋 Welcome back!',
        subtitle: language === 'ko' ? `${user?.first_name || 'Student'}님, 학습을 계속해보세요!` :
                  language === 'ru' ? `${user?.first_name || 'Student'}, продолжайте обучение!` :
                  `${user?.first_name || 'Student'}, continue your learning!`,
        description: language === 'ko' ? '📚 지난 번에 중단한 곳부터 계속 학습하실 수 있습니다.' :
                     language === 'ru' ? '📚 Вы можете продолжить обучение с того места, где остановились.' :
                     '📚 You can continue learning from where you left off.',
        features: language === 'ko' ? [
          '✅ 완료한 강의 수: ' + (user?.coursesCompleted || 0),
          '📅 마지막 방문: ' + new Date(user?.lastLoginAt || Date.now()).toLocaleDateString(language === 'ko' ? 'ko-KR' : language === 'ru' ? 'ru-RU' : 'en-US'),
          '🎯 계속해서 새로운 기술을 배워보세요',
          '🌟 업데이트된 강의 내용을 확인해보세요'
        ] : language === 'ru' ? [
          '✅ Завершено курсов: ' + (user?.coursesCompleted || 0),
          '📅 Последний визит: ' + new Date(user?.lastLoginAt || Date.now()).toLocaleDateString('ru-RU'),
          '🎯 Продолжайте изучать новые навыки',
          '🌟 Проверьте обновленное содержание курсов'
        ] : [
          '✅ Courses completed: ' + (user?.coursesCompleted || 0),
          '📅 Last visit: ' + new Date(user?.lastLoginAt || Date.now()).toLocaleDateString('en-US'),
          '🎯 Continue learning new skills',
          '🌟 Check out updated course content'
        ],
        buttonText: language === 'ko' ? '계속하기' :
                    language === 'ru' ? 'Продолжить' :
                    'Continue'
      };
    }
  };

  const welcome = getWelcomeMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {welcome.title}
          </h1>
          <p className="text-lg text-gray-600">
            {welcome.subtitle}
          </p>
        </div>

        {/* User Info */}
        {user?.username && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user.first_name?.charAt(0)?.toUpperCase() || '👤'}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {user.first_name} {user.last_name || ''}
                </p>
                <p className="text-sm text-gray-500">
                  @{user.username}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 mb-6">
          {welcome.description}
        </p>

        {/* Features */}
        <div className="mb-8 space-y-3">
          {welcome.features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">{feature.split(' ')[0]}</span>
              <span className="text-gray-700 flex-1">
                {feature.split(' ').slice(1).join(' ')}
              </span>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg"
        >
          {welcome.buttonText}
        </button>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {isNewUser ? '🎁' : '🏠'} 
            {language === 'ko' ? ' Gongbu와 함께 성장하세요' :
             language === 'ru' ? ' Растите вместе с Gongbu' :
             ' Grow with Gongbu'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
