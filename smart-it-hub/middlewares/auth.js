function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }

    req.user = req.session.user;
    next();
}

function requirePageAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect("/login");
    }

    req.user = req.session.user;
    next();
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "غير مصرح لك بهذا الإجراء" });
        }

        next();
    };
}

function requireOwnership(paramName) {
    return (req, res, next) => {
        const body = req.body || {};
        const requestedId = req.params[paramName] || req.query[paramName] || body[paramName];

        if (!requestedId || String(requestedId) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: "لا يمكنك الوصول إلى بيانات مستخدم آخر" });
        }

        next();
    };
}

module.exports = {
    requireAuth,
    requirePageAuth,
    requireRole,
    requireOwnership
};
