const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetCode } = require('../services/mailer');
const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
// Helper — generate a JWT token for a user
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        // payload — what's stored inside the token
        process.env.JWT_SECRET,
        // secret — used to sign the token
        { expiresIn: '7d' }
        // token expires in 7 days — user must log in again after
    );
};
// ─── REGISTER ───────────────────────────────────────
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Pull data from request body
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        // salt = random data added before hashing — makes each hash unique
        const hashedPassword = await bcrypt.hash(password, salt);
        // 3. Create user in DB with hashed password
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            // NEVER save plain password
            role,
        });
        // 4. Generate token and send response
        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            // e.g. an invalid role or malformed field — the client's fault, not ours
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        res.status(500).json({ message: error.message });
    }
};
// ─── LOGIN ──────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // Note: we say "Invalid email or password" not "Email not found"
        // Never tell attackers which part was wrong
        // 2. Compare entered password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // 3. Password correct — generate token and respond
        const token = generateToken(user._id);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/me — returns the currently logged-in user
const getMe = async (req, res) => {
    res.json({ user: req.user });
    // req.user was attached by the protect middleware
    // This route just returns it — no DB call needed
};

// ─── FORGOT PASSWORD — email a 6-digit code ─────────
const forgotPassword = async (req, res) => {
    // Same reply whether or not the email exists — never reveal who has an account
    const genericReply = { message: 'If an account exists for that email, we sent a 6-digit code to it.' };
    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (!email) return res.status(400).json({ message: 'Email is required' });
        const user = await User.findOne({ email });
        if (!user) return res.json(genericReply);
        if (user.resetCodeSentAt && Date.now() - user.resetCodeSentAt.getTime() < RESEND_WAIT_MS) {
            return res.status(429).json({ message: 'Please wait a minute before requesting another code' });
        }
        const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        user.resetCodeHash = hashCode(code);
        user.resetCodeExpires = new Date(Date.now() + RESET_CODE_TTL_MS);
        user.resetCodeSentAt = new Date();
        user.resetAttempts = 0;
        await user.save();
        try {
            await sendPasswordResetCode(user.email, user.name, code);
        } catch (mailError) {
            console.error('Password reset email failed:', mailError.message);
            // Let them try again straight away rather than waiting out the resend timer
            user.resetCodeSentAt = null;
            await user.save();
            return res.status(502).json({ message: 'Could not send the email right now. Please try again.' });
        }
        res.json(genericReply);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── RESET PASSWORD — check the code, set the new password ─
const resetPassword = async (req, res) => {
    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
        const { newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'Email, code and new password are required' });
        }
        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        const invalid = { message: 'Invalid or expired code' };
        const user = await User.findOne({ email });
        if (!user || !user.resetCodeHash || !user.resetCodeExpires || user.resetCodeExpires < new Date()) {
            return res.status(400).json(invalid);
        }
        if (user.resetAttempts >= MAX_RESET_ATTEMPTS) {
            return res.status(429).json({ message: 'Too many wrong attempts. Request a new code.' });
        }
        const matches = crypto.timingSafeEqual(Buffer.from(hashCode(code)), Buffer.from(user.resetCodeHash));
        if (!matches) {
            user.resetAttempts += 1;
            await user.save();
            return res.status(400).json(invalid);
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordChangedAt = new Date();
        user.resetCodeHash = null;
        user.resetCodeExpires = null;
        user.resetCodeSentAt = null;
        user.resetAttempts = 0;
        await user.save();
        res.json({ message: 'Password reset. You can now sign in with your new password.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };