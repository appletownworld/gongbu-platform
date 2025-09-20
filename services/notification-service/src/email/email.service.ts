import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';
import * as mailgunJs from 'mailgun.js';
import { EnvironmentVariables } from '../config/env.validation';

export interface EmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  templateId?: string;
  templateData?: Record<string, any>;
  tags?: string[];
  metadata?: Record<string, any>;
  trackingId?: string;
  replyTo?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  cid?: string; // Content-ID for inline attachments
}

export interface EmailResult {
  messageId?: string;
  externalId?: string;
  provider: string;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

export interface EmailStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complaints: number;
  unsubscribed: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly replyTo?: string;
  private readonly testMode: boolean;
  private readonly testRecipient?: string;

  // Provider clients
  private smtpTransporter?: nodemailer.Transporter;
  private mailgunClient?: any;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.provider = this.configService.get('EMAIL_PROVIDER', 'sendgrid');
    this.fromEmail = this.configService.get('EMAIL_FROM', 'notifications@gongbu.app');
    this.fromName = this.configService.get('EMAIL_FROM_NAME', 'Gongbu Learning Platform');
    this.replyTo = this.configService.get('EMAIL_REPLY_TO');
    this.testMode = this.configService.get('EMAIL_TEST_MODE', false);
    this.testRecipient = this.configService.get('TEST_EMAIL_RECIPIENT');

