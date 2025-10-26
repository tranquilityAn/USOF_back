import crypto from 'crypto';
import TokenRepository from '../repositories/TokenRepository.js';
import { badRequest } from '../errors/AppError.js';

class TokenService {
    async mintSingleUseToken({ userId, type, ttlMinutes = 60, meta = null }) {
        await TokenRepository.invalidateOld(userId, type);

        const raw = crypto.randomBytes(32).toString("hex"); 
        const hash = crypto.createHash("sha256").update(raw).digest("hex"); 
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

        await TokenRepository.create({
            tokenHash: hash,
            userId,
            type,
            meta,
            expiresAt
        });
        return raw; 
    }

    async consumeToken(rawToken, expectedType) {
        const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const rec = await TokenRepository.findActiveByHash(hash);
        if (!rec) throw badRequest('TOKEN_INVALID_OR_EXPIRED', 'Token is invalid or expired');
        if (rec.type !== expectedType) throw badRequest('TOKEN_TYPE_MISMATCH', 'Token type mismatch');

        await TokenRepository.markUsed(hash);
        return rec; 
    }

    async peek(rawToken, expectedType) {
        const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const rec = await TokenRepository.findActiveByHash(hash);
        if (!rec) throw badRequest('TOKEN_INVALID_OR_EXPIRED', 'Token is invalid or expired');
        if (rec.type !== expectedType) throw badRequest('TOKEN_TYPE_MISMATCH', 'Token type mismatch');
        return rec; 
    }
}

export default new TokenService();