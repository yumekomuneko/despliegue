import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: `"TechStore" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });

    this.logger.debug(`Correo enviado a ${to} (ID: ${info.messageId})`);
    return info;
  }

  async sendVerificationEmail(to: string, token: string) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontend.replace(/\/$/, '')}/verify?token=${token}`;

    return this.sendMail(
      to,
      'Verifica tu cuenta',
      `
        <h2>Bienvenido a TechStore</h2>
        <p>Por favor verifica tu cuenta haciendo clic en el siguiente enlace:</p>
        <a href="${link}" target="_blank">${link}</a>
      `,
    );
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontend.replace(/\/$/, '')}/reset-password?token=${token}`;

    return this.sendMail(
      to,
      'Restablece tu contraseña',
      `
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${link}" target="_blank">${link}</a>
      `,
    );
  }
}
