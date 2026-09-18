import { Injectable } from '@nestjs/common';
import { async } from 'rxjs';
import { Repository } from 'typeorm';
import { User } from './users/entities/user.entity';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Backend berhasil terhubung ke database!';
  }
}
