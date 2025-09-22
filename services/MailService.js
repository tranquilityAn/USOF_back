const nodemailer = require("nodemailer");

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT || 587),
            secure: process.env.MAIL_SECURE === "true",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
        this.from = process.env.MAIL_FROM || process.env.MAIL_USER;
        this.publicBase = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL;
    }

    async sendEmailVerification(to, rawToken) {
        const url = `${this.publicBase}/api/auth/verify-email/${rawToken}`;
        const html = `
      <h2>Підтвердження електронної пошти</h2>
      <p>Доброго дня! Будь ласка, підтвердіть вашу пошту, натиснувши на посилання нижче:</p>
      <p><a href="${url}">${url}</a></p>
      <p>Посилання дійсне 60 хвилин.</p>
    `;
        await this.transporter.sendMail({ to, from: this.from, subject: "Підтвердження пошти", html });
    }

    async sendPasswordReset(to, rawToken) {
        //const url = `${this.publicBase}/api/auth/password-reset/${rawToken}`;
        const frontendBase = process.env.FRONTEND_BASE_URL || process.env.PUBLIC_BASE_URL;
        const url = `${frontendBase}/reset?token=${rawToken}`; // <- ведемо на фронт
        const html = `
      <h2>Скидання пароля</h2>
      <p>Ви запросили скидання пароля. Перейдіть за посиланням, щоб встановити новий пароль:</p>
      <p><a href="${url}">${url}</a></p>
      <p>Посилання дійсне 30 хвилин. Якщо це були не ви — проігноруйте лист.</p>
    `;
        await this.transporter.sendMail({ to, from: this.from, subject: "Скидання пароля", html });
    }
}

module.exports = new MailService();
