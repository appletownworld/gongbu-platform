# 💳 Toss Payments Integration Guide

**Telegram Mini App** - Интеграция корейской платежной системы Toss Payments для покупки курсов.

---

## 🎯 **Что интегрировано**

### ✅ **Полная интеграция Toss Payments**
- **Тестовый режим** - готов к тестированию
- **6 способов оплаты** - карта, виртуальный счет, банковский перевод, мобильный, подарочные сертификаты, простые платежи
- **Telegram WebApp интеграция** - открытие платежей в Telegram
- **История платежей** - сохранение в localStorage
- **Haptic feedback** - тактильная обратная связь

---

## 🛠️ **Техническая реализация**

### **1. Сервис Toss Payments** (`src/services/tossPayments.ts`)
```typescript
// Основные функции:
- createPayment() - создание платежа
- createCoursePayment() - платеж за курс
- getAvailablePaymentMethods() - способы оплаты
- openPaymentInTelegram() - открытие в Telegram
- handlePaymentSuccess/Failure() - обработка результатов
```

### **2. Компонент оплаты** (`src/components/PaymentScreen.tsx`)
```typescript
// Функции:
- Выбор способа оплаты
- Отображение информации о курсе
- Создание платежа
- Обработка результатов
```

### **3. Хук управления платежами** (`src/hooks/usePayment.ts`)
```typescript
// Функции:
- createPayment() - создание платежа
- getPaymentHistory() - история платежей
- markPaymentCompleted/Failed() - обновление статуса
```

---

## 💳 **Способы оплаты**

### **1. 💳 Карта (Card)**
- **Описание**: 신용카드/체크카드
- **Иконка**: 💳
- **Статус**: ✅ Включено

### **2. 🏦 Виртуальный счет (Virtual Account)**
- **Описание**: 가상계좌 입금
- **Иконка**: 🏦
- **Статус**: ✅ Включено

### **3. 💰 Банковский перевод (Bank Transfer)**
- **Описание**: 실시간 계좌이체
- **Иконка**: 💰
- **Статус**: ✅ Включено

### **4. 📱 Мобильный (Mobile)**
- **Описание**: 휴대폰 소액결제
- **Иконка**: 📱
- **Статус**: ✅ Включено

### **5. 🎁 Подарочные сертификаты (Gift Certificate)**
- **Описание**: 문화상품권/도서상품권
- **Иконка**: 🎁
- **Статус**: ✅ Включено

### **6. ⚡ Простые платежи (Easy Pay)**
- **Описание**: 토스페이/카카오페이/페이코
- **Иконка**: ⚡
- **Статус**: ✅ Включено

---

## 🚀 **Как использовать**

### **1. Покупка курса:**
1. Откройте список курсов
2. Найдите платный курс (с ценой 💰)
3. Нажмите кнопку "💳 구매"
4. Выберите способ оплаты
5. Нажмите "결제하기"
6. Оплата откроется в Telegram

### **2. Процесс оплаты:**
1. **Выбор способа** - 6 вариантов оплаты
2. **Подтверждение** - проверка данных курса
3. **Открытие платежа** - в Telegram WebApp
4. **Завершение** - автоматическое обновление статуса

---

## ⚙️ **Конфигурация**

### **Тестовые настройки:**
```typescript
const TOSS_CONFIG = {
  testApiKey: 'test_sk_dummy_test_key_for_development',
  baseUrl: 'https://api.tosspayments.com',
  testMerchantId: 'test_merchant_id',
  testSuccessUrl: 'https://gongbu.app/payment/success',
  testFailUrl: 'https://gongbu.app/payment/fail',
};
```

### **Production настройки:**
```typescript
// Замените на реальные ключи:
const TOSS_CONFIG = {
  apiKey: 'live_sk_your_real_api_key',
  merchantId: 'your_real_merchant_id',
  successUrl: 'https://yourdomain.com/payment/success',
  failUrl: 'https://yourdomain.com/payment/fail',
};
```

