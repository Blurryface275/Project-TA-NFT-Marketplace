import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PasskeyCredential } from './entities/passkey-credential.entity';
import { MailService } from './mail.service';
import { Mail } from 'nodemailer';

@Module({
  imports: [TypeOrmModule.forFeature([User, Customer, PasskeyCredential])],
  controllers: [AuthController],
  providers: [AuthService, MailService],
  exports: [AuthService, MailService],
})
export class AuthModule {}