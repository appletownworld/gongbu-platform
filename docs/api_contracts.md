# API Contracts - Inter-Service Communication

**Версия:** 1.0  
**Дата:** 11 сентября 2025  
**Статус:** Service Integration Specification  

---

## 📋 Обзор

Данный документ описывает API контракты между микросервисами платформы Gongbu. Каждый сервис предоставляет четко определенные интерфейсы для взаимодействия с другими сервисами.

## 🔧 Communication Patterns

### Синхронная коммуникация (HTTP/gRPC)
- **Request-Response** для операций требующих немедленного ответа
- **Circuit Breaker** для защиты от cascade failures
- **Retry Logic** с exponential backoff
- **Timeout Configuration** для каждого сервиса

### Асинхронная коммуникация (Events)
- **Domain Events** через Kafka/Redis Pub/Sub
- **Event Sourcing** для аудита и восстановления состояния
- **Saga Pattern** для распределенных транзакций
- **Dead Letter Queue** для обработки ошибок

---

## 🔐 Auth Service Contracts

### Public API (External clients)
```yaml
# User Authentication
POST /auth/telegram
  request:
    content-type: application/json
    body:
      initData: string
      hash: string
      startParam?: string
  response:
    200:
      accessToken: string
      refreshToken: string
      user: UserProfile
      expiresIn: number
    401:
      error: "Invalid telegram data"

POST /auth/refresh
  request:
    body:
      refreshToken: string
  response:
    200:
      accessToken: string
      refreshToken: string
      expiresIn: number
    401:
      error: "Invalid refresh token"

GET /auth/me
  request:
    headers:
      Authorization: Bearer <token>
  response:
    200:
      user: UserProfile
    401:
      error: "Unauthorized"
```

### Internal API (Service-to-Service)
```yaml
# User Validation (called by API Gateway)
POST /internal/auth/validate
  request:
    headers:
      X-Service-Token: <internal-service-token>
    body:
      token: string
  response:
    200:
      valid: true
      user: UserContext
    401:
      valid: false
      error: string

# User Info (called by other services)
GET /internal/users/:userId
  request:
    headers:
      X-Service-Token: <internal-service-token>
    params:
      userId: string
  response:
    200:
      user: UserProfile
    404:
      error: "User not found"

# Bulk User Info
POST /internal/users/bulk
  request:
    body:
      userIds: string[]
  response:
    200:
      users: Record<string, UserProfile>
```

### Events Published
```yaml
UserRegistered:
  schema:
    userId: string
    telegramId: number
    role: UserRole
    timestamp: string
  routing_key: "user.registered"

UserRoleChanged:
  schema:
    userId: string
    oldRole: UserRole
    newRole: UserRole
    changedBy: string
    timestamp: string
  routing_key: "user.role_changed"

SubscriptionUpdated:
  schema:
    userId: string
    oldPlan: SubscriptionPlan
    newPlan: SubscriptionPlan
    timestamp: string
  routing_key: "user.subscription_updated"
```

---

## 🎓 Course Service Contracts

### Public API
```yaml
# Course Listing
GET /courses
  request:
    query:
      page?: number
      limit?: number
      category?: string
      search?: string
      creator_id?: string
      published?: boolean
  response:
    200:
      courses: Course[]
      total: number
      page: number
      pages: number

# Course Details
GET /courses/:id
  request:
    params:
      id: string
    query:
      include?: 'steps' | 'reviews' | 'stats'
  response:
    200:
      course: Course
      steps?: CourseStep[]
      reviews?: Review[]
      stats?: CourseStats
    404:
      error: "Course not found"

# Course Creation
POST /courses
  request:
    headers:
      Authorization: Bearer <token>
    body:
      title: string
      description: string
      category: string
      pricing_model: PricingModel
      price?: number
  response:
    201:
      course: Course
    400:
      error: "Invalid course data"
    403:
      error: "Insufficient permissions"
```

