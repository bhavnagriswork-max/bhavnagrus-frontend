const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        // Check if user exists
        const [users] = await pool.query('SELECT * FROM users WHERE email = ? OR mobile = ?', [email, mobile]);
        if (users.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, mobile, password) VALUES (?, ?, ?, ?)',
            [name, email, mobile, hashedPassword]
        );

        const newUserId = result.insertId;

        res.status(201).json({
            id: newUserId,
            name,
            email,
            mobile,
            role: 'user',
            token: generateToken(newUserId, 'user'),
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);

        const [users] = await pool.query('SELECT * FROM users WHERE email = ? OR mobile = ?', [email, email]);

        if (users.length === 0) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid email/mobile or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            console.log('Login successful');
            // Update last login
            await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
            
            // Calculate Dog Score (Success orders)
            const [[{ dogScore }]] = await pool.query('SELECT COUNT(*) as dogScore FROM orders WHERE user_id = ? AND order_status != "Cancelled"', [user.id]);

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                dog_score: dogScore || 0,
                token: generateToken(user.id, user.role),
            });
        } else {
            console.log('Password mismatch');
            res.status(401).json({ message: 'Invalid email/mobile or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error. Please check database connection.' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, mobile, role, status FROM users WHERE id = ?', [req.user.id]);
        
        if (users.length > 0) {
            const user = users[0];
            // Calculate Dog Score
            const [[{ dogScore }]] = await pool.query('SELECT COUNT(*) as dogScore FROM orders WHERE user_id = ? AND order_status != "Cancelled"', [user.id]);
            user.dog_score = dogScore || 0;
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        // Get user from DB to get the hashed password
        const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = users[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { name, mobile, address } = req.body;
        await pool.query(
            'UPDATE users SET name = ?, mobile = ?, address = ? WHERE id = ?',
            [name, mobile, address, req.user.id]
        );
        res.json({ message: 'Profile updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword
};
