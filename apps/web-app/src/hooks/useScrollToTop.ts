import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 📜 Хук для автоматической прокрутки наверх
 * 
 * Обеспечивает лучший UX при навигации между страницами
 * 
 * @param smooth - использовать плавную прокрутку (по умолчанию true)
 * @param delay - задержка перед прокруткой в мс (по умолчанию 0)
 * @param excludePaths - пути, для которых не нужна автопрокрутка
 */
export const useScrollToTop = (
  smooth: boolean = true,
  delay: number = 0,
  excludePaths: string[] = []
) => {
  const location = useLocation();

  useEffect(() => {
    // Проверяем, нужно ли исключить текущий путь
    if (excludePaths.some(path => location.pathname.startsWith(path))) {
      return;
    }

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    };

    if (delay > 0) {
      const timeoutId = setTimeout(scrollToTop, delay);
      return () => clearTimeout(timeoutId);
    } else {
      scrollToTop();
    }
  }, [location.pathname, smooth, delay, excludePaths]);
};

/**
 * 📜 Утилитная функция для прокрутки к элементу
 * 
 * @param elementId - ID элемента для прокрутки
 * @param behavior - тип анимации ('smooth' | 'auto')
 * @param offset - отступ от элемента в пикселях
 */
export const scrollToElement = (
  elementId: string, 
  behavior: ScrollBehavior = 'smooth',
  offset: number = 0
) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: elementTop - offset,
      behavior
    });
  }
};

/**
 * 📜 Утилитная функция для прокрутки наверх
 * 
 * @param behavior - тип анимации ('smooth' | 'auto')  
 */
export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior
  });
};
