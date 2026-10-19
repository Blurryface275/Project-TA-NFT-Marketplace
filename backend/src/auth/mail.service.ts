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
          '"NFT Marketplace" <noreply@nftmarketplace.local>',
        to,
        subject: `${otp} adalah Kode Verifikasi Pendaftaran Anda`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #0b0f19; border: 1px solid #1f293d; border-radius: 14px; color: #f3f4f6;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #6366f1; margin: 0; font-size: 22px; letter-spacing: -0.5px;">Web3 NFT Marketplace</h2>
              <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Verifikasi Akun Pelanggan</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.5; color: #e2e8f0;">Halo <strong>${name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
              Terima kasih telah mendaftar. Masukkan kode 6 digit berikut pada halaman verifikasi untuk mengaktifkan akun Anda:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <div style="display: inline-block; padding: 14px 32px; background: #1e1b4b; border: 1px solid #4338ca; border-radius: 10px; font-size: 32px; font-weight: 700; letter-spacing: 10px; color: #a5b4fc; font-family: monospace;">
                ${otp}
              </div>
            </div>
            <p style="font-size: 12px; color: #f59e0b; background-color: #78350f22; border: 1px solid #78350f44; padding: 10px 14px; border-radius: 8px;">
              ⚠️ Kode ini hanya berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.
            </p>
            <hr style="border: none; border-top: 1px solid #1f293d; margin: 28px 0 16px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">
              Jika Anda tidak merasa mendaftar di Web3 NFT Marketplace, abaikan email ini.
            </p>
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
