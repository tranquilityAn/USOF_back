import AppError from '../errors/AppError.js';
import { mapDbError } from '../utils/dbErrorMap.js';

function asAppError(err) {
    // JWT
    if (err?.name === 'JsonWebTokenError') {
        return new AppError(401, 'TOKEN_INVALID', 'Invalid token');
    }
    if (err?.name === 'TokenExpiredError') {
        return new AppError(401, 'TOKEN_EXPIRED', 'Token expired');
    }

    // БД
    const mapped = mapDbError(err);
    if (mapped !== err && mapped instanceof AppError) return mapped;

    // already AppError
    if (err instanceof AppError) return err;

    // explicit status на звичайному Error
    if (Number.isFinite(err?.status)) {
        return new AppError(err.status, err.code || 'ERROR', err.message || 'Error');
    }

    // fallback — 500
    return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong!');
}

export function notFoundHandler(req, res, _next) {
    res.status(404).json({
        error: 'Route not found',
        code: 'NOT_FOUND',
        details: { method: req.method, path: req.originalUrl }
    });
}

export function globalErrorHandler(err, req, res, _next) {
    const appErr = asAppError(err);

    // лог — стислий у проді, повний у деві
    const isProd = process.env.NODE_ENV === 'production';
    const log = {
        time: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        status: appErr.status,
        code: appErr.code,
    };
    if (!isProd) {
        log.stack = err?.stack;
        log.details = appErr.details || err?.details || null;
    }
    console.error('[ERROR]', JSON.stringify(log));

    const body = {
        error: appErr.message,
        code: appErr.code,
    };
    if (!isProd && appErr.details) body.details = appErr.details;
    res.status(appErr.status).json(body);
}
