const axios = require('axios');

const getNotificationConfig = () => {
  const emailEndpoint = process.env.EMAIL_PROVIDER_URL || process.env.EMAIL_WEBHOOK_URL || '';
  const whatsappWebhook = process.env.WHATSAPP_WEBHOOK_URL || '';
  const whatsappMetaToken = process.env.WHATSAPP_META_TOKEN || '';
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  return {
    email: {
      enabled: Boolean(emailEndpoint),
      endpoint: emailEndpoint || null,
      provider: process.env.EMAIL_PROVIDER_NAME || 'generic-webhook',
    },
    whatsapp: {
      enabled: Boolean((whatsappMetaToken && whatsappPhoneNumberId) || whatsappWebhook),
      provider: whatsappMetaToken && whatsappPhoneNumberId ? 'meta-cloud-api' : 'generic-webhook',
      webhook: whatsappWebhook || null,
      phoneNumberId: whatsappPhoneNumberId || null,
    },
  };
};

const sendEmailNotification = async ({ to, subject, message, html, metadata = {} }) => {
  const endpoint = process.env.EMAIL_PROVIDER_URL || process.env.EMAIL_WEBHOOK_URL;
  if (!endpoint) {
    throw Object.assign(new Error('Email provider is not configured'), { status: 400, code: 'EMAIL_NOT_CONFIGURED' });
  }
  if (!to) {
    throw Object.assign(new Error('Email destination is required'), { status: 400, code: 'EMAIL_DESTINATION_REQUIRED' });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.EMAIL_PROVIDER_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EMAIL_PROVIDER_TOKEN}`;
  }

  const response = await axios.post(endpoint, { to, subject, message, html, metadata }, { headers, timeout: 10000 });
  return { channel: 'email', status: 'sent', providerStatus: response.status, providerResponse: response.data };
};

const sendWhatsAppNotification = async ({ to, message, metadata = {} }) => {
  if (!to) {
    throw Object.assign(new Error('WhatsApp destination phone is required'), { status: 400, code: 'WHATSAPP_DESTINATION_REQUIRED' });
  }

  const token = process.env.WHATSAPP_META_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const webhook = process.env.WHATSAPP_WEBHOOK_URL;

  if (token && phoneNumberId) {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );
    return { channel: 'whatsapp', status: 'sent', provider: 'meta-cloud-api', providerStatus: response.status, providerResponse: response.data };
  }

  if (webhook) {
    const response = await axios.post(webhook, { to, message, metadata }, { timeout: 10000 });
    return { channel: 'whatsapp', status: 'sent', provider: 'generic-webhook', providerStatus: response.status, providerResponse: response.data };
  }

  throw Object.assign(new Error('WhatsApp provider is not configured'), { status: 400, code: 'WHATSAPP_NOT_CONFIGURED' });
};

module.exports = {
  getNotificationConfig,
  sendEmailNotification,
  sendWhatsAppNotification,
};
