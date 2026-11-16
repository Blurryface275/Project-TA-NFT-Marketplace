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

  // Pipeline pengamana
  const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:3000').split(',').map((o)=> o.trim());

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origin tidak diizinkan oleh CORS'), false);
    },
    credentials: true,
  });

   app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );



 const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend berjalan di http://0.0.0.0:${port}/api`);
}
bootstrap();
