import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { telegramPaymentApi } from '@/services/paymentApi'
import { useTranslation } from '@/hooks/useTranslation'

interface TelegramPaymentButtonProps {
  courseId: string
  courseTitle: string
  price: number
  currency: string
  onPaymentSuccess?: (paymentData: any) => void
  onPaymentError?: (error: any) => void
  className?: string
  disabled?: boolean
}

const TelegramPaymentButton: React.FC<TelegramPaymentButtonProps> = ({
  courseId,
  courseTitle,
  price,
  currency,
  onPaymentSuccess,
  onPaymentError,
  className = '',
  disabled = false
}) => {
  const { t } = useTranslation()
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)

  // Initialize payment mutation
  const initPaymentMutation = useMutation({
    mutationFn: () => telegramPaymentApi.initTelegramPayment(courseId),
    onSuccess: (data) => {
      setPaymentData(data)
      if (window.Telegram?.WebApp) {
        showTelegramPayment(data)
      }
    },
    onError: (error: any) => {
      toast.error('Ошибка инициализации платежа: ' + error.message)
      onPaymentError?.(error)
    }
  })

  // Process payment result mutation
  const processPaymentMutation = useMutation({
    mutationFn: (result: any) => telegramPaymentApi.processTelegramPaymentResult(result),
    onSuccess: (data) => {
      toast.success('Платеж успешно обработан!')
      onPaymentSuccess?.(data)
    },
    onError: (error: any) => {
      toast.error('Ошибка обработки платежа: ' + error.message)
      onPaymentError?.(error)
    }
  })

  // Check if running in Telegram Web App
  useEffect(() => {
    const checkTelegramWebApp = () => {
      if (window.Telegram?.WebApp) {
        setIsTelegramWebApp(true)
        setupTelegramWebApp()
      }
    }

    checkTelegramWebApp()
  }, [])

  const setupTelegramWebApp = () => {
    const tg = window.Telegram?.WebApp as any
    if (!tg) return

    // Enable closing confirmation
    if (tg.enableClosingConfirmation) {
      tg.enableClosingConfirmation()
    }

    // Setup payment event handlers
    if (tg.onEvent) {
      tg.onEvent('paymentFormSubmitted', handlePaymentFormSubmitted)
      tg.onEvent('paymentFormClosed', handlePaymentFormClosed)
    }

    // Cleanup on unmount
    return () => {
      if (tg.offEvent) {
        tg.offEvent('paymentFormSubmitted', handlePaymentFormSubmitted)
        tg.offEvent('paymentFormClosed', handlePaymentFormClosed)
      }
    }
  }

  const handlePaymentFormSubmitted = (event: any) => {
    console.log('Payment form submitted:', event)
    processPaymentMutation.mutate(event)
  }

  const handlePaymentFormClosed = (event: any) => {
    console.log('Payment form closed:', event)
    if (event.status === 'failed') {
      toast.error('Платеж не был завершен')
      onPaymentError?.(event)
    }
  }

  const showTelegramPayment = (paymentInfo: any) => {
    if (!window.Telegram?.WebApp) {
      toast.error('Telegram Web App не доступен')
      return
    }

    const tgWebApp = window.Telegram.WebApp as any

    // Create invoice for Telegram
    const invoice = {
      title: courseTitle,
      description: `Покупка курса: ${courseTitle}`,
      payload: JSON.stringify({
        courseId,
        userId: tgWebApp.initDataUnsafe.user?.id,
        timestamp: Date.now()
      }),
      provider_token: paymentInfo.providerToken,
      currency: currency,
      prices: [
        {
          label: courseTitle,
          amount: Math.round(price * 100) // Convert to smallest currency unit
        }
      ],
      max_tip_amount: 0,
      suggested_tip_amounts: [],
      start_parameter: courseId,
      provider_data: JSON.stringify({
        courseId,
        type: 'course_purchase'
      }),
      photo_url: paymentInfo.photoUrl,
      photo_size: paymentInfo.photoSize,
      photo_width: paymentInfo.photoWidth,
      photo_height: paymentInfo.photoHeight,
      need_name: false,
      need_phone_number: false,
      need_email: false,
      need_shipping_address: false,
      send_phone_number_to_provider: false,
      send_email_to_provider: false,
      is_flexible: false
    }

    // Show payment form
    if (tgWebApp?.showInvoice) {
      tgWebApp.showInvoice(invoice, (status: string) => {
      console.log('Payment status:', status)
      if (status === 'paid') {
        toast.success('Платеж успешно завершен!')
        onPaymentSuccess?.(paymentInfo)
      } else if (status === 'failed') {
        toast.error('Платеж не удался')
        onPaymentError?.({ status })
      } else if (status === 'cancelled') {
        toast.success('Платеж отменен')
      }
      })
    }
  }

  const handlePaymentClick = () => {
    if (disabled) return

    if (isTelegramWebApp) {
      initPaymentMutation.mutate()
    } else {
      toast.error('Платежи доступны только в Telegram Web App')
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (!isTelegramWebApp) {
    return (
      <div className={`text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
        <p className="text-sm text-yellow-800">
          Платежи доступны только в Telegram Web App
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <button
        onClick={handlePaymentClick}
        disabled={disabled || initPaymentMutation.isPending}
        className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
      >
        {initPaymentMutation.isPending ? (
          <>
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            <span>Инициализация...</span>
          </>
        ) : (
          <>
            <CreditCardIcon className="h-5 w-5" />
            <div className="text-left">
              <div className="text-sm opacity-90">Купить курс</div>
              <div className="text-lg font-bold">{formatPrice(price, currency)}</div>
            </div>
          </>
        )}
      </button>

      {/* Payment status indicator */}
      {processPaymentMutation.isPending && (
        <div className="mt-3 flex items-center justify-center space-x-2 text-blue-600">
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          <span className="text-sm">Обработка платежа...</span>
        </div>
      )}

      {processPaymentMutation.isSuccess && (
        <div className="mt-3 flex items-center justify-center space-x-2 text-green-600">
          <CheckCircleIcon className="h-4 w-4" />
          <span className="text-sm">Платеж успешно обработан!</span>
        </div>
      )}

      {processPaymentMutation.isError && (
        <div className="mt-3 flex items-center justify-center space-x-2 text-red-600">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span className="text-sm">Ошибка обработки платежа</span>
        </div>
      )}
    </div>
  )
}

export default TelegramPaymentButton
