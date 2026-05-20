const pool = require('../config/db');
const { sendInquiryEmail } = require('../utils/email');

const submitContactForm = async (req, res) => {
    try {
        const { name, email, mobile, subject, message } = req.body;
        
        await pool.query(
            'INSERT INTO contact_inquiries (name, email, mobile, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, mobile, subject, message]
        );
        
        // Notify admin asynchronously
        sendInquiryEmail({ name, email, mobile, subject, message });

        res.status(201).json({ message: 'Inquiry submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getInquiriesAdmin = async (req, res) => {
    try {
        const [inquiries] = await pool.query('SELECT * FROM contact_inquiries ORDER BY created_at DESC');
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateInquiryStatusAdmin = async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE contact_inquiries SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Inquiry status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    submitContactForm, getInquiriesAdmin, updateInquiryStatusAdmin
};
