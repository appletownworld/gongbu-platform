import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EnvironmentVariables } from '../../config/env.validation';

export interface CreatePaymentIntentRequest {
  amount: number; // in cents
  currency: string;
  userId: string;
  courseId?: string;
  subscriptionId?: string;
  description: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
  automaticPaymentMethods?: boolean;
}

export interface CreatePaymentIntentResponse {
  id: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
  confirmationUrl?: string;
}

export interface CreateSubscriptionRequest {
  customerId: string;
  priceId: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
  defaultPaymentMethod?: string;
}

export interface CreateSubscriptionResponse {
  id: string;
  status: string;
  clientSecret?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
}

export interface CreateCustomerRequest {
  email: string;
  name?: string;
  userId: string;
  metadata?: Record<string, string>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {
    const secretKey = this.configService.get('STRIPE_SECRET_KEY');
    const apiVersion = this.configService.get('STRIPE_API_VERSION');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: apiVersion as Stripe.LatestApiVersion,
      typescript: true,
    });

    this.webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET', '');

    this.logger.log('✅ Stripe service initialized');
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    try {
      this.logger.debug(`Creating payment intent for ${request.amount} ${request.currency}`, {
        userId: request.userId,
        courseId: request.courseId,
      });

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(request.amount), // Ensure integer
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: {
          userId: request.userId,
          ...(request.courseId && { courseId: request.courseId }),
          ...(request.subscriptionId && { subscriptionId: request.subscriptionId }),
          ...request.metadata,
        },
        automatic_payment_methods: {
          enabled: request.automaticPaymentMethods !== false,
        },
      };

      // Add return URL if provided
      if (request.returnUrl) {
        paymentIntentParams.return_url = request.returnUrl;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      this.logger.log(`✅ Payment intent created: ${paymentIntent.id}`);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      this.logger.error('❌ Failed to create payment intent:', error);
      
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }
      
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`❌ Failed to retrieve payment intent ${paymentIntentId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve payment intent');
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<Stripe.PaymentIntent> {
    try {
      const confirmParams: Stripe.PaymentIntentConfirmParams = {};
      
      if (paymentMethodId) {
        confirmParams.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, confirmParams);
      
      this.logger.log(`✅ Payment intent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`❌ Failed to confirm payment intent ${paymentIntentId}:`, error);
      throw new InternalServerErrorException('Failed to confirm payment intent');
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      this.logger.log(`✅ Payment intent cancelled: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`❌ Failed to cancel payment intent ${paymentIntentId}:`, error);
      throw new InternalServerErrorException('Failed to cancel payment intent');
    }
  }

  /**
   * Create or retrieve a customer
   */
  async createOrGetCustomer(request: CreateCustomerRequest): Promise<Stripe.Customer> {
    try {
      // First, try to find existing customer by metadata
      const existingCustomers = await this.stripe.customers.list({
        limit: 1,
        expand: ['data'],
      });

      const existingCustomer = existingCustomers.data.find(
        customer => customer.metadata?.userId === request.userId
      );

      if (existingCustomer) {
        this.logger.debug(`Found existing customer: ${existingCustomer.id}`);
        return existingCustomer;
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: request.email,
        name: request.name,
        metadata: {
          userId: request.userId,
          ...request.metadata,
        },
      });

      this.logger.log(`✅ Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('❌ Failed to create/get customer:', error);
      throw new InternalServerErrorException('Failed to create customer');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: request.customerId,
        items: [{
          price: request.priceId,
        }],
        metadata: request.metadata || {},
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (request.trialPeriodDays && request.trialPeriodDays > 0) {
        subscriptionParams.trial_period_days = request.trialPeriodDays;
      }

      if (request.defaultPaymentMethod) {
        subscriptionParams.default_payment_method = request.defaultPaymentMethod;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      this.logger.log(`✅ Subscription created: ${subscription.id}`);

      // Extract client secret for payment confirmation if needed
      let clientSecret: string | undefined;
      if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
          const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
          clientSecret = paymentIntent.client_secret || undefined;
        }
      }

      return {
        id: subscription.id,
        status: subscription.status,
        clientSecret,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      };
    } catch (error) {
      this.logger.error('❌ Failed to create subscription:', error);
      throw new InternalServerErrorException('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: atPeriodEnd,
        ...((!atPeriodEnd) && { proration_behavior: 'create_prorations' }),
      });

      this.logger.log(`✅ Subscription ${atPeriodEnd ? 'scheduled for cancellation' : 'cancelled'}: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`❌ Failed to cancel subscription ${subscriptionId}:`, error);
      throw new InternalServerErrorException('Failed to cancel subscription');
    }
  }

  /**
   * Create a refund
   */
  async createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount);
      }

      if (reason) {
        refundParams.reason = reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await this.stripe.refunds.create(refundParams);
      
      this.logger.log(`✅ Refund created: ${refund.id} for payment ${paymentIntentId}`);
      return refund;
    } catch (error) {
      this.logger.error(`❌ Failed to create refund for ${paymentIntentId}:`, error);
      throw new InternalServerErrorException('Failed to create refund');
    }
  }

  /**
   * Verify webhook signature and construct event
   */
  verifyWebhook(payload: string, signature: string): WebhookEvent {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      
      this.logger.debug(`Webhook verified: ${event.type}`);
      
      return {
        id: event.id,
        type: event.type,
        data: event.data,
        created: event.created,
      };
    } catch (error) {
      this.logger.error('❌ Webhook verification failed:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Get Stripe publishable key for frontend
   */
  getPublishableKey(): string {
    return this.configService.get('STRIPE_PUBLISHABLE_KEY', '');
  }

  /**
   * Create a price (for subscriptions)
   */
  async createPrice(
    amount: number,
    currency: string,
    interval: 'month' | 'year',
    productName: string
  ): Promise<Stripe.Price> {
    try {
      // First create a product
      const product = await this.stripe.products.create({
        name: productName,
      });

      // Then create a price for the product
      const price = await this.stripe.prices.create({
        unit_amount: Math.round(amount),
        currency: currency.toLowerCase(),
        recurring: {
          interval: interval,
        },
        product: product.id,
      });

      this.logger.log(`✅ Price created: ${price.id} for product: ${product.id}`);
      return price;
    } catch (error) {
      this.logger.error('❌ Failed to create price:', error);
      throw new InternalServerErrorException('Failed to create price');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      this.logger.error(`❌ Failed to retrieve subscription ${subscriptionId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve subscription');
    }
  }
}