    this.initializeProvider();
  }

  /**
   * Send a single email
   */
  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    this.logger.debug(`Sending email via ${this.provider}`, {
      to: Array.isArray(request.to) ? request.to.length : 1,
      subject: request.subject.substring(0, 50),
      trackingId: request.trackingId,
    });

    try {
      // Validate request
      this.validateEmailRequest(request);

      // Apply test mode if enabled
      const finalRequest = this.applyTestMode(request);

      // Send via provider
      let result: EmailResult;
      
      switch (this.provider) {
        case 'sendgrid':
          result = await this.sendViaProvider(finalRequest);
          break;
        case 'mailgun':
          result = await this.sendViaProvider(finalRequest);
          break;
        case 'smtp':
          result = await this.sendViaProvider(finalRequest);
          break;
        case 'ses':
          result = await this.sendViaProvider(finalRequest);
          break;
        default:
          throw new InternalServerErrorException(`Unsupported email provider: ${this.provider}`);
      }

      // Emit event
      this.eventEmitter.emit('email.sent', {
        provider: this.provider,
        result,
        request: finalRequest,
      });

      this.logger.log(`✅ Email sent successfully`, {
        provider: this.provider,
        messageId: result.messageId,
        externalId: result.externalId,
        to: Array.isArray(finalRequest.to) ? finalRequest.to.length : 1,
        trackingId: request.trackingId,
      });

      return result;
    } catch (error) {
      this.logger.error('❌ Failed to send email:', error);

      // Emit error event
      this.eventEmitter.emit('email.failed', {
        provider: this.provider,
        error: error.message,
        request,
      });

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    requests: EmailRequest[],
    options?: {
      batchSize?: number;
      delayBetweenBatches?: number;
      failFast?: boolean;
    }
  ): Promise<EmailResult[]> {
    const batchSize = options?.batchSize || 100;
    const delayBetweenBatches = options?.delayBetweenBatches || 1000;
    const failFast = options?.failFast || false;

    this.logger.log(`Sending ${requests.length} bulk emails via ${this.provider}`, {
      batchSize,
      delayBetweenBatches,
    });

    const results: EmailResult[] = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      this.logger.debug(`Processing email batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(requests.length / batchSize)}`, {
        batchSize: batch.length,
      });

      // Send batch
      const batchPromises = batch.map(request => 
        this.sendEmail(request).catch(error => {
          if (failFast) throw error;
          
          this.logger.warn(`Failed to send email in bulk:`, error.message);
          return {
            messageId: undefined,
            externalId: undefined,
            provider: this.provider,
            status: 'failed' as const,
            error: error.message,
          };
        })
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        if (failFast) {
          this.logger.error('❌ Bulk email sending failed fast:', error);
          throw error;
        }
      }

      // Delay between batches
      if (i + batchSize < requests.length && delayBetweenBatches > 0) {
        await this.delay(delayBetweenBatches);
      }
    }

    const successCount = results.filter(r => r.status === 'sent' || r.status === 'queued').length;
    
    this.logger.log(`✅ Bulk email sending completed`, {
      total: requests.length,
      successful: successCount,
      failed: requests.length - successCount,
      successRate: `${((successCount / requests.length) * 100).toFixed(1)}%`,
    });

    return results;
  }

  /**
   * Verify email deliverability
   */
  async verifyEmailAddress(email: string): Promise<{
    valid: boolean;
    reason?: string;
    suggestions?: string[];
  }> {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        reason: 'Invalid email format',
      };
    }

    // TODO: Implement more sophisticated validation
    // - DNS MX record check
    // - Disposable email detection
    // - Role account detection
    // - Typo detection with suggestions

    return { valid: true };
  }

  /**
   * Get email statistics
   */
  async getEmailStats(
    dateFrom: Date,
    dateTo: Date,
    filters?: {
      templateId?: string;
      tags?: string[];
    }
  ): Promise<EmailStats> {
    // This would typically come from the provider's API
    // For now, return mock data
    return {
      sent: 1000,
      delivered: 950,
      opened: 380,
      clicked: 76,
      bounced: 25,
      complaints: 2,
      unsubscribed: 5,
    };
  }

  /**
   * Handle webhook events from email providers
   */
  async handleWebhook(
    provider: string,
    eventType: string,
    payload: any,
    signature?: string
  ): Promise<void> {
    this.logger.debug(`Processing email webhook`, {
      provider,
      eventType,
      hasSignature: !!signature,
    });

    try {
      // Verify webhook signature
      if (signature && !this.verifyWebhookSignature(provider, payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Process webhook event
      await this.processWebhookEvent(provider, eventType, payload);

      this.logger.log(`✅ Email webhook processed`, {
        provider,
        eventType,
      });
    } catch (error) {
      this.logger.error('❌ Failed to process email webhook:', error);
      throw error;
    }
  }

  // Private methods

  private initializeProvider(): void {
    switch (this.provider) {
      case 'sendgrid':
        this.initializeSendGrid();
        break;
      case 'mailgun':
        this.initializeMailgun();
        break;
      case 'smtp':
        this.initializeSMTP();
        break;
      case 'ses':
        this.initializeAWSSES();
        break;
      default:
        throw new Error(`Unsupported email provider: ${this.provider}`);
    }

    this.logger.log(`✅ Email service initialized with ${this.provider} provider`);
  }

  private initializeSendGrid(): void {
    const apiKey = this.configService.get('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is required for SendGrid provider');
    }
    
    sgMail.setApiKey(apiKey);
  }

  private initializeMailgun(): void {
    const apiKey = this.configService.get('MAILGUN_API_KEY');
    const domain = this.configService.get('MAILGUN_DOMAIN');
    
    if (!apiKey || !domain) {
      throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN are required for Mailgun provider');
    }

    const mailgun = new mailgunJs.default({ host: 'api.eu.mailgun.net' }); // EU endpoint
    this.mailgunClient = mailgun.client({
      username: 'api',
      key: apiKey,
    });
  }

  private initializeSMTP(): void {
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_USER');
    const password = this.configService.get('SMTP_PASSWORD');
    const secure = this.configService.get('SMTP_SECURE');

    if (!host || !port || !user || !password) {
      throw new Error('SMTP configuration is incomplete');
    }

    this.smtpTransporter = nodemailer.createTransporter({
      host,
      port,
      secure,
      auth: { user, pass: password },
      pool: true,
      maxConnections: 10,
      maxMessages: 100,
    });
  }

  private initializeAWSSES(): void {
    // TODO: Initialize AWS SES
    throw new Error('AWS SES provider not implemented yet');
  }

  private validateEmailRequest(request: EmailRequest): void {
    if (!request.to || (Array.isArray(request.to) && request.to.length === 0)) {
      throw new Error('Recipients are required');
    }

    if (!request.subject?.trim()) {
      throw new Error('Subject is required');
    }

    if (!request.html?.trim() && !request.text?.trim()) {
      throw new Error('Email content (HTML or text) is required');
    }

    // Validate email addresses
    const recipients = Array.isArray(request.to) ? request.to : [request.to];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    }
  }

  private applyTestMode(request: EmailRequest): EmailRequest {
    if (!this.testMode || !this.testRecipient) {
      return request;
    }

    this.logger.warn(`🧪 Test mode enabled - redirecting emails to ${this.testRecipient}`);

    return {
      ...request,
      to: this.testRecipient,
      cc: undefined,
      bcc: undefined,
      subject: `[TEST] ${request.subject}`,
      html: request.html ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin-bottom: 20px;">
          <strong>🧪 TEST MODE</strong><br>
          Original recipients: ${Array.isArray(request.to) ? request.to.join(', ') : request.to}
        </div>
        ${request.html}
      ` : undefined,
    };
  }

  private async sendViaProvider(request: EmailRequest): Promise<EmailResult> {
    switch (this.provider) {
      case 'sendgrid':
        return this.sendViaSendGrid(request);
      case 'mailgun':
        return this.sendViaMailgun(request);
      case 'smtp':
        return this.sendViaSMTP(request);
      default:
        throw new Error(`Provider ${this.provider} not implemented`);
    }
  }

  private async sendViaSendGrid(request: EmailRequest): Promise<EmailResult> {
    const message: sgMail.MailDataRequired = {
      to: request.to,
      cc: request.cc,
      bcc: request.bcc,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      replyTo: request.replyTo || this.replyTo,
      subject: request.subject,
      html: request.html,
      text: request.text,
      headers: {
        ...request.headers,
        ...(request.trackingId && { 'X-Tracking-ID': request.trackingId }),
      },
      customArgs: request.metadata,
      categories: request.tags,
      attachments: request.attachments?.map(att => ({
        filename: att.filename,
        content: att.content?.toString('base64') || '',
        type: att.contentType,
        disposition: att.cid ? 'inline' : 'attachment',
        contentId: att.cid,
      })),
    };

    try {
      const [response] = await sgMail.send(message);
      
      return {
        messageId: response.headers['x-message-id'] as string,
        externalId: response.headers['x-message-id'] as string,
        provider: 'sendgrid',
        status: 'sent',
        metadata: {
          statusCode: response.statusCode,
          headers: response.headers,
        },
      };
    } catch (error: any) {
      throw new Error(`SendGrid error: ${error.message}`);
    }
  }

  private async sendViaMailgun(request: EmailRequest): Promise<EmailResult> {
    const domain = this.configService.get('MAILGUN_DOMAIN');
    
    const messageData: any = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: Array.isArray(request.to) ? request.to.join(',') : request.to,
      subject: request.subject,
      html: request.html,
      text: request.text,
    };

    if (request.cc) {
      messageData.cc = Array.isArray(request.cc) ? request.cc.join(',') : request.cc;
    }

    if (request.bcc) {
      messageData.bcc = Array.isArray(request.bcc) ? request.bcc.join(',') : request.bcc;
    }

    if (request.replyTo || this.replyTo) {
      messageData['h:Reply-To'] = request.replyTo || this.replyTo;
    }

    if (request.trackingId) {
      messageData['v:tracking-id'] = request.trackingId;
    }

    if (request.tags) {
      request.tags.forEach(tag => {
        messageData['o:tag'] = tag;
      });
    }

    try {
      const response = await this.mailgunClient.messages.create(domain!, messageData);
      
      return {
        messageId: response.id,
        externalId: response.id,
        provider: 'mailgun',
        status: 'sent',
        metadata: response,
      };
    } catch (error: any) {
      throw new Error(`Mailgun error: ${error.message}`);
    }
  }

  private async sendViaSMTP(request: EmailRequest): Promise<EmailResult> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const message: nodemailer.SendMailOptions = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: request.to,
      cc: request.cc,
      bcc: request.bcc,
      replyTo: request.replyTo || this.replyTo,
      subject: request.subject,
      html: request.html,
      text: request.text,
      headers: {
        ...request.headers,
        ...(request.trackingId && { 'X-Tracking-ID': request.trackingId }),
      },
      attachments: request.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        contentType: att.contentType,
        cid: att.cid,
      })),
    };

    try {
      const result = await this.smtpTransporter.sendMail(message);
      
      return {
        messageId: result.messageId,
        externalId: result.messageId,
        provider: 'smtp',
        status: 'sent',
        metadata: result,
      };
    } catch (error: any) {
      throw new Error(`SMTP error: ${error.message}`);
    }
  }

  private verifyWebhookSignature(provider: string, payload: any, signature: string): boolean {
    // TODO: Implement signature verification for each provider
    switch (provider) {
      case 'sendgrid':
        return this.verifySendGridSignature(payload, signature);
      case 'mailgun':
        return this.verifyMailgunSignature(payload, signature);
      default:
        return true; // Skip verification for unsupported providers
    }
  }

  private verifySendGridSignature(payload: any, signature: string): boolean {
    // TODO: Implement SendGrid webhook signature verification
    return true;
  }

  private verifyMailgunSignature(payload: any, signature: string): boolean {
    // TODO: Implement Mailgun webhook signature verification
    return true;
  }

  private async processWebhookEvent(provider: string, eventType: string, payload: any): Promise<void> {
    // Emit webhook event for processing by other services
    this.eventEmitter.emit('email.webhook', {
      provider,
      eventType,
      payload,
      timestamp: new Date(),
    });

    // TODO: Update notification delivery status based on webhook events
    // - delivered: Email was successfully delivered
    // - opened: Email was opened by recipient
    // - clicked: Link in email was clicked
    // - bounced: Email bounced
    // - dropped: Email was dropped by provider
    // - spamreport: Email was marked as spam
    // - unsubscribe: User unsubscribed
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