### Internal API
```yaml
# Course Info for Bot Service
GET /internal/courses/:id/bot-info
  request:
    headers:
      X-Service-Token: <internal-service-token>
    params:
      id: string
  response:
    200:
      course:
        id: string
        title: string
        creator_id: string
        steps: Array<{
          id: string
          title: string
          content: StepContent
          order_index: number
          is_paid: boolean
        }>
    404:
      error: "Course not found"

# Step Content for Progress Service  
GET /internal/steps/:id
  request:
    params:
      id: string
  response:
    200:
      step: CourseStep
    404:
      error: "Step not found"

# Course Access Check
POST /internal/courses/:id/check-access
  request:
    params:
      id: string
    body:
      userId: string
  response:
    200:
      hasAccess: boolean
      requiresPayment: boolean
      accessType: 'free' | 'paid' | 'subscription'
```

### Events Published
```yaml
CourseCreated:
  schema:
    courseId: string
    creatorId: string
    title: string
    category: string
    timestamp: string
  routing_key: "course.created"

CoursePublished:
  schema:
    courseId: string
    creatorId: string
    title: string
    publishedAt: string
  routing_key: "course.published"

StepCompleted:
  schema:
    userId: string
    courseId: string
    stepId: string
    completedAt: string
    score?: number
    timeSpent: number
  routing_key: "course.step_completed"

AssignmentSubmitted:
  schema:
    assignmentId: string
    userId: string
    courseId: string
    stepId: string
    submittedAt: string
  routing_key: "course.assignment_submitted"
```

### Events Consumed
```yaml
PaymentCompleted:
  handler: unlockPaidContent
  schema:
    userId: string
    courseId?: string
    stepId?: string
    amount: number
    
UserRegistered:
  handler: trackNewUser
  schema:
    userId: string
    role: UserRole
```

---

## 🤖 Bot Service Contracts

### Internal API (Called by Course Service)
```yaml
# Create Bot for Course
POST /internal/bots/create
  request:
    headers:
      X-Service-Token: <internal-service-token>
    body:
      courseId: string
      creatorId: string
      botName: string
      botDescription?: string
  response:
    201:
      bot:
        id: string
        token: string
        username: string
        botId: number
    400:
      error: "Invalid bot configuration"
    409:
      error: "Bot already exists for course"

# Update Bot Settings
PUT /internal/bots/:botId/settings
  request:
    body:
      settings: BotSettings
  response:
    200:
      success: true
    404:
      error: "Bot not found"

# Deactivate Bot
DELETE /internal/bots/:botId
  request:
    params:
      botId: string
  response:
    200:
      success: true
    404:
      error: "Bot not found"
```

### Public API (Bot Management)
```yaml
# Get Bot Analytics
GET /bots/:botId/analytics
  request:
    headers:
      Authorization: Bearer <token>
    params:
      botId: string
    query:
      period?: '1d' | '7d' | '30d'
  response:
    200:
      analytics: BotAnalytics
    403:
      error: "Access denied"

# Send Broadcast Message
POST /bots/:botId/broadcast
  request:
    headers:
      Authorization: Bearer <token>
    body:
      message: BroadcastMessage
      target: BroadcastTarget
  response:
    202:
      broadcastId: string
      estimatedRecipients: number
```

### Webhook Endpoints
```yaml
# Telegram Webhook
POST /webhook/:botId
  request:
    headers:
      X-Telegram-Bot-Api-Secret-Token: string
    params:
      botId: string
    body:
      update_id: number
      message?: TelegramMessage
      callback_query?: TelegramCallbackQuery
      pre_checkout_query?: TelegramPreCheckoutQuery
      successful_payment?: TelegramSuccessfulPayment
  response:
    200:
      ok: true
    400:
      error: "Invalid update"
```

### Events Published
```yaml
BotUserInteraction:
  schema:
    botId: string
    telegramUserId: number
    platformUserId?: string
    action: string
    stepId?: string
    timestamp: string
  routing_key: "bot.user_interaction"

AssignmentSubmittedViaTelegram:
  schema:
    assignmentId: string
    botId: string
    telegramUserId: number
    platformUserId: string
    submissionData: any
    timestamp: string
  routing_key: "bot.assignment_submitted"
```

### Events Consumed
```yaml
CoursePublished:
  handler: createCourseBot
  
CourseUpdated:
  handler: updateBotContent
  
AssignmentReviewed:
  handler: notifyStudentInTelegram
  
PaymentCompleted:
  handler: unlockBotContent
```

