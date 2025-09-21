import React, { useState } from 'react';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import tossPaymentsService, { TossPaymentMethod } from '../services/tossPayments';

interface PaymentScreenProps {
  course: {
    id: string;
    title: string;
    price: number;
    description?: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentCancel: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({
  course,
  onPaymentSuccess,
  onPaymentCancel,
}) => {
  const { user } = useTelegramWebApp();
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods] = useState<TossPaymentMethod[]>(
    tossPaymentsService.getAvailablePaymentMethods()
  );

  const handlePayment = async () => {
    if (!user) {
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('사용자 정보를 찾을 수 없습니다.');
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment request
      const paymentResponse = await tossPaymentsService.createCoursePayment({
        courseId: course.id,
        courseName: course.title,
        amount: course.price,
        customerName: `${user.first_name} ${user.last_name || ''}`.trim(),
        customerEmail: user.username ? `${user.username}@telegram.user` : `user${user.id}@telegram.user`,
        customerPhone: undefined, // Telegram doesn't provide phone
      });

      if (paymentResponse.success && paymentResponse.checkout?.url) {
        // Open payment in Telegram
        await tossPaymentsService.openPaymentInTelegram(paymentResponse.checkout.url);
        
        // Handle success
        onPaymentSuccess({
          paymentKey: paymentResponse.paymentKey,
          orderId: paymentResponse.orderId,
          amount: course.price,
          courseId: course.id,
        });
      } else {
        // Handle error
        const errorMessage = paymentResponse.error?.message || '결제 생성에 실패했습니다.';
        tossPaymentsService.handlePaymentFailure(
          paymentResponse.error?.code || 'UNKNOWN_ERROR',
          errorMessage
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      tossPaymentsService.handlePaymentFailure(
        'PAYMENT_ERROR',
        error instanceof Error ? error.message : '결제 중 오류가 발생했습니다.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  return (
    <div className="payment-screen min-h-screen p-4" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPaymentCancel}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
            color: 'var(--tg-theme-text-color, #000000)'
          }}
        >
          ←
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
          💳 결제하기
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Course Info */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
          📚 {course.title}
        </h2>
        {course.description && (
          <p className="text-sm mb-3" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
            {course.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
            결제 금액
          </span>
          <span className="text-xl font-bold" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
            {formatPrice(course.price)}
          </span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
          결제 수단 선택
        </h3>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full p-3 rounded-lg border-2 transition-colors ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{
                backgroundColor: selectedMethod === method.id
                  ? 'var(--tg-theme-secondary-bg-color, #f0f0f0)'
                  : 'var(--tg-theme-bg-color, #ffffff)',
                borderColor: selectedMethod === method.id
                  ? 'var(--tg-theme-button-color, #2481cc)'
                  : 'var(--tg-theme-hint-color, #999999)'
              }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
                    {method.name}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
                    {method.description}
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
        <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
          결제 요약
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>강의명</span>
            <span style={{ color: 'var(--tg-theme-text-color, #000000)' }}>{course.title}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>결제 수단</span>
            <span style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
              {paymentMethods.find(m => m.id === selectedMethod)?.name}
            </span>
          </div>
          <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--tg-theme-hint-color, #999999)' }}>
            <div className="flex justify-between font-semibold">
              <span style={{ color: 'var(--tg-theme-text-color, #000000)' }}>총 결제 금액</span>
              <span className="text-lg" style={{ color: 'var(--tg-theme-button-color, #2481cc)' }}>
                {formatPrice(course.price)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <div className="space-y-3">
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full py-4 px-6 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          style={{
            backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
            color: 'var(--tg-theme-button-text-color, #ffffff)'
          }}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>결제 처리 중...</span>
            </>
          ) : (
            <>
              <span>💳</span>
              <span>{formatPrice(course.price)} 결제하기</span>
            </>
          )}
        </button>

        <button
          onClick={onPaymentCancel}
          className="w-full py-3 px-6 rounded-xl font-medium border transition-colors"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--tg-theme-text-color, #000000)',
            borderColor: 'var(--tg-theme-hint-color, #999999)'
          }}
        >
          취소
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #999999)' }}>
          🔒 안전한 결제를 위해 토스페이먼츠가 제공하는 보안 시스템을 사용합니다
        </p>
      </div>
    </div>
  );
};

export default PaymentScreen;