---

## 🔧 **Настройка для продакшена**

### **1. Регистрация в Toss Payments:**
1. Зайдите на [toss.im](https://toss.im)
2. Создайте аккаунт продавца
3. Получите API ключи
4. Настройте webhook URLs

### **2. Обновление конфигурации:**
```typescript
// В src/services/tossPayments.ts
const TOSS_CONFIG = {
  apiKey: 'live_sk_your_real_api_key', // Ваш реальный ключ
  merchantId: 'your_merchant_id',      // Ваш merchant ID
  successUrl: 'https://gongbu.app/payment/success',
  failUrl: 'https://gongbu.app/payment/fail',
};
```

### **3. Настройка webhook:**
```typescript
// URL для webhook: https://yourdomain.com/api/payments/toss/webhook
// События: payment.completed, payment.failed, payment.cancelled
```

---

## 📱 **Telegram интеграция**

### **Открытие платежей:**
```typescript
// Автоматическое открытие в Telegram WebApp
await tossPaymentsService.openPaymentInTelegram(paymentUrl);

// Fallback для браузера
window.open(paymentUrl, '_blank');
```

### **Обратная связь:**
```typescript
// Haptic feedback при успехе
window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');

// Haptic feedback при ошибке
window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');

// Показ уведомлений
window.Telegram.WebApp.showAlert('결제가 완료되었습니다!');
```

---

## 💾 **История платежей**

### **Сохранение в localStorage:**
```typescript
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
```

### **Управление статусами:**
- **pending** - платеж создан, ожидает оплаты
- **completed** - платеж успешно завершен
- **failed** - платеж не удался
- **cancelled** - платеж отменен

---

## 🧪 **Тестирование**

### **Тестовые данные:**
```typescript
// Тестовая карта
카드번호: 4242424242424242
만료일: 12/25
CVC: 123

// Тестовый виртуальный счет
은행: 토스뱅크
계좌번호: 1000-0000-0000
```

### **Проверка интеграции:**
1. **Создание платежа** - проверьте API вызов
2. **Открытие в Telegram** - убедитесь что URL открывается
3. **Обработка результатов** - проверьте callback функции
4. **История платежей** - убедитесь что сохраняется

---

## 🔒 **Безопасность**

### **Рекомендации:**
1. **Никогда не храните** API ключи в коде
2. **Используйте HTTPS** для всех запросов
3. **Валидируйте** все входящие данные
4. **Логируйте** все платежные операции
5. **Используйте webhook** для подтверждения платежей

### **Валидация данных:**
```typescript
// Проверка суммы
if (amount <= 0 || amount > 1000000) {
  throw new Error('Invalid amount');
}

// Проверка email
if (!customerEmail.includes('@')) {
  throw new Error('Invalid email');
}
```

---

## 📊 **Мониторинг**

### **Логирование:**
```typescript
// Успешные платежи
console.log('Payment Success:', { paymentKey, orderId, amount });

// Ошибки платежей
console.error('Payment Failure:', { errorCode, errorMessage });

// API вызовы
console.log('Toss API Call:', { endpoint, method, data });
```

### **Метрики:**
- Количество созданных платежей
- Процент успешных платежей
- Время обработки платежей
- Популярные способы оплаты

---

## 🚀 **Готово к использованию!**

**Toss Payments полностью интегрирован в Telegram Mini App!**

### **Что работает:**
- ✅ Создание платежей за курсы
- ✅ 6 способов оплаты
- ✅ Открытие в Telegram WebApp
- ✅ История платежей
- ✅ Haptic feedback
- ✅ Обработка ошибок

### **Следующие шаги:**
1. **Получите реальные API ключи** от Toss Payments
2. **Обновите конфигурацию** в коде
3. **Настройте webhook** для подтверждения
4. **Протестируйте** с реальными платежами
5. **Запустите** в продакшене

---

**Gongbu + Toss Payments = 💳🚀**


