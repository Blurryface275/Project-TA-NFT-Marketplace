import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    // muat file .env di awal aplikasi
    ConfigModule.forRoot({ isGlobal: true }),

    // konek ke database MySQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Cukup ConfigModule karena useFactory hanya butuh ConfigService untuk membaca konfigurasi DB dari .env
      inject: [ConfigService], // ConfigService digunakan sebagai dependensi untuk mengambil nilai dari .env
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', '127.0.0.1'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'nft-marketplace'),
        autoLoadEntities: true, // Otomatis membaca semua file *.entity.ts
        synchronize: true, // Sinkronisasi entitas ke tabel MySQL saat development
      }),
    }),

    // Authmoudle digunakan untuk registrasi dan login
    AuthModule,

    TicketsModule,

    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
