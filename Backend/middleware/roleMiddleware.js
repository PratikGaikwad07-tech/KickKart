// Check if user has required role
const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {

        // Make sure authentication middleware has run first
        if (!req.user) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required"
            });
        }

        // Check user's role
        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                status: "error",
                message: "Access denied. Insufficient permissions"
            });
        }

        // Role is correct
        next();
    };
};

module.exports = roleMiddleware;