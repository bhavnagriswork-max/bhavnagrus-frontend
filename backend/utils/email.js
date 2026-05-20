const nodemailer = require('nodemailer');
const pool = require('../config/db');

const sendOrderEmail = async (order, items, adminEmail = 'harshmn0@gmail.com') => {
    try {
        const [settings] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('smtp_user', 'smtp_pass', 'admin_order_email')");
        const smtpUser = settings.find(s => s.setting_key === 'smtp_user')?.setting_value;
        const smtpPass = settings.find(s => s.setting_key === 'smtp_pass')?.setting_value;
        const targetAdminEmail = settings.find(s => s.setting_key === 'admin_order_email')?.setting_value || adminEmail;

        if (!smtpUser || !smtpPass) return;

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: smtpUser, pass: smtpPass }
        });

        const itemsList = items.map(item => `
            <div style="padding: 15px 0; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <span style="font-weight: 600; color: #1a1a1a;">${item.name}</span>
                    <br/><span style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Qty: ${item.quantity}</span>
                </div>
                <div style="font-weight: 700; color: #c5a059;">₹${item.selling_price * item.quantity}</div>
            </div>
        `).join('');

        const trackingLink = `http://localhost:4201/track-order/${order.order_number}`;

        // Customer Email (Royal Heritage Theme)
        if (order.customer_email) {
            await transporter.sendMail({
                from: `"Bhavnagris Heritage" <${smtpUser}>`,
                to: order.customer_email,
                subject: `A Royal Selection Awaits: #${order.order_number}`,
                html: `
                    <div style="background-color: #fafafa; padding: 40px 20px; font-family: 'Georgia', serif;">
                        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border-top: 6px solid #c5a059;">
                            <div style="padding: 40px; text-align: center; background: #111;">
                                <h1 style="color: #c5a059; margin: 0; font-size: 28px; letter-spacing: 4px; text-transform: uppercase;">Bhavnagris</h1>
                                <p style="color: #666; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px;">Est. 1948 • Heritage Foods</p>
                            </div>
                            <div style="padding: 50px 40px;">
                                <h2 style="color: #111; font-size: 22px; margin-bottom: 20px;">Pranam, ${order.customer_name}</h2>
                                <p style="color: #444; line-height: 1.8; font-size: 15px;">Your selection of traditional Gujarati flavors has been received in our heritage kitchen. We are currently hand-picking the finest batches to ensure your experience is nothing short of royal.</p>
                                
                                <div style="margin: 40px 0; border: 1px solid #c5a059; padding: 30px; background: #fffcf5;">
                                    <h3 style="color: #c5a059; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; margin-top: 0;">Order Inventory</h3>
                                    ${itemsList}
                                    <div style="margin-top: 20px; text-align: right;">
                                        <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Total Investment</p>
                                        <p style="font-size: 24px; font-weight: 700; color: #111; margin: 0;">₹${order.total_amount}</p>
                                    </div>
                                </div>

                                <div style="text-align: center; margin-top: 40px;">
                                    <a href="${trackingLink}" style="display: inline-block; padding: 18px 35px; background: #111; color: #c5a059; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; border: 1px solid #c5a059;">Track Your Consignment</a>
                                </div>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9; text-align: center; border-top: 1px solid #eee;">
                                <p style="font-size: 11px; color: #999; margin: 0;">This is an automated dispatch from the Bhavnagris Executive Portal.</p>
                                <p style="font-size: 11px; color: #999; margin-top: 5px;">The Taste of Tradition, Since 1948.</p>
                            </div>
                        </div>
                    </div>
                `
            });
        }

        // Admin Email
        await transporter.sendMail({
            from: `"Bhavnagris Dispatch" <${smtpUser}>`,
            to: targetAdminEmail,
            subject: `Action Required: New Heritage Order #${order.order_number}`,
            html: `<div style="padding: 20px; font-family: sans-serif;"><h2>New Order Placed</h2><p><b>Order:</b> #${order.order_number}</p><p><b>Customer:</b> ${order.customer_name} (${order.customer_mobile})</p><p><b>Total:</b> ₹${order.total_amount}</p></div>`
        });
        
    } catch (error) {
        console.error('Email Error:', error);
    }
};

