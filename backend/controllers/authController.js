// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// User login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Get user from database
        const [users] = await pool.query(
            `SELECT u.*, c.committee_name, c.committee_type 
             FROM users u 
             JOIN committees c ON u.committee_id = c.committee_id 
             WHERE u.username = ?`,
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check if account is locked
        if (user.status === 'Locked') {
            return res.status(403).json({
                success: false,
                message: 'Account is locked. Please contact administrator.'
            });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            // Increment failed login attempts
            const newAttempts = user.failed_login_attempts + 1;
            const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;

            if (newAttempts >= maxAttempts) {
                await pool.query(
                    'UPDATE users SET status = ?, failed_login_attempts = ? WHERE user_id = ?',
                    ['Locked', newAttempts, user.user_id]
                );
                return res.status(403).json({
                    success: false,
                    message: 'Account locked due to multiple failed login attempts'
                });
            }

            await pool.query(
                'UPDATE users SET failed_login_attempts = ? WHERE user_id = ?',
                [newAttempts, user.user_id]
            );

            return res.status(401).json({
                success: false,
                message: `Invalid credentials. ${maxAttempts - newAttempts} attempts remaining.`
            });
        }

        // Reset failed login attempts and update last login
        await pool.query(
            'UPDATE users SET failed_login_attempts = 0, last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.user_id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action_type, ip_address, user_agent) VALUES (?, ?, ?, ?)',
            [user.user_id, 'LOGIN', req.ip, req.get('user-agent')]
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    committee_id: user.committee_id,
                    committee_name: user.committee_name,
                    committee_type: user.committee_type
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// User logout
exports.logout = async (req, res) => {
    try {
        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action_type, ip_address) VALUES (?, ?, ?)',
            [req.user.user_id, 'LOGOUT', req.ip]
        );

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current and new password are required'
            });
        }

        // Password validation
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Get current user
        const [users] = await pool.query(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        const user = users[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [hashedPassword, req.user.user_id]
        );

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action_type, table_name) VALUES (?, ?, ?)',
            [req.user.user_id, 'PASSWORD_CHANGE', 'users']
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Password change failed'
        });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT u.user_id, u.username, u.full_name, u.email, u.phone, 
                   u.role, u.status, u.last_login, u.created_at,
                   c.committee_id, c.committee_name, c.committee_type
            FROM users u
            JOIN committees c ON u.committee_id = c.committee_id
            WHERE u.user_id = ?
        `, [req.user.user_id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile'
        });
    }
};
