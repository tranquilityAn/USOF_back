import nodemailer from 'nodemailer';

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
      <h2>Email Verification</h2>
      <p>Hello! Please confirm your email address by clicking the link below:</p>
      <p><a href="${url}">${url}</a></p>
      <p>The link is valid for 60 minutes.</p>
    `;
        await this.transporter.sendMail({ to, from: this.from, subject: "Email Verification", html });
    }

    async sendPasswordReset(to, rawToken) {
        //const url = `${this.publicBase}/api/auth/password-reset/${rawToken}`;
        const frontendBase = process.env.FRONTEND_BASE_URL || process.env.PUBLIC_BASE_URL;
        const url = `${frontendBase}/reset?token=${rawToken}`; // <- ведемо на фронт
        const html = `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Please click the link below to set a new password:</p>
      <p><a href="${url}">${url}</a></p>
      <p>The link is valid for 30 minutes. If this wasn’t you, please ignore this email.</p>
    `;
        await this.transporter.sendMail({ to, from: this.from, subject: "Password Reset", html });
    }
}

export default new MailService();