const sendStatusUpdateEmail = async (orderNumber, status, note) => {
    try {
        const [orders] = await pool.query("SELECT * FROM orders WHERE order_number = ?", [orderNumber]);
        if (orders.length === 0 || !orders[0].customer_email) return;

        const order = orders[0];
        const [settings] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('smtp_user', 'smtp_pass')");
        const smtpUser = settings.find(s => s.setting_key === 'smtp_user')?.setting_value;
        const smtpPass = settings.find(s => s.setting_key === 'smtp_pass')?.setting_value;

        if (!smtpUser || !smtpPass) return;

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: smtpUser, pass: smtpPass }
        });

        const trackingLink = `http://localhost:4201/track-order/${orderNumber}`;

        await transporter.sendMail({
            from: `"Bhavnagris Heritage" <${smtpUser}>`,
            to: order.customer_email,
            subject: `Update on Your Heritage Box: #${orderNumber}`,
            html: `
                <div style="background-color: #fafafa; padding: 40px 20px; font-family: 'Georgia', serif;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05);">
                        <div style="padding: 30px; text-align: center; background: #c5a059;">
                            <h1 style="color: #fff; margin: 0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">Order Milestone</h1>
                        </div>
                        <div style="padding: 50px 40px; text-align: center;">
                            <p style="color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Current Status</p>
                            <h2 style="color: #111; font-size: 32px; margin: 0; font-style: italic;">${status}</h2>
                            
                            <div style="margin: 40px 0; height: 1px; background: linear-gradient(to right, transparent, #c5a059, transparent);"></div>
                            
                            ${note ? `<p style="color: #444; line-height: 1.8; font-size: 16px; font-style: italic;">"${note}"</p>` : `<p style="color: #444; line-height: 1.8; font-size: 16px;">Your heritage snack box has moved to the next stage of its journey.</p>`}
                            
                            <div style="margin-top: 50px;">
                                <a href="${trackingLink}" style="display: inline-block; padding: 18px 35px; background: #111; color: #c5a059; text-decoration: none; border-radius: 2px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Track Progression</a>
                            </div>
                        </div>
                    </div>
                </div>
            `
        });
    } catch (error) {
        console.error('Status Email Error:', error);
    }
};

const sendInquiryEmail = async (inquiry, adminEmail = 'harshmn0@gmail.com') => {
    try {
        const [settings] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('smtp_user', 'smtp_pass', 'admin_order_email')");
        const smtpUser = settings.find(s => s.setting_key === 'smtp_user')?.setting_value;
        const smtpPass = settings.find(s => s.setting_key === 'smtp_pass')?.setting_value;
        const targetEmail = settings.find(s => s.setting_key === 'admin_order_email')?.setting_value || adminEmail;

        if (!smtpUser || !smtpPass) return;

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: smtpUser, pass: smtpPass }
        });

        const mailOptions = {
            from: `"Bhavnagris Heritage" <${smtpUser}>`,
            to: targetEmail,
            subject: `New Inquiry: ${inquiry.subject}`,
            html: `
                <div style="font-family: serif; padding: 40px; background-color: #fcfcfc; border: 1px solid #eee;">
                    <h2 style="color: #c5a059; border-bottom: 2px solid #c5a059; padding-bottom: 10px;">New Message Received</h2>
                    <div style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                        <p><strong>From:</strong> ${inquiry.name} (${inquiry.email})</p>
                        <p><strong>Mobile:</strong> ${inquiry.mobile}</p>
                        <p><strong>Subject:</strong> ${inquiry.subject}</p>
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin-top: 20px;">
                            <strong>Message:</strong><br/>
                            ${inquiry.message}
                        </div>
                    </div>
                    <p style="font-size: 11px; color: #999;">Automated notification from Bhavnagar Admin Panel</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Inquiry Email Error:', error);
    }
};

module.exports = { sendOrderEmail, sendInquiryEmail, sendStatusUpdateEmail };
