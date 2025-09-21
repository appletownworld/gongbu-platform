import { useState, useEffect } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';
import tossPaymentsService from '../services/tossPayments';

interface PaymentHistory {
  id: string;
  courseId: string;
  courseName: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentKey?: string;
  orderId?: string;
  createdAt: string;
  completedAt?: string;
}

interface UsePaymentReturn {
  paymentHistory: PaymentHistory[];
  isProcessing: boolean;
  createPayment: (courseData: {
    courseId: string;
    courseName: string;
    amount: number;
  }) => Promise<boolean>;
  getPaymentHistory: () => PaymentHistory[];
  markPaymentCompleted: (paymentKey: string, orderId: string) => void;
  markPaymentFailed: (orderId: string, error: string) => void;
}

export const usePayment = (): UsePaymentReturn => {
  const { user } = useTelegramWebApp();
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load payment history from localStorage
  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = (): void => {
    try {
      const savedHistory = localStorage.getItem('gongbu_payment_history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setPaymentHistory(history);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const savePaymentHistory = (history: PaymentHistory[]): void => {
    try {
      localStorage.setItem('gongbu_payment_history', JSON.stringify(history));
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error saving payment history:', error);
    }
  };

  const createPayment = async (courseData: {
    courseId: string;
    courseName: string;
    amount: number;
  }): Promise<boolean> => {
    if (!user) {
      console.error('User not authenticated');
      return false;
    }

    setIsProcessing(true);

    try {
      // Create payment request
      const paymentResponse = await tossPaymentsService.createCoursePayment({
        courseId: courseData.courseId,
        courseName: courseData.courseName,
        amount: courseData.amount,
        customerName: `${user.first_name} ${user.last_name || ''}`.trim(),
        customerEmail: user.username ? `${user.username}@telegram.user` : `user${user.id}@telegram.user`,
        customerPhone: undefined,
      });

      if (paymentResponse.success && paymentResponse.checkout?.url) {
        // Add to payment history
        const newPayment: PaymentHistory = {
          id: `payment_${Date.now()}`,
          courseId: courseData.courseId,
          courseName: courseData.courseName,
          amount: courseData.amount,
          status: 'pending',
          paymentKey: paymentResponse.paymentKey,
          orderId: paymentResponse.orderId,
          createdAt: new Date().toISOString(),
        };

        const updatedHistory = [...paymentHistory, newPayment];
        savePaymentHistory(updatedHistory);

        // Open payment in Telegram
        await tossPaymentsService.openPaymentInTelegram(paymentResponse.checkout.url);

        // Show success message
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('결제 페이지로 이동합니다.');
        }

        return true;
      } else {
        // Handle error
        const errorMessage = paymentResponse.error?.message || '결제 생성에 실패했습니다.';
        tossPaymentsService.handlePaymentFailure(
          paymentResponse.error?.code || 'UNKNOWN_ERROR',
          errorMessage
        );
        return false;
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      tossPaymentsService.handlePaymentFailure(
        'PAYMENT_ERROR',
        error instanceof Error ? error.message : '결제 중 오류가 발생했습니다.'
      );
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentHistory = (): PaymentHistory[] => {
    return paymentHistory;
  };

  const markPaymentCompleted = (paymentKey: string, orderId: string): void => {
    const updatedHistory = paymentHistory.map(payment => {
      if (payment.paymentKey === paymentKey || payment.orderId === orderId) {
        return {
          ...payment,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        };
      }
      return payment;
    });

    savePaymentHistory(updatedHistory);

    // Show success message
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert('결제가 성공적으로 완료되었습니다!');
    }

    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const markPaymentFailed = (orderId: string, error: string): void => {
    const updatedHistory = paymentHistory.map(payment => {
      if (payment.orderId === orderId) {
        return {
          ...payment,
          status: 'failed' as const,
        };
      }
      return payment;
    });

    savePaymentHistory(updatedHistory);

    // Show error message
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(`결제 실패: ${error}`);
    }

    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
  };

  return {
    paymentHistory,
    isProcessing,
    createPayment,
    getPaymentHistory,
    markPaymentCompleted,
    markPaymentFailed,
  };
};

