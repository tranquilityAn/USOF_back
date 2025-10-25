import jwt from 'jsonwebtoken';
import UserService from './UserService.js';
import TokenService from './TokenService.js';
import MailService from './MailService.js';
import AppError, { unauthorized, forbidden, badRequest } from '../errors/AppError.js';

class AuthService {
    async login({ login, password }) {
        const user = await UserService.findByLogin(login);
        if (!user) throw unauthorized('AUTH_INVALID_CREDENTIALS', 'Invalid login or password');

        const isPasswordValid = await UserService.validatePassword(user, password);
        if (!isPasswordValid) throw unauthorized('AUTH_INVALID_CREDENTIALS', 'Invalid login or password');

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Можеш вирішити: не пускати, якщо email не підтверджено
        if (!user.emailVerified) throw forbidden('EMAIL_NOT_VERIFIED', 'Email is not verified');

        return { token, user };
    }

    async logout(token) {
        // можно реализовать blacklist для токенов
        return { message: "Logged out successfully" };
    }

    async verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            throw unauthorized('TOKEN_INVALID', 'Invalid token');
        }
    }

    async sendEmailVerification(user) {
        const raw = await TokenService.mintSingleUseToken({
            userId: user.id,
            type: "email_verify",
            ttlMinutes: 60,
        });
        await MailService.sendEmailVerification(user.email, raw);
        return { message: "Verification email sent" };
    }

    async confirmEmailVerify(rawToken) {
        const rec = await TokenService.consumeToken(rawToken, "email_verify");
        await UserService.setEmailVerified(rec.user_id);
        return { message: "Email verified" };
    }

    async requestPasswordReset(email) {
        const user = await UserService.findByEmail(email);
        // Не розкриваємо існування акаунта
        if (!user) return { message: "If account exists, email was sent" };

        const raw = await TokenService.mintSingleUseToken({
            userId: user.id,
            type: "password_reset",
            ttlMinutes: 30,
        });
        await MailService.sendPasswordReset(user.email, raw);
        return { message: "If account exists, email was sent" };
    }

    async peekPasswordResetToken(rawToken) {
        // читаємо, але НЕ позначаємо used
        const rec = await TokenService.peek(rawToken, 'password_reset');
        return rec;
    }

    async confirmPasswordReset(rawToken, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            throw badRequest('WEAK_PASSWORD', 'Password must be at least 6 characters');
        }
        const rec = await TokenService.consumeToken(rawToken, 'password_reset');
        await UserService.updatePassword(rec.user_id, newPassword);
        return { message: "Password has been reset" };
    }
}

export default new AuthService();
