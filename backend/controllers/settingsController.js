const pool = require('../config/db');

// @desc    Get public settings (hero, website name, etc)
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = async (req, res) => {
    try {
        const publicKeys = [
            'website_name', 'hero_title', 'hero_subtitle', 'hero_image', 'hero_video_url',
            'hero_badge', 'hero_cta_text',
            'products_title', 'products_subtitle',
            'cta_title', 'cta_button_text',
            'trust_1_title', 'trust_1_subtitle', 'trust_2_title', 'trust_2_subtitle',
            'trust_3_title', 'trust_3_subtitle', 'trust_4_title', 'trust_4_subtitle',
            'mission_title', 'mission_subtitle',
            'login_image', 'website_greeting'
        ];
        const [settings] = await pool.query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)', [publicKeys]);
        
        // Convert to object for easier use
        const config = {};
        settings.forEach(s => {
            config[s.setting_key] = s.setting_value;
        });
        
        res.json(config);
    } catch (error) {
        console.error('Settings Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get UPI payment settings
// @route   GET /api/settings/upi
// @access  Public
const getUpiSettings = async (req, res) => {
    try {
        const upiKeys = ['upi_id', 'upi_name', 'upi_qr_image'];
        const [settings] = await pool.query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)', [upiKeys]);
        
        const config = {};
        settings.forEach(s => {
            config[s.setting_key] = s.setting_value;
        });
        
        res.json(config);
    } catch (error) {
        console.error('UPI Settings Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getPublicSettings, getUpiSettings };
