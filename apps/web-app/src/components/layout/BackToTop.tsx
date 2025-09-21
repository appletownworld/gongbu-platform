import React, { useState, useEffect } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { scrollToTop } from '@/hooks/useScrollToTop';

/**
 * 📜 Кнопка "Наверх" с автоматическим показом/скрытием
 * 
 * Появляется, когда пользователь прокрутил страницу вниз,
 * и позволяет быстро вернуться наверх.
 * 
 * Особенности:
 * - Показывается только при прокрутке больше чем на 400px
 * - Плавная анимация появления/исчезновения
 * - Плавная прокрутка наверх при клике
 * - Фиксированное позиционирование в правом нижнем углу
 */
const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Отслеживаем прокрутку страницы
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Обработчик клика по кнопке
  const handleClick = () => {
    scrollToTop('smooth');
  };

  return (
    <div
      className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <button
        onClick={handleClick}
        className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Прокрутить наверх"
        title="Наверх"
      >
        <ChevronUpIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default BackToTop;
