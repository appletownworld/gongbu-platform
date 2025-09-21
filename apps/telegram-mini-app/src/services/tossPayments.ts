// Toss Payments Integration for Telegram Mini App
export interface TossPaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobilePhone?: string;
  successUrl: string;
  failUrl: string;
  validHours?: number;
  discountCode?: string;
}

export interface TossPaymentResponse {
  success: boolean;
  paymentKey?: string;
  orderId?: string;
  orderName?: string;
  status?: string;
  requestedAt?: string;
  approvedAt?: string;
  useEscrow?: boolean;
  lastTransactionKey?: string;
  receipt?: {
    url: string;
  };
  checkout?: {
    url: string;
  };
  cancels?: any[];
  secret?: string;
  type?: string;
  easyPay?: any;
  country?: string;
  failure?: {
    code: string;
    message: string;
  };
  totalAmount?: number;
  balanceAmount?: number;
  suppliedAmount?: number;
  vat?: number;
  taxFreeAmount?: number;
  taxExemptionAmount?: number;
  method?: string;
  currency?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface TossPaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

// Test configuration for Toss Payments
const TOSS_CONFIG = {
  // Test API Key (replace with your actual test key)
  testApiKey: 'test_sk_dummy_test_key_for_development',
  baseUrl: 'https://api.tosspayments.com',
  testBaseUrl: 'https://api.tosspayments.com',
  // Test merchant ID
  testMerchantId: 'test_merchant_id',
  // Test success/fail URLs
  testSuccessUrl: 'https://gongbu.app/payment/success',
  testFailUrl: 'https://gongbu.app/payment/fail',
};

class TossPaymentsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Use test configuration
    this.apiKey = TOSS_CONFIG.testApiKey;
    this.baseUrl = TOSS_CONFIG.testBaseUrl;
  }

  /**
   * Create a payment request
   */
  async createPayment(paymentData: TossPaymentRequest): Promise<TossPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          successUrl: TOSS_CONFIG.testSuccessUrl,
          failUrl: TOSS_CONFIG.testFailUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Toss Payments API Error: ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('Toss Payments Error:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Payment creation failed',
        },
      };
    }
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): TossPaymentMethod[] {
    return [
      {
        id: 'card',
        name: '카드',
        icon: '💳',
        description: '신용카드/체크카드',
        enabled: true,
      },
      {
        id: 'virtual_account',
        name: '가상계좌',
        icon: '🏦',
        description: '가상계좌 입금',
        enabled: true,
      },
      {
        id: 'bank_transfer',
        name: '계좌이체',
        icon: '💰',
        description: '실시간 계좌이체',
        enabled: true,
      },
      {
        id: 'mobile',
        name: '휴대폰',
        icon: '📱',
        description: '휴대폰 소액결제',
        enabled: true,
      },
      {
        id: 'gift_certificate',
        name: '상품권',
        icon: '🎁',
        description: '문화상품권/도서상품권',
        enabled: true,
      },
      {
        id: 'easy_pay',
        name: '간편결제',
        icon: '⚡',
        description: '토스페이/카카오페이/페이코',
        enabled: true,
      },
    ];
  }

  /**
   * Create payment for course purchase
   */
  async createCoursePayment(courseData: {
    courseId: string;
    courseName: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
  }): Promise<TossPaymentResponse> {
    const orderId = `gongbu_${courseData.courseId}_${Date.now()}`;
    
    return this.createPayment({
      orderId,
      orderName: courseData.courseName,
      amount: courseData.amount,
      customerName: courseData.customerName,
      customerEmail: courseData.customerEmail,
      customerMobilePhone: courseData.customerPhone,
      successUrl: TOSS_CONFIG.testSuccessUrl,
      failUrl: TOSS_CONFIG.testFailUrl,
      validHours: 24, // 24 hours validity
    });
  }

  /**
   * Open payment in Telegram WebApp
   */
  async openPaymentInTelegram(paymentUrl: string): Promise<void> {
    if (window.Telegram?.WebApp?.openLink) {
      // Open payment URL in Telegram's built-in browser
      window.Telegram.WebApp.openLink(paymentUrl, { try_instant_view: false });
    } else {
      // Fallback: open in new window
      window.open(paymentUrl, '_blank');
    }
  }

  /**
   * Handle payment success callback
   */
  handlePaymentSuccess(paymentKey: string, orderId: string, amount: number): void {
    // Show success message
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert('결제가 성공적으로 완료되었습니다!');
    }

    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // Log payment success
    console.log('Payment Success:', { paymentKey, orderId, amount });
  }

  /**
   * Handle payment failure callback
   */
  handlePaymentFailure(errorCode: string, errorMessage: string): void {
    // Show error message
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(`결제 실패: ${errorMessage}`);
    }

    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }

    // Log payment failure
    console.error('Payment Failure:', { errorCode, errorMessage });
  }
}

// Export singleton instance
export const tossPaymentsService = new TossPaymentsService();

// Export types and service
export default tossPaymentsService;