---

## 💳 Payment Service Contracts

### Public API
```yaml
# Create Payment Intent
POST /payments/create-intent
  request:
    headers:
      Authorization: Bearer <token>
    body:
      amount: number
      currency: string
      courseId?: string
      stepId?: string
      metadata?: Record<string, any>
  response:
    201:
      paymentIntent:
        id: string
        amount: number
        currency: string
        status: 'pending'
        clientSecret?: string
        telegramInvoiceUrl?: string

# Payment History
GET /payments/history
  request:
    headers:
      Authorization: Bearer <token>
    query:
      page?: number
      limit?: number
      status?: PaymentStatus
  response:
    200:
      payments: Payment[]
      total: number

# Revenue Dashboard (Creators)
GET /payments/revenue
  request:
    headers:
      Authorization: Bearer <creator-token>
    query:
      period?: '1d' | '7d' | '30d' | '1y'
  response:
    200:
      revenue:
        totalRevenue: number
        totalTransactions: number
        avgTransactionAmount: number
        revenueByMonth: Array<{
          month: string
          revenue: number
          transactions: number
        }>
```

### Internal API
```yaml
# Check Payment Status
GET /internal/payments/:id/status
  request:
    params:
      id: string
  response:
    200:
      payment:
        id: string
        status: PaymentStatus
        amount: number
        userId: string
        courseId?: string
        stepId?: string

# Process Webhook (from payment providers)
POST /internal/webhooks/:provider
  request:
    params:
      provider: 'telegram' | 'stripe'
    headers:
      X-Provider-Signature: string
    body: any
  response:
    200:
      processed: true
```

### Events Published
```yaml
PaymentCompleted:
  schema:
    paymentId: string
    userId: string
    amount: number
    currency: string
    courseId?: string
    stepId?: string
    completedAt: string
  routing_key: "payment.completed"

PaymentFailed:
  schema:
    paymentId: string
    userId: string
    reason: string
    timestamp: string
  routing_key: "payment.failed"

SubscriptionCreated:
  schema:
    subscriptionId: string
    userId: string
    plan: SubscriptionPlan
    startDate: string
    endDate: string
  routing_key: "payment.subscription_created"
```

---

## 🔔 Notification Service Contracts

### Internal API (Service-to-Service)
```yaml
# Send Notification
POST /internal/notifications/send
  request:
    headers:
      X-Service-Token: <internal-service-token>
    body:
      userId: string
      type: NotificationType
      title: string
      message: string
      data?: Record<string, any>
      channels?: Array<'telegram' | 'email' | 'push'>
  response:
    202:
      notificationId: string
      estimatedDelivery: string

# Send Bulk Notifications
POST /internal/notifications/bulk
  request:
    body:
      notifications: Array<{
        userId: string
        type: NotificationType
        title: string
        message: string
        data?: Record<string, any>
      }>
      channels?: Array<'telegram' | 'email' | 'push'>
  response:
    202:
      batchId: string
      totalNotifications: number

# Get Notification Templates
GET /internal/templates/:type
  request:
    params:
      type: NotificationType
    query:
      language?: string
  response:
    200:
      template:
        subject: string
        body: string
        variables: string[]
```

### Events Consumed
```yaml
UserRegistered:
  handler: sendWelcomeNotification
  
CoursePublished:
  handler: notifySubscribers
  
AssignmentSubmitted:
  handler: notifyTeacher
  
PaymentCompleted:
  handler: sendPaymentConfirmation
  
CourseCompleted:
  handler: sendCertificate
```

---

## 🔌 Plugin Service Contracts

### Public API
```yaml
# Plugin Marketplace
GET /plugins
  request:
    query:
      category?: string
      search?: string
      page?: number
      featured?: boolean
  response:
    200:
      plugins: Plugin[]
      total: number

# Install Plugin
POST /plugins/:id/install
  request:
    headers:
      Authorization: Bearer <token>
    params:
      id: string
    body:
      courseId: string
      configuration?: Record<string, any>
  response:
    201:
      installation:
        id: string
        pluginId: string
        courseId: string
        status: 'installed'

# Execute Plugin
POST /plugins/:id/execute
  request:
    headers:
      Authorization: Bearer <token>
    params:
      id: string
    body:
      context: PluginContext
      input: any
  response:
    200:
      result: PluginResult
    400:
      error: "Plugin execution failed"
```

