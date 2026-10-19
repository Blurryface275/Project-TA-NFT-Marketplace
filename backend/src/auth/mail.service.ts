import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.MAIL_PORT) || 2525,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendOtpEmail(to: string, name: string, otp: string): Promise<boolean> {
    try {
      const mailOptions = {
        from:
          process.env.MAIL_FROM ||
          '"Web3 NFT Marketplace" <noreply@nftmarketplace.local>',
        to,
        subject: `${otp} is your verification code`,
        html: `
          <div style="background-color: #f3f4f6; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              
              <!-- Header Banner -->
              <div style="background-color: #4f46e5; padding: 22px 20px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 0.3px;">
                  Your OTP Code
                </h1>
              </div>

              <!-- Body Content -->
              <div style="padding: 32px 28px; color: #374151; font-size: 14px; line-height: 1.6;">
                <p style="margin-top: 0; margin-bottom: 16px; font-weight: 600; color: #111827;">
                  Hello ${name},
                </p>
                <p style="margin-bottom: 24px; color: #4b5563;">
                  Your One-Time Password (OTP) for account verification is:
                </p>

                <!-- OTP Box -->
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px 20px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4338ca; font-family: 'Courier New', Courier, monospace;">
                    ${otp}
                  </span>
                </div>

                <p style="margin-top: 24px; margin-bottom: 8px; color: #4b5563;">
                  This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.
                </p>
                <p style="margin-top: 0; margin-bottom: 16px; color: #6b7280; font-size: 13px;">
                  If you didn't request this code, please ignore this email.
                </p>
                <p style="margin: 0; color: #374151; font-weight: 500;">
                  Thank you for using our service!
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} Web3 NFT Marketplace. All rights reserved.
              </div>

            </div>
          </div>
        `,
      };
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`📧 [Mailtrap] Berhasil mengirimkan email OTP ke ${to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ [Mailtrap] Gagal mengirimkan email ke ${to}:`,
        error,
      );
      return false;
    }
  }
}
