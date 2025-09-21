import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  CheckIcon,
  XMarkIcon,
  StarIcon,
  CreditCardIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { subscriptionApi } from '@/services/paymentApi'
import { PricingPlan, Subscription, SubscriptionInterval, PaymentMethod } from '@/types/payment'
import { useTranslation } from '@/hooks/useTranslation'
import TelegramPaymentButton from './TelegramPaymentButton'

interface PricingPlansProps {
  onPlanSelect?: (plan: PricingPlan) => void
  currentSubscription?: Subscription | null
  className?: string
}

const PricingPlans: React.FC<PricingPlansProps> = ({ 
  onPlanSelect, 
  currentSubscription,
  className = '' 
}) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [billingInterval, setBillingInterval] = useState<SubscriptionInterval>(SubscriptionInterval.MONTHLY)

  // Fetch pricing plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: subscriptionApi.getPricingPlans,
  })

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: (planId: string) => subscriptionApi.createSubscription({ 
      planId, 
      paymentMethod: PaymentMethod.TELEGRAM_PAYMENTS 
    }),
    onSuccess: () => {
      toast.success('Подписка успешно создана!')
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] })
      onPlanSelect?.(selectedPlan!)
    },
    onError: (error: any) => {
      toast.error('Ошибка создания подписки: ' + error.message)
    }
  })

  const handlePlanSelect = (plan: PricingPlan) => {
    setSelectedPlan(plan)
    createSubscriptionMutation.mutate(plan.id)
  }

  const formatPrice = (amount: number, currency: string, interval: SubscriptionInterval) => {
    const price = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)

    const intervalText = {
      [SubscriptionInterval.MONTHLY]: '/месяц',
      [SubscriptionInterval.YEARLY]: '/год',
      [SubscriptionInterval.WEEKLY]: '/неделя',
    }[interval]

    return `${price}${intervalText}`
  }

  const getIntervalDiscount = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyYearlyTotal = monthlyPrice * 12
    const discount = ((monthlyYearlyTotal - yearlyPrice) / monthlyYearlyTotal) * 100
    return Math.round(discount)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!plans || plans.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <ExclamationTriangleIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Планы подписки недоступны
        </h3>
        <p className="text-secondary-500">
          Попробуйте позже или обратитесь в поддержку
        </p>
      </div>
    )
  }

  const filteredPlans = plans.filter(plan => plan.interval === billingInterval && plan.isActive)

  return (
    <div className={className}>
      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-secondary-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingInterval(SubscriptionInterval.MONTHLY)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billingInterval === SubscriptionInterval.MONTHLY
                ? 'bg-white text-secondary-900 shadow-sm'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            Ежемесячно
          </button>
          <button
            onClick={() => setBillingInterval(SubscriptionInterval.YEARLY)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billingInterval === SubscriptionInterval.YEARLY
                ? 'bg-white text-secondary-900 shadow-sm'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            Ежегодно
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPlans.map((plan) => {
          const isCurrentPlan = currentSubscription?.planId === plan.id
          const isPopular = plan.isPopular
          
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                isPopular 
                  ? 'border-primary-500 transform scale-105' 
                  : 'border-secondary-200 hover:border-primary-300'
              } ${isCurrentPlan ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <StarIcon className="h-4 w-4" />
                    <span>Популярный</span>
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-4 right-4">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Текущий план
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-secondary-900">
                      {formatPrice(plan.price, plan.currency, plan.interval)}
                    </span>
                  </div>
                  
                  {/* Yearly Discount */}
                  {billingInterval === SubscriptionInterval.YEARLY && plan.interval === SubscriptionInterval.YEARLY && (
                    <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      <span>Экономия до 20%</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-secondary-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="space-y-2 mb-8 text-sm text-secondary-600">
                  {plan.maxCourses && (
                    <div className="flex justify-between">
                      <span>Максимум курсов:</span>
                      <span className="font-medium">{plan.maxCourses}</span>
                    </div>
                  )}
                  {plan.maxStudents && (
                    <div className="flex justify-between">
                      <span>Максимум студентов:</span>
                      <span className="font-medium">{plan.maxStudents}</span>
                    </div>
                  )}
                  {plan.storageLimit && (
                    <div className="flex justify-between">
                      <span>Хранилище:</span>
                      <span className="font-medium">{plan.storageLimit} МБ</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="text-center">
                  {isCurrentPlan ? (
                    <div className="w-full py-3 px-4 bg-green-100 text-green-800 rounded-lg font-medium">
                      <CheckIcon className="h-5 w-5 inline mr-2" />
                      Активный план
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePlanSelect(plan)}
                      disabled={createSubscriptionMutation.isPending}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        isPopular
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-900'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {createSubscriptionMutation.isPending ? (
                        <div className="flex items-center justify-center space-x-2">
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          <span>Обработка...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <CreditCardIcon className="h-4 w-4" />
                          <span>Выбрать план</span>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment Method Info */}
      <div className="mt-12 text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <CreditCardIcon className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-medium text-blue-900">
              Безопасные платежи через Telegram
            </h4>
          </div>
          <p className="text-blue-700 text-sm">
            Все платежи обрабатываются через защищенную систему Telegram Payments. 
            Ваши данные защищены и не передаются третьим лицам.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-secondary-900 text-center mb-8">
          Часто задаваемые вопросы
        </h3>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <h4 className="font-medium text-secondary-900 mb-2">
              Можно ли отменить подписку?
            </h4>
            <p className="text-secondary-600 text-sm">
              Да, вы можете отменить подписку в любое время. Доступ к функциям сохранится до конца оплаченного периода.
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <h4 className="font-medium text-secondary-900 mb-2">
              Что происходит при истечении подписки?
            </h4>
            <p className="text-secondary-600 text-sm">
              При истечении подписки ваш аккаунт переходит на бесплатный план с ограниченным функционалом.
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <h4 className="font-medium text-secondary-900 mb-2">
              Есть ли пробный период?
            </h4>
            <p className="text-secondary-600 text-sm">
              Да, для новых пользователей доступен 7-дневный пробный период для всех платных планов.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingPlans
