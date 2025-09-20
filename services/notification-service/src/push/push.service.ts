import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as admin from 'firebase-admin';
import * as webpush from 'web-push';
import { EnvironmentVariables } from '../config/env.validation';

export interface PushRequest {
  tokens: string | string[]; // FCM tokens, APNs tokens, or web push endpoints
  title: string;
  body: string;
  data?: Record<string, string>; // Custom data payload
  imageUrl?: string;
  icon?: string;
  badge?: string;
  sound?: string;
  clickAction?: string; // URL to open when notification is clicked
  actions?: PushAction[]; // Notification actions
  ttl?: number; // Time to live in seconds
  priority?: 'low' | 'normal' | 'high';
  collapseKey?: string; // For Android notification grouping
  tags?: string[];
  metadata?: Record<string, any>;
  trackingId?: string;
  channelId?: string; // Android notification channel
}

export interface PushAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushResult {
  messageId?: string;
  externalId?: string;
  provider: string;
  status: 'sent' | 'queued' | 'failed';
  successCount?: number;
  failureCount?: number;
  results?: PushTokenResult[];
  error?: string;
  metadata?: Record<string, any>;
}

export interface PushTokenResult {
  token: string;
  messageId?: string;
  success: boolean;
  error?: string;
  canonicalToken?: string; // Updated token if changed
  shouldRemove?: boolean; // Token should be removed (invalid/unregistered)
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushStats {
  sent: number;
  delivered: number;
  clicked: number;
  dismissed: number;
  failed: number;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly provider: string;
  private readonly testMode: boolean;
  private firebaseApp?: admin.app.App;
  private webPushConfigured: boolean = false;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.provider = this.configService.get('PUSH_PROVIDER', 'firebase');
    this.testMode = this.configService.get('PUSH_TEST_MODE', false);

    this.initializeProvider();
  }

  /**
   * Send push notification to single or multiple recipients
   */
  async sendPushNotification(request: PushRequest): Promise<PushResult> {
    this.logger.debug(`Sending push notification via ${this.provider}`, {
      recipients: Array.isArray(request.tokens) ? request.tokens.length : 1,
      title: request.title.substring(0, 50),
      trackingId: request.trackingId,
    });

    try {
      // Validate request
      this.validatePushRequest(request);

      // Send via provider
      let result: PushResult;
      
      switch (this.provider) {
        case 'firebase':
          result = await this.sendViaFirebase(request);
          break;
        case 'web-push':
          result = await this.sendViaWebPush(request);
          break;
        case 'apn':
          result = await this.sendViaAPN(request);
          break;
        case 'disabled':
          result = {
            provider: 'disabled',
            status: 'sent',
            successCount: Array.isArray(request.tokens) ? request.tokens.length : 1,
            failureCount: 0,
          };
          break;
        default:
          throw new InternalServerErrorException(`Unsupported push provider: ${this.provider}`);
      }

      // Emit event
      this.eventEmitter.emit('push.sent', {
        provider: this.provider,
        result,
        request,
      });

      this.logger.log(`✅ Push notification sent successfully`, {
        provider: this.provider,
        messageId: result.messageId,
        successCount: result.successCount,
        failureCount: result.failureCount,
        trackingId: request.trackingId,
      });

      return result;
    } catch (error) {
      this.logger.error('❌ Failed to send push notification:', error);

      // Emit error event
      this.eventEmitter.emit('push.failed', {
        provider: this.provider,
        error: error.message,
        request,
      });

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(`Failed to send push notification: ${error.message}`);
    }
  }

  /**
   * Send topic-based push notification (Firebase only)
   */
  async sendTopicNotification(
    topic: string,
    notification: Omit<PushRequest, 'tokens'>
  ): Promise<PushResult> {
    if (this.provider !== 'firebase') {
      throw new InternalServerErrorException('Topic notifications are only supported with Firebase');
    }

    this.logger.debug(`Sending topic notification via Firebase`, {
      topic,
      title: notification.title.substring(0, 50),
    });

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: {
          notification: {
            icon: notification.icon,
            sound: notification.sound || 'default',
            clickAction: notification.clickAction,
            channelId: notification.channelId || 'default',
          },
          ttl: notification.ttl ? notification.ttl * 1000 : undefined,
          priority: this.mapPriorityToAndroid(notification.priority),
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: notification.badge ? parseInt(notification.badge) : undefined,
              sound: notification.sound || 'default',
            },
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon,
            image: notification.imageUrl,
            badge: notification.badge,
            actions: notification.actions,
          },
          fcmOptions: {
            link: notification.clickAction,
          },
        },
      };

      const messageId = await admin.messaging().send(message);

      return {
        messageId,
        externalId: messageId,
        provider: 'firebase',
        status: 'sent',
        successCount: 1, // Topic-based notifications don't provide individual counts
        failureCount: 0,
      };
    } catch (error: any) {
      this.logger.error('❌ Failed to send topic notification:', error);
      throw new InternalServerErrorException(`Firebase topic notification failed: ${error.message}`);
    }
  }

  /**
   * Subscribe tokens to a topic (Firebase only)
   */
  async subscribeToTopic(tokens: string | string[], topic: string): Promise<{
    successCount: number;
    failureCount: number;
    errors?: any[];
  }> {
    if (this.provider !== 'firebase') {
      throw new InternalServerErrorException('Topic subscriptions are only supported with Firebase');
    }

    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    try {
      const response = await admin.messaging().subscribeToTopic(tokenArray, topic);
      
      this.logger.log(`✅ Subscribed ${response.successCount}/${tokenArray.length} tokens to topic ${topic}`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to subscribe tokens to topic ${topic}:`, error);
      throw new InternalServerErrorException(`Topic subscription failed: ${error.message}`);
    }
  }

  /**
   * Unsubscribe tokens from a topic (Firebase only)
   */
  async unsubscribeFromTopic(tokens: string | string[], topic: string): Promise<{
    successCount: number;
    failureCount: number;
    errors?: any[];
  }> {
    if (this.provider !== 'firebase') {
      throw new InternalServerErrorException('Topic subscriptions are only supported with Firebase');
    }

    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokenArray, topic);
      
      this.logger.log(`✅ Unsubscribed ${response.successCount}/${tokenArray.length} tokens from topic ${topic}`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to unsubscribe tokens from topic ${topic}:`, error);
      throw new InternalServerErrorException(`Topic unsubscription failed: ${error.message}`);
    }
  }

  /**
   * Validate push tokens
   */
  async validateTokens(tokens: string[]): Promise<{
    validTokens: string[];
    invalidTokens: string[];
    canonicalTokens: { [oldToken: string]: string };
  }> {
    if (this.provider !== 'firebase') {
      // For other providers, assume all tokens are valid
      return {
        validTokens: tokens,
        invalidTokens: [],
        canonicalTokens: {},
      };
    }

    const validTokens: string[] = [];
    const invalidTokens: string[] = [];
    const canonicalTokens: { [oldToken: string]: string } = {};

    // Firebase doesn't have a direct validation API, so we'll use a dry-run send
    for (const token of tokens) {
      try {
        const message: admin.messaging.Message = {
          token,
          notification: {
            title: 'Test',
            body: 'Validation test',
          },
          dryRun: true,
        };

        await admin.messaging().send(message);
        validTokens.push(token);
      } catch (error: any) {
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(token);
        } else {
          // Consider other errors as valid tokens
          validTokens.push(token);
        }
      }
    }

    return { validTokens, invalidTokens, canonicalTokens };
  }

  /**
   * Get push notification statistics
   */
  async getPushStats(
    dateFrom: Date,
    dateTo: Date,
    filters?: {
      topic?: string;
      platform?: 'android' | 'ios' | 'web';
    }
  ): Promise<PushStats> {
    // This would typically come from Firebase Analytics or other analytics services
    // For now, return mock data
    return {
      sent: 1000,
      delivered: 900,
      clicked: 150,
      dismissed: 600,
      failed: 100,
    };
  }

  // Private methods

  private initializeProvider(): void {
    switch (this.provider) {
      case 'firebase':
        this.initializeFirebase();
        break;
      case 'web-push':
        this.initializeWebPush();
        break;
      case 'apn':
        this.initializeAPN();
        break;
      case 'disabled':
        this.logger.warn('🚫 Push notifications are disabled');
        break;
      default:
        throw new Error(`Unsupported push provider: ${this.provider}`);
    }

    this.logger.log(`✅ Push service initialized with ${this.provider} provider`);
  }

  private initializeFirebase(): void {
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
    const serviceAccountPath = this.configService.get('FIREBASE_SERVICE_ACCOUNT_PATH');

    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID is required for Firebase provider');
    }

    let credential: admin.credential.Credential;

    if (serviceAccountPath) {
      // Use service account file
      credential = admin.credential.cert(serviceAccountPath);
    } else if (privateKey && clientEmail) {
      // Use service account key from environment variables
      credential = admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      });
    } else {
      // Use default credentials (e.g., on GCP)
      credential = admin.credential.applicationDefault();
    }

    this.firebaseApp = admin.initializeApp({
      credential,
      projectId,
    }, 'gongbu-notifications');
  }

  private initializeWebPush(): void {
    const publicKey = this.configService.get('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get('VAPID_PRIVATE_KEY');
    const subject = this.configService.get('VAPID_SUBJECT');

    if (!publicKey || !privateKey) {
      throw new Error('VAPID keys are required for web push provider');
    }

    webpush.setVapidDetails(
      subject || 'mailto:notifications@gongbu.app',
      publicKey,
      privateKey
    );

    this.webPushConfigured = true;
  }

  private initializeAPN(): void {
    // TODO: Initialize Apple Push Notifications
    throw new Error('Apple Push Notifications provider not implemented yet');
  }

  private validatePushRequest(request: PushRequest): void {
    if (!request.tokens || (Array.isArray(request.tokens) && request.tokens.length === 0)) {
      throw new Error('Push tokens are required');
    }

    if (!request.title?.trim()) {
      throw new Error('Title is required');
    }

    if (!request.body?.trim()) {
      throw new Error('Body is required');
    }

    // Validate title and body length (platform limits)
    if (request.title.length > 65) {
      throw new Error('Title must be 65 characters or less');
    }

    if (request.body.length > 240) {
      throw new Error('Body must be 240 characters or less');
    }
  }

  private async sendViaFirebase(request: PushRequest): Promise<PushResult> {
    const tokens = Array.isArray(request.tokens) ? request.tokens : [request.tokens];
    
    // Prepare the message
    const baseMessage = {
      notification: {
        title: request.title,
        body: request.body,
        imageUrl: request.imageUrl,
      },
      data: {
        ...request.data,
        ...(request.trackingId && { trackingId: request.trackingId }),
      },
      android: {
        notification: {
          icon: request.icon,
          sound: request.sound || 'default',
          clickAction: request.clickAction,
          channelId: request.channelId || 'default',
        },
        ttl: request.ttl ? request.ttl * 1000 : undefined,
        priority: this.mapPriorityToAndroid(request.priority),
        collapseKey: request.collapseKey,
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: request.title,
              body: request.body,
            },
            badge: request.badge ? parseInt(request.badge) : undefined,
            sound: request.sound || 'default',
          },
        },
      },
      webpush: {
        notification: {
          title: request.title,
          body: request.body,
          icon: request.icon,
          image: request.imageUrl,
          badge: request.badge,
          actions: request.actions,
        },
        fcmOptions: {
          link: request.clickAction,
        },
      },
    };

    if (tokens.length === 1) {
      // Single token
      const message: admin.messaging.Message = {
        ...baseMessage,
        token: tokens[0],
      };

      try {
        const messageId = await admin.messaging().send(message);
        
        return {
          messageId,
          externalId: messageId,
          provider: 'firebase',
          status: 'sent',
          successCount: 1,
          failureCount: 0,
        };
      } catch (error: any) {
        throw new Error(`Firebase error: ${error.message}`);
      }
    } else {
      // Multiple tokens
      const messages: admin.messaging.Message[] = tokens.map(token => ({
        ...baseMessage,
        token,
      }));

      try {
        const response = await admin.messaging().sendAll(messages);
        
        const results: PushTokenResult[] = response.responses.map((result, index) => ({
          token: tokens[index],
          messageId: result.messageId,
          success: result.success,
          error: result.error?.message,
          shouldRemove: this.shouldRemoveToken(result.error),
        }));

        return {
          provider: 'firebase',
          status: response.failureCount === 0 ? 'sent' : (response.successCount === 0 ? 'failed' : 'sent'),
          successCount: response.successCount,
          failureCount: response.failureCount,
          results,
          metadata: { multicastId: (response as any).multicastId },
        };
      } catch (error: any) {
        throw new Error(`Firebase multicast error: ${error.message}`);
      }
    }
  }

  private async sendViaWebPush(request: PushRequest): Promise<PushResult> {
    if (!this.webPushConfigured) {
      throw new Error('Web push not configured');
    }

    const subscriptions = Array.isArray(request.tokens) ? request.tokens : [request.tokens];
    const results: PushTokenResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    const payload = JSON.stringify({
      title: request.title,
      body: request.body,
      icon: request.icon,
      image: request.imageUrl,
      badge: request.badge,
      data: request.data,
      actions: request.actions,
      tag: request.collapseKey,
      requireInteraction: request.priority === 'high',
    });

    const options: webpush.RequestOptions = {
      TTL: request.ttl || 86400, // 24 hours default
      urgency: request.priority === 'high' ? 'high' : (request.priority === 'low' ? 'low' : 'normal'),
      headers: request.trackingId ? { 'X-Tracking-ID': request.trackingId } : undefined,
    };

    for (const subscriptionData of subscriptions) {
      try {
        let subscription: WebPushSubscription;
        
        if (typeof subscriptionData === 'string') {
          // Assume it's JSON string
          subscription = JSON.parse(subscriptionData);
        } else {
          subscription = subscriptionData as unknown as WebPushSubscription;
        }

        const result = await webpush.sendNotification(subscription, payload, options);
        
        results.push({
          token: subscriptionData,
          success: true,
          messageId: result.headers?.['x-message-id'] as string,
        });
        
        successCount++;
      } catch (error: any) {
        results.push({
          token: subscriptionData,
          success: false,
          error: error.message,
          shouldRemove: error.statusCode === 410, // Gone - subscription expired
        });
        
        failureCount++;
      }
    }

    return {
      provider: 'web-push',
      status: failureCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'sent'),
      successCount,
      failureCount,
      results,
    };
  }

  private async sendViaAPN(request: PushRequest): Promise<PushResult> {
    // TODO: Implement Apple Push Notifications
    throw new Error('Apple Push Notifications not implemented yet');
  }

  private mapPriorityToAndroid(priority?: string): 'normal' | 'high' {
    return priority === 'high' ? 'high' : 'normal';
  }

  private shouldRemoveToken(error?: admin.messaging.MessagingError): boolean {
    if (!error) return false;
    
    return error.code === 'messaging/registration-token-not-registered' ||
           error.code === 'messaging/invalid-registration-token';
  }
}
