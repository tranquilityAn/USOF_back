import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function roleMiddleware(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient rights' });
        }
        next();
    };
}

export function optionalAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return next();
    const [type, token] = auth.split(' ');
    if (type !== 'Bearer' || !token) return next();

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (!err && payload) {
            req.user = { id: payload.id, role: payload.role };
        }

        next();
    });
}

export function selfOrRole(roles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const paramId = Number(req.params.user_id);
        const meId = Number(req.user.id);

        if (Number.isFinite(paramId) && Number.isFinite(meId) && paramId === meId) {
            return next();
        }
        if (roles.includes(req.user.role)) {
            return next();
        }
        return res.status(403).json({ error: 'Forbidden: insufficient rights' });
    };
}
