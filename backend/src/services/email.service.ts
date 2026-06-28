import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  if (!config.smtp.user) {
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Reset your PipsFlow password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
};
