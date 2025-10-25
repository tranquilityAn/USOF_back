import UserService from '../services/UserService.js';
import AuthService from '../services/AuthService.js';

class AuthController {
    async register(req, res, next) {
        try {
            const { login, password, passwordConfirmation, email, fullName } = req.body;
            if (password !== passwordConfirmation) {
                return res.status(400).json({ error: 'Passwords do not match' });
            }
            const user = await UserService.register({ login, password, email, fullName });

            // надсилаємо лист для підтвердження email
            await AuthService.sendEmailVerification(user);

            res.status(201).json({
                ...user.toJSON(),
                message: 'Registered. Please verify your email.'
            });
        } catch (err) {
            next(err);
        }
    }

    async login(req, res, next) {
        try {
            const { login, password } = req.body;
            const { token, user } = await AuthService.login({ login, password });
            res.json({ token, user });
        } catch (err) {
            next(err);
        }
    }

    async logout(req, res, next) {
        try {
            const result = await AuthService.logout();
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async verifyEmail(req, res, next) {
        try {
            const { token } = req.params;
            await AuthService.confirmEmailVerify(token);
            res.json({ message: 'Email verified successfully' });
        } catch (err) {
            next(err);
        }
    }

    async requestPasswordReset(req, res, next) {
        try {
            const { email } = req.body;
            const result = await AuthService.requestPasswordReset(email);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async validatePasswordResetToken(req, res, next) {
        try {
            const { token } = req.params;
            // просто пробуємо 'прочитати' токен без застосування
            await AuthService.peekPasswordResetToken(token);
            res.json({ valid: true });
        } catch (err) {
            res.status(400).json({ valid: false, error: err.message });
        }
    }

    async confirmPasswordReset(req, res, next) {
        try {
            const { token } = req.params;
            const { newPassword } = req.body;      // фронт шле JSON: { 'newPassword': '...' }
            const result = await AuthService.confirmPasswordReset(token, newPassword);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async redirectPasswordResetToFrontend(req, res) {
        const { token } = req.params;
        const base = process.env.FRONTEND_BASE_URL || process.env.PUBLIC_BASE_URL;
        if (base) {
            // 307, щоб зберегти метод, але тут GET, тому 302 теж ок
            return res.redirect(302, `${base}/reset?token=${token}`);
        }
        // якщо фронт не заданий — відповімо JSON, щоб не було 'Cannot GET'
        return res.status(400).json({
            error: 'This is an API endpoint. Use POST /api/auth/password-reset/:token with { newPassword }.'
        });
    }

    async redirectVerifyToFrontend(req, res) {
        const { token } = req.params;
        const base = process.env.FRONTEND_BASE_URL || process.env.PUBLIC_BASE_URL;
        if (base) return res.redirect(302, `${base}/verify?token=${token}`);
        return res.status(400).json({ error: 'Open this link in the frontend app.' });
    }

    async resendEmailVerification(req, res, next) {
        try {
            const { login, email } = req.body;
            const result = await AuthService.resendEmailVerification({ login, email });
            res.json(result);
        } catch (err) { next(err); }
    }

    async changeEmail(req, res, next) {
        try {
            const { login, newEmail } = req.body;
            const result = await AuthService.changeEmail({ login, newEmail });
            res.json(result);
        } catch (err) { next(err); }
    }

    async getVerifyEmailTtl(req, res) {
        res.json({ ttlMinutes: AuthService.getEmailVerifyTTL(), cooldownSec: AuthService.getResendCooldownSec() });
    }
}

export default new AuthController();