// Telegram Payment API types
export interface TelegramPayment {
  id: string
  title: string
  description: string
  payload: string
  currency: string
  prices: TelegramLabeledPrice[]
  max_tip_amount?: number
  suggested_tip_amounts?: number[]
  start_parameter?: string
  provider_data?: string
  photo_url?: string
  photo_size?: number
  photo_width?: number
  photo_height?: number
  need_name?: boolean
  need_phone_number?: boolean
  need_email?: boolean
  need_shipping_address?: boolean
  send_phone_number_to_provider?: boolean
  send_email_to_provider?: boolean
  is_flexible?: boolean
}

export interface TelegramLabeledPrice {
  label: string
  amount: number // Amount in the smallest units of the currency
}

export interface TelegramShippingOption {
  id: string
  title: string
  prices: TelegramLabeledPrice[]
}

export interface TelegramPreCheckoutQuery {
  id: string
  from: TelegramUser
  currency: string
  total_amount: number
  invoice_payload: string
  shipping_option_id?: string
  order_info?: TelegramOrderInfo
}

export interface TelegramOrderInfo {
  name?: string
  phone_number?: string
  email?: string
  shipping_address?: TelegramShippingAddress
}

export interface TelegramShippingAddress {
  country_code: string
  state: string
  city: string
  street_line1: string
  street_line2: string
  post_code: string
}

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  added_to_attachment_menu?: boolean
}

export interface TelegramSuccessfulPayment {
  currency: string
  total_amount: number
  invoice_payload: string
  shipping_option_id?: string
  order_info?: TelegramOrderInfo
  telegram_payment_charge_id: string
  provider_payment_charge_id: string
}

// Course purchase types
export interface CoursePurchase {
  id: string
  courseId: string
  userId: string
  amount: number
  currency: string
  status: PurchaseStatus
  paymentMethod: PaymentMethod
  telegramPaymentChargeId?: string
  providerPaymentChargeId?: string
  purchasedAt: string
  expiresAt?: string
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  TELEGRAM_PAYMENTS = 'TELEGRAM_PAYMENTS',
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  CRYPTO = 'CRYPTO',
}

// Subscription types
export interface Subscription {
  id: string
  userId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  amount: number
  currency: string
  interval: SubscriptionInterval
  telegramPaymentChargeId?: string
  providerPaymentChargeId?: string
  createdAt: string
  updatedAt: string
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID',
  INCOMPLETE = 'INCOMPLETE',
  TRIALING = 'TRIALING',
}

export enum SubscriptionInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  WEEKLY = 'WEEKLY',
}

// Pricing plan types
export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: SubscriptionInterval
  features: string[]
  isPopular: boolean
  isActive: boolean
  telegramProductId?: string
  maxCourses?: number
  maxStudents?: number
  storageLimit?: number // in MB
  createdAt: string
  updatedAt: string
}

// Payment intent types
export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: PaymentIntentStatus
  clientSecret?: string
  metadata: Record<string, any>
  createdAt: string
}

export enum PaymentIntentStatus {
  REQUIRES_PAYMENT_METHOD = 'REQUIRES_PAYMENT_METHOD',
  REQUIRES_CONFIRMATION = 'REQUIRES_CONFIRMATION',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  PROCESSING = 'PROCESSING',
  REQUIRES_CAPTURE = 'REQUIRES_CAPTURE',
  CANCELED = 'CANCELED',
  SUCCEEDED = 'SUCCEEDED',
}

// Refund types
export interface Refund {
  id: string
  paymentId: string
  amount: number
  currency: string
  reason: RefundReason
  status: RefundStatus
  createdAt: string
  processedAt?: string
}

export enum RefundReason {
  DUPLICATE = 'DUPLICATE',
  FRAUDULENT = 'FRAUDULENT',
  REQUESTED_BY_CUSTOMER = 'REQUESTED_BY_CUSTOMER',
  COURSE_REFUND = 'COURSE_REFUND',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

// Webhook types
export interface PaymentWebhook {
  id: string
  type: WebhookType
  data: any
  processed: boolean
  createdAt: string
  processedAt?: string
}

export enum WebhookType {
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  REFUND_CREATED = 'REFUND_CREATED',
  REFUND_SUCCEEDED = 'REFUND_SUCCEEDED',
  REFUND_FAILED = 'REFUND_FAILED',
}

// API DTOs
export interface CreatePaymentIntentDto {
  courseId?: string
  planId?: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  metadata?: Record<string, any>
}

export interface CreateSubscriptionDto {
  planId: string
  paymentMethod: PaymentMethod
  couponCode?: string
}

export interface ProcessTelegramPaymentDto {
  preCheckoutQueryId: string
  ok: boolean
  errorMessage?: string
}

export interface CreateRefundDto {
  paymentId: string
  amount?: number
  reason: RefundReason
  metadata?: Record<string, any>
}

// Response types
export interface PaymentResponse {
  paymentIntent: PaymentIntent
  clientSecret?: string
  telegramPayment?: TelegramPayment
}

export interface SubscriptionResponse {
  subscription: Subscription
  paymentIntent?: PaymentIntent
}

export interface RefundResponse {
  refund: Refund
}

// Analytics types
export interface PaymentAnalytics {
  totalRevenue: number
  monthlyRevenue: number
  totalTransactions: number
  averageTransactionValue: number
  conversionRate: number
  refundRate: number
  topCourses: Array<{
    courseId: string
    courseName: string
    revenue: number
    sales: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
    transactions: number
  }>
}
