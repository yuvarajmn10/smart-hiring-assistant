const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = async (req, res, next) => {
    try {
        let token;
        // 1. Check if token exists in the request header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
            // Header format: "Bearer eyJhbGci..."
            // split(' ')[1] grabs just the token part after "Bearer "
        }
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }
        // 2. Verify the token is valid and not expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // decoded = { id: "661f3b...", iat: 1234567, exp: 1234567 }
        // jwt.verify throws an error if token is fake or expired
        // 3. Find the user from the id inside the token
        req.user = await User.findById(decoded.id).select('-password -resetCodeHash -resetCodeExpires -resetCodeSentAt -resetAttempts');
        // .select('-password') means: get everything EXCEPT the password field
        // req.user is now available in every protected route handler
        if (!req.user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }
        // Password was reset after this token was issued — make them log in again
        if (req.user.passwordChangedAt && decoded.iat * 1000 < req.user.passwordChangedAt.getTime() - 1000) {
            return res.status(401).json({ message: 'Password changed, please log in again' });
        }
        // 4. All good — move on to the route handler
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, invalid token' });
    }
};
module.exports = { protect };