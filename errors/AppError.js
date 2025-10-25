export default class AppError extends Error {
    constructor(status, code, message, details = null) {
        super(message);
        this.name = 'AppError';
        this.status = Number(status) || 500;
        this.code = code || 'INTERNAL_ERROR';
        this.details = details;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export const badRequest = (code, msg, d) => new AppError(400, code, msg, d);
export const unauthorized = (code, msg, d) => new AppError(401, code, msg, d);
export const forbidden = (code, msg, d) => new AppError(403, code, msg, d);
export const notFound = (code, msg, d) => new AppError(404, code, msg, d);
export const conflict = (code, msg, d) => new AppError(409, code, msg, d);
export const tooMany = (code, msg, d) => new AppError(429, code, msg, d);
