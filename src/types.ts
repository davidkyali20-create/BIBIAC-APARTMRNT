/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Contact {
  id: string;
  name: string;
  phone: string;
  group: string;
  createdAt: string;
}

export interface SmsTemplate {
  id: string;
  title: string;
  content: string;
  category: 'Reminder' | 'Alert' | 'Promo' | 'Billing' | 'General';
}

export type SmsStatus = 'delivered' | 'sent' | 'failed' | 'pending';

export interface SmsLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  provider: 'twilio' | 'africastalking' | 'simulator';
  status: SmsStatus;
  errorMessage?: string;
  timestamp: string;
}

export interface ProviderConfigStatus {
  twilioConfigured: boolean;
  africasTalkingConfigured: boolean;
  geminiConfigured: boolean;
}
