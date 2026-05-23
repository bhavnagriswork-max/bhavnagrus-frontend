const axios = require('axios');
const pool = require('../config/db');

/**
 * Sends a real-time WhatsApp order confirmation alert to the customer.
 * Fully configurable via the database registry and designed to execute asynchronously.
 */
const sendWhatsAppOrderAlert = async (order, items) => {
    try {
        // 1. Fetch settings from DB
        const [settingsRows] = await pool.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('whatsapp_enabled', 'whatsapp_provider', 'whatsapp_instance_id', 'whatsapp_token', 'whatsapp_sender_number')"
        );
        
        const settings = {};
        settingsRows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        const isEnabled = settings.whatsapp_enabled === 'true';
        const provider = settings.whatsapp_provider || 'ultramsg';
        const token = settings.whatsapp_token;
        const instanceId = settings.whatsapp_instance_id;
        const sender = settings.whatsapp_sender_number;
        const customerMobile = order.customer_mobile ? order.customer_mobile.toString().trim() : '';

        // Graceful exit if WhatsApp alerts are unconfigured or disabled
        if (!isEnabled || !token || !customerMobile) {
            console.log('WhatsApp notifications are disabled or missing necessary credentials.');
            return;
        }

        // 2. Normalize and format phone number (ensure country code e.g. +91)
        let formattedMobile = customerMobile;
        // Strip any spaces or special characters
        formattedMobile = formattedMobile.replace(/[\s\-+]/g, '');
        // If it starts with 10 digits, prefix with country code (defaulting to 91 for India)
        if (formattedMobile.length === 10) {
            formattedMobile = '91' + formattedMobile;
        } else if (formattedMobile.length === 12 && formattedMobile.startsWith('91')) {
            // Already has 91 prefix
        } else {
            // Leave as is, let the gateway try to deliver
        }

        // 3. Format items ordered list
        const itemListText = items.map(item => {
            const qty = item.quantity || 1;
            const price = parseFloat(item.selling_price || item.product_price || 0);
            return `• ${item.name || item.product_name} (Qty: ${qty} x ₹${price})`;
        }).join('\n');

        // 4. Compose beautiful, premium transactional alert body
        const messageBody = 
`👑 *BHAVNAGRIS HERITAGE* 👑

Namaste *${order.customer_name}*,

Thank you for your order! We are preparing your premium Gujarati snacks with love, heritage, and the highest standards of culinary excellence.

📦 *Order dossier:*
• Order Number: *${order.order_number}*
• Total Payable: *₹${parseFloat(order.total_amount).toFixed(2)}*
• Payment Method: *${order.payment_method === 'ONLINE' ? 'Online Payment (Razorpay)' : order.payment_method}*

🚚 *Shipping Destination:*
• ${order.address_line1}${order.address_line2 ? ', ' + order.address_line2 : ''}
• ${order.city}, ${order.state || 'Gujarat'} - ${order.pincode}

✨ *Items in your Basket:*
${itemListText}

We will send you another update with tracking info as soon as your box is dispatched via our courier network!

Warm regards,
*Bhavnagris Heritage Team*
Explore Heritage: www.bhavnagris.store`;

        console.log(`Assembling WhatsApp order alert for ${formattedMobile} (Provider: ${provider})...`);

        // 5. Send message based on provider
        if (provider === 'ultramsg') {
            const endpoint = `https://api.ultramsg.com/${instanceId}/messages/chat`;
            const payload = {
                token: token,
                to: formattedMobile,
                body: messageBody
            };
            
            console.log(`Dispatching to UltraMsg: ${endpoint}`);
            const response = await axios.post(endpoint, new URLSearchParams(payload).toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            
            if (response.data && (response.data.sent === 'true' || response.data.success)) {
                console.log(`WhatsApp Alert successfully sent via UltraMsg. ID: ${response.data.id || 'N/A'}`);
            } else {
                console.warn('UltraMsg alert request dispatched but returned non-success structure:', response.data);
            }
            
        } else if (provider === 'twilio') {
            const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${instanceId}/Messages.json`;
            const twilioSender = sender.startsWith('whatsapp:') ? sender : `whatsapp:${sender || '+14155238886'}`;
            const twilioReceiver = `whatsapp:+${formattedMobile}`;
            
            const authHeader = Buffer.from(`${instanceId}:${token}`).toString('base64');
            const payload = {
                From: twilioSender,
                To: twilioReceiver,
                Body: messageBody
            };
            
            console.log(`Dispatching to Twilio: ${endpoint}`);
            const response = await axios.post(endpoint, new URLSearchParams(payload).toString(), {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            if (response.data && response.data.sid) {
                console.log(`WhatsApp Alert successfully sent via Twilio. SID: ${response.data.sid}`);
            }
        } else {
            console.error(`Unsupported WhatsApp provider configuration: ${provider}`);
        }

    } catch (error) {
        // Silent catch so that communication failures never block the core checkout flow
        console.error('WhatsApp Notification Dispatch Failure:', error.response?.data || error.message);
    }
};

module.exports = { sendWhatsAppOrderAlert };
