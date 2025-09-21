import apiClient from './api'
import { 
  PaymentIntent,
  Subscription,
  Refund,
  PricingPlan,
  CoursePurchase,
  CreatePaymentIntentDto,
  CreateSubscriptionDto,
  ProcessTelegramPaymentDto,
  CreateRefundDto,
  PaymentResponse,
  SubscriptionResponse,
  RefundResponse,
  PaymentAnalytics
} from '@/types/payment'

// Payment API
export const paymentApi = {
  // Create payment intent for course purchase
  createPaymentIntent: async (data: CreatePaymentIntentDto): Promise<PaymentResponse> => {
    const response = await apiClient.post<PaymentResponse>('/api/payments/create-intent', data)
    return response.data
  },

  // Confirm payment intent
  confirmPaymentIntent: async (paymentIntentId: string): Promise<PaymentIntent> => {
    const response = await apiClient.post<PaymentIntent>(`/api/payments/${paymentIntentId}/confirm`)
    return response.data
  },

  // Get payment intent by ID
  getPaymentIntent: async (paymentIntentId: string): Promise<PaymentIntent> => {
    const response = await apiClient.get<PaymentIntent>(`/api/payments/${paymentIntentId}`)
    return response.data
  },

  // Get user's payment history
  getPaymentHistory: async (): Promise<CoursePurchase[]> => {
    const response = await apiClient.get<CoursePurchase[]>('/api/payments/history')
    return response.data
  },

  // Process Telegram payment
  processTelegramPayment: async (data: ProcessTelegramPaymentDto): Promise<void> => {
    await apiClient.post('/api/payments/telegram/process', data)
  },

  // Get Telegram payment info
  getTelegramPaymentInfo: async (courseId: string): Promise<any> => {
    const response = await apiClient.get(`/api/payments/telegram/info/${courseId}`)
    return response.data
  },
}

// Subscription API
export const subscriptionApi = {
  // Get available pricing plans
  getPricingPlans: async (): Promise<PricingPlan[]> => {
    const response = await apiClient.get<PricingPlan[]>('/api/subscriptions/plans')
    return response.data
  },

  // Create subscription
  createSubscription: async (data: CreateSubscriptionDto): Promise<SubscriptionResponse> => {
    const response = await apiClient.post<SubscriptionResponse>('/api/subscriptions', data)
    return response.data
  },

  // Get user's current subscription
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    const response = await apiClient.get<Subscription | null>('/api/subscriptions/current')
    return response.data
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId: string): Promise<Subscription> => {
    const response = await apiClient.post<Subscription>(`/api/subscriptions/${subscriptionId}/cancel`)
    return response.data
  },

  // Update subscription
  updateSubscription: async (subscriptionId: string, planId: string): Promise<Subscription> => {
    const response = await apiClient.put<Subscription>(`/api/subscriptions/${subscriptionId}`, { planId })
    return response.data
  },

  // Get subscription history
  getSubscriptionHistory: async (): Promise<Subscription[]> => {
    const response = await apiClient.get<Subscription[]>('/api/subscriptions/history')
    return response.data
  },
}

// Refund API
export const refundApi = {
  // Create refund
  createRefund: async (data: CreateRefundDto): Promise<RefundResponse> => {
    const response = await apiClient.post<RefundResponse>('/api/refunds', data)
    return response.data
  },

  // Get refund by ID
  getRefund: async (refundId: string): Promise<Refund> => {
    const response = await apiClient.get<Refund>(`/api/refunds/${refundId}`)
    return response.data
  },

  // Get user's refunds
  getUserRefunds: async (): Promise<Refund[]> => {
    const response = await apiClient.get<Refund[]>('/api/refunds/user')
    return response.data
  },

  // Cancel refund
  cancelRefund: async (refundId: string): Promise<Refund> => {
    const response = await apiClient.post<Refund>(`/api/refunds/${refundId}/cancel`)
    return response.data
  },
}

// Analytics API
export const analyticsApi = {
  // Get payment analytics (for teachers/admins)
  getPaymentAnalytics: async (): Promise<PaymentAnalytics> => {
    const response = await apiClient.get<PaymentAnalytics>('/api/analytics/payments')
    return response.data
  },

  // Get course revenue analytics
  getCourseRevenue: async (courseId: string): Promise<any> => {
    const response = await apiClient.get(`/api/analytics/courses/${courseId}/revenue`)
    return response.data
  },

  // Get subscription analytics
  getSubscriptionAnalytics: async (): Promise<any> => {
    const response = await apiClient.get('/api/analytics/subscriptions')
    return response.data
  },
}

// Telegram Web App Payment integration
export const telegramPaymentApi = {
  // Initialize Telegram payment
  initTelegramPayment: async (courseId: string): Promise<any> => {
    const response = await apiClient.get(`/api/telegram/payment/init/${courseId}`)
    return response.data
  },

  // Process Telegram payment result
  processTelegramPaymentResult: async (paymentData: any): Promise<void> => {
    await apiClient.post('/api/telegram/payment/process', paymentData)
  },

  // Get Telegram payment status
  getTelegramPaymentStatus: async (paymentId: string): Promise<any> => {
    const response = await apiClient.get(`/api/telegram/payment/status/${paymentId}`)
    return response.data
  },
}

// Webhook handlers
export const webhookApi = {
  // Handle Telegram webhook
  handleTelegramWebhook: async (webhookData: any): Promise<void> => {
    await apiClient.post('/api/webhooks/telegram', webhookData)
  },

  // Handle payment provider webhook
  handlePaymentWebhook: async (provider: string, webhookData: any): Promise<void> => {
    await apiClient.post(`/api/webhooks/payments/${provider}`, webhookData)
  },
}

export default { 
  paymentApi, 
  subscriptionApi, 
  refundApi, 
  analyticsApi, 
  telegramPaymentApi, 
  webhookApi 
}