### Internal API
```yaml
# Get Plugin Content for Course Step
GET /internal/plugins/:id/content
  request:
    params:
      id: string
    body:
      stepId: string
      userId: string
      configuration: Record<string, any>
  response:
    200:
      content:
        html: string
        js?: string
        css?: string
        data?: any
```

---

## 📊 Analytics Service Contracts

### Internal API (Data Collection)
```yaml
# Track Event
POST /internal/analytics/track
  request:
    body:
      userId?: string
      sessionId?: string
      event: string
      properties: Record<string, any>
      timestamp?: string
  response:
    202:
      tracked: true

# Batch Track Events
POST /internal/analytics/batch
  request:
    body:
      events: Array<{
        userId?: string
        event: string
        properties: Record<string, any>
        timestamp?: string
      }>
  response:
    202:
      batchId: string
      eventsCount: number
```

### Public API (Reports)
```yaml
# Course Analytics
GET /analytics/courses/:id
  request:
    headers:
      Authorization: Bearer <creator-token>
    params:
      id: string
    query:
      period?: '1d' | '7d' | '30d'
  response:
    200:
      analytics: CourseAnalytics

# Platform Statistics (Admin only)
GET /analytics/platform
  request:
    headers:
      Authorization: Bearer <admin-token>
    query:
      period?: string
  response:
    200:
      stats: PlatformStats
```

---

## 🚦 Error Handling Standards

### HTTP Status Codes
```yaml
Success:
  200: OK - Request successful
  201: Created - Resource created
  202: Accepted - Request accepted for async processing
  204: No Content - Request successful, no response body

Client Errors:
  400: Bad Request - Invalid request data
  401: Unauthorized - Authentication required
  403: Forbidden - Access denied
  404: Not Found - Resource not found
  409: Conflict - Resource conflict
  422: Unprocessable Entity - Validation errors
  429: Too Many Requests - Rate limit exceeded

Server Errors:
  500: Internal Server Error - Unexpected server error
  502: Bad Gateway - Upstream service error
  503: Service Unavailable - Service temporarily unavailable
  504: Gateway Timeout - Upstream service timeout
```

### Error Response Format
```yaml
Standard Error Response:
  error:
    code: string          # Machine-readable error code
    message: string       # Human-readable message
    details?: any         # Additional error details
    timestamp: string     # ISO 8601 timestamp
    requestId: string     # Unique request identifier
    
Validation Error Response:
  error:
    code: "VALIDATION_ERROR"
    message: "Invalid input data"
    details:
      fields:
        fieldName:
          - "Field is required"
          - "Field must be valid email"
```

---

## 🔒 Security Considerations

### Authentication
- **Service-to-Service**: Internal JWT tokens с shared secret
- **Client Authentication**: Telegram OAuth tokens
- **Rate Limiting**: По IP адресу и пользователю
- **Request Validation**: Input sanitization и validation

### Data Protection
- **Sensitive Data**: Шифрование в транзите и покое
- **PII Handling**: Минимальный набор персональных данных
- **Audit Logging**: Все изменения данных логируются
- **GDPR Compliance**: Право на удаление данных

---

## 📈 Monitoring & Observability

### Metrics Collection
- **Request Metrics**: Response time, error rate, throughput
- **Business Metrics**: Course creation, user engagement, revenue
- **System Metrics**: CPU, memory, disk usage
- **Custom Metrics**: Domain-specific KPIs

### Tracing
- **Distributed Tracing**: Запросы между сервисами
- **Correlation IDs**: Отслеживание запросов через систему
- **Performance Profiling**: Bottleneck identification

### Alerting
- **Error Rate Alerts**: > 5% error rate
- **Response Time Alerts**: > 500ms average
- **Business Alerts**: Revenue anomalies, user drop-offs
- **Infrastructure Alerts**: Service unavailability

---

**Статус документа:** ✅ Ready for Implementation  
**Последнее обновление:** 11 сентября 2025  
**Следующая ревизия:** После реализации первых сервисов
