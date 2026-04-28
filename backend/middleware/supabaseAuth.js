const { supabase } = require('../config/supabase');

/**
 * Middleware to authenticate requests using Supabase JWT tokens
 * Verifies the token and attaches user information to req.user
 */
const authenticateUser = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'No authentication token provided',
                error: 'UNAUTHORIZED'
            });
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            console.error('Token verification error:', error.message);
            return res.status(401).json({
                message: 'Invalid or expired token',
                error: 'INVALID_TOKEN'
            });
        }

        if (!user) {
            return res.status(401).json({
                message: 'User not found',
                error: 'USER_NOT_FOUND'
            });
        }

        // Attach user to request object
        req.user = user;
        req.userId = user.id;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            message: 'Authentication failed',
            error: 'INTERNAL_ERROR'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const { data: { user } } = await supabase.auth.getUser(token);

            if (user) {
                req.user = user;
                req.userId = user.id;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = { authenticateUser, optionalAuth };
