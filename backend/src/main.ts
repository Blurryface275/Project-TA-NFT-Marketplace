import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Layani file statis (seperti gambar background tiket yang diunggah admin)
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  // Pasang prefix api untuk semua endpoint (misal: api/users/login)
  app.setGlobalPrefix('api');

    // Izinkan CORS untuk frontend di localhost maupun IP lokal LAN
  app.enableCors({
    origin: true, // mengizinkan request dari origin manapun (termasuk akses via IP lokal HP)
    credentials: true,
  });
  
  // Aktifkan validasi class-validator & class-transformer secara global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // otomatis membuang field yang tidak ada di DTO
      transform: true, // otomatis konversi tipe data (misal string → number)
    }),
  );

 const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend berjalan di http://0.0.0.0:${port}/api`);
}
bootstrap();
