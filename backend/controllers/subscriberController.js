const pool = require('../config/db');

const subscribe = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        await pool.query('INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP', [email]);
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSubscribers = async (req, res) => {
    try {
        const [subscribers] = await pool.query('SELECT * FROM subscribers ORDER BY created_at DESC');
        res.json(subscribers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteSubscriber = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM subscribers WHERE id = ?', [id]);
        res.json({ message: 'Subscriber removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    subscribe,
    getSubscribers,
    deleteSubscriber
};
