import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { paymentApi } from '@/services/paymentApi'
import { CoursePurchase, PurchaseStatus, PaymentMethod } from '@/types/payment'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslation } from '@/hooks/useTranslation'

interface PaymentHistoryProps {
  className?: string
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ className = '' }) => {
  const { t } = useTranslation()
  const [selectedPurchase, setSelectedPurchase] = useState<CoursePurchase | null>(null)

  // Fetch payment history
  const { data: purchases, isLoading, error } = useQuery({
    queryKey: ['payment-history'],
    queryFn: paymentApi.getPaymentHistory,
  })

  const getStatusIcon = (status: PurchaseStatus) => {
    switch (status) {
      case PurchaseStatus.COMPLETED:
        return CheckCircleIcon
      case PurchaseStatus.FAILED:
        return XCircleIcon
      case PurchaseStatus.PENDING:
        return ClockIcon
      case PurchaseStatus.REFUNDED:
        return ExclamationTriangleIcon
      case PurchaseStatus.CANCELLED:
        return XCircleIcon
      default:
        return ClockIcon
    }
  }

  const getStatusColor = (status: PurchaseStatus) => {
    switch (status) {
      case PurchaseStatus.COMPLETED:
        return 'text-green-600 bg-green-100'
      case PurchaseStatus.FAILED:
        return 'text-red-600 bg-red-100'
      case PurchaseStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100'
      case PurchaseStatus.REFUNDED:
        return 'text-blue-600 bg-blue-100'
      case PurchaseStatus.CANCELLED:
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: PurchaseStatus) => {
    switch (status) {
      case PurchaseStatus.COMPLETED:
        return 'Завершен'
      case PurchaseStatus.FAILED:
        return 'Неудачный'
      case PurchaseStatus.PENDING:
        return 'В обработке'
      case PurchaseStatus.REFUNDED:
        return 'Возвращен'
      case PurchaseStatus.CANCELLED:
        return 'Отменен'
      default:
        return 'Неизвестно'
    }
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.TELEGRAM_PAYMENTS:
        return CreditCardIcon
      case PaymentMethod.CREDIT_CARD:
        return CreditCardIcon
      case PaymentMethod.PAYPAL:
        return CreditCardIcon
      case PaymentMethod.CRYPTO:
        return CurrencyDollarIcon
      default:
        return CreditCardIcon
    }
  }

  const getPaymentMethodText = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.TELEGRAM_PAYMENTS:
        return 'Telegram Payments'
      case PaymentMethod.CREDIT_CARD:
        return 'Банковская карта'
      case PaymentMethod.PAYPAL:
        return 'PayPal'
      case PaymentMethod.CRYPTO:
        return 'Криптовалюта'
      default:
        return 'Неизвестно'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownloadReceipt = (purchase: CoursePurchase) => {
    // In a real app, this would generate and download a PDF receipt
    toast.success('Функция скачивания чека будет доступна в следующей версии')
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Ошибка загрузки истории
        </h3>
        <p className="text-secondary-500">
          Не удалось загрузить историю платежей
        </p>
      </div>
    )
  }

  if (!purchases || purchases.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <CreditCardIcon className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-700 mb-2">
          История платежей пуста
        </h3>
        <p className="text-secondary-500">
          У вас пока нет совершенных покупок
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          История платежей
        </h2>
        <p className="text-secondary-600">
          Все ваши покупки и транзакции
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Успешные платежи</p>
              <p className="text-2xl font-bold text-secondary-900">
                {purchases.filter(p => p.status === PurchaseStatus.COMPLETED).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Общая сумма</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatPrice(
                  purchases
                    .filter(p => p.status === PurchaseStatus.COMPLETED)
                    .reduce((sum, p) => sum + p.amount, 0),
                  'USD'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">В обработке</p>
              <p className="text-2xl font-bold text-secondary-900">
                {purchases.filter(p => p.status === PurchaseStatus.PENDING).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Покупка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Способ оплаты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {purchases.map((purchase) => {
                const StatusIcon = getStatusIcon(purchase.status)
                const PaymentMethodIcon = getPaymentMethodIcon(purchase.paymentMethod)
                
                return (
                  <tr key={purchase.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <CreditCardIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-secondary-900">
                            Курс #{purchase.courseId.slice(-8)}
                          </div>
                          <div className="text-sm text-secondary-500">
                            ID: {purchase.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">
                        {formatPrice(purchase.amount, purchase.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {getStatusText(purchase.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-secondary-900">
                        <PaymentMethodIcon className="h-4 w-4 mr-2" />
                        {getPaymentMethodText(purchase.paymentMethod)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {formatDate(purchase.purchasedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Подробности"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {purchase.status === PurchaseStatus.COMPLETED && (
                          <button
                            onClick={() => handleDownloadReceipt(purchase)}
                            className="text-secondary-600 hover:text-secondary-900"
                            title="Скачать чек"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <PurchaseDetailsModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
    </div>
  )
}

// Purchase Details Modal Component
interface PurchaseDetailsModalProps {
  purchase: CoursePurchase
  onClose: () => void
}

const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({ purchase, onClose }) => {
  const getStatusIcon = (status: PurchaseStatus) => {
    switch (status) {
      case PurchaseStatus.COMPLETED:
        return CheckCircleIcon
      case PurchaseStatus.FAILED:
        return XCircleIcon
      case PurchaseStatus.PENDING:
        return ClockIcon
      case PurchaseStatus.REFUNDED:
        return ExclamationTriangleIcon
      case PurchaseStatus.CANCELLED:
        return XCircleIcon
      default:
        return ClockIcon
    }
  }

  const getStatusColor = (status: PurchaseStatus) => {
    switch (status) {
      case PurchaseStatus.COMPLETED:
        return 'text-green-600 bg-green-100'
      case PurchaseStatus.FAILED:
        return 'text-red-600 bg-red-100'
      case PurchaseStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100'
      case PurchaseStatus.REFUNDED:
        return 'text-blue-600 bg-blue-100'
      case PurchaseStatus.CANCELLED:
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: PurchaseStatus) => {
    switch (status) {
      case PurchaseStatus.COMPLETED:
        return 'Завершен'
      case PurchaseStatus.FAILED:
        return 'Неудачный'
      case PurchaseStatus.PENDING:
        return 'В обработке'
      case PurchaseStatus.REFUNDED:
        return 'Возвращен'
      case PurchaseStatus.CANCELLED:
        return 'Отменен'
      default:
        return 'Неизвестно'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const StatusIcon = getStatusIcon(purchase.status)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary-900">
              Детали покупки
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center space-x-3">
            <StatusIcon className={`h-6 w-6 ${getStatusColor(purchase.status).split(' ')[0]}`} />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchase.status)}`}>
              {getStatusText(purchase.status)}
            </span>
          </div>

          {/* Purchase Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                ID покупки
              </label>
              <p className="text-sm text-secondary-900 font-mono">
                {purchase.id}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                ID курса
              </label>
              <p className="text-sm text-secondary-900 font-mono">
                {purchase.courseId}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Сумма
            </label>
            <p className="text-2xl font-bold text-secondary-900">
              {formatPrice(purchase.amount, purchase.currency)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Способ оплаты
            </label>
            <p className="text-sm text-secondary-900">
              {purchase.paymentMethod}
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Дата покупки
              </label>
              <p className="text-sm text-secondary-900">
                {formatDate(purchase.purchasedAt)}
              </p>
            </div>
            {purchase.expiresAt && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Действует до
                </label>
                <p className="text-sm text-secondary-900">
                  {formatDate(purchase.expiresAt)}
                </p>
              </div>
            )}
          </div>

          {/* Payment IDs */}
          {(purchase.telegramPaymentChargeId || purchase.providerPaymentChargeId) && (
            <div className="border-t border-secondary-200 pt-4">
              <h4 className="text-sm font-medium text-secondary-700 mb-3">
                Идентификаторы платежа
              </h4>
              <div className="space-y-2">
                {purchase.telegramPaymentChargeId && (
                  <div>
                    <label className="block text-xs text-secondary-500 mb-1">
                      Telegram Payment Charge ID
                    </label>
                    <p className="text-xs text-secondary-900 font-mono bg-secondary-50 p-2 rounded">
                      {purchase.telegramPaymentChargeId}
                    </p>
                  </div>
                )}
                {purchase.providerPaymentChargeId && (
                  <div>
                    <label className="block text-xs text-secondary-500 mb-1">
                      Provider Payment Charge ID
                    </label>
                    <p className="text-xs text-secondary-900 font-mono bg-secondary-50 p-2 rounded">
                      {purchase.providerPaymentChargeId}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-secondary-200 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentHistory
