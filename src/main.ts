import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import ngrok from 'ngrok';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from './domain/Services/auth/guards/jwt-auth.guard';
import { RolesGuard } from './domain/Services/auth/guards/role.guard';
import cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  app.useGlobalGuards(new JwtAuthGuard(new Reflector()));
  app.useGlobalGuards(new RolesGuard(new Reflector()));
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ skipMissingProperties: true }));

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, 'domain/Services/auth/auth.proto'),
      url: configService.get<string>('GRPC_CONNECTION_URL'),
    },
  });

  await app.startAllMicroservices();

  const config = new DocumentBuilder()
    .setTitle('User Service')
    .setDescription('The User Service API description')
    .setVersion('1.0')
    .addTag('user')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT || 3003);

  // (async () => {
  //   const url = await ngrok.connect({
  //     proto: 'http',
  //     addr: parseInt(process.env.PORT) || 3003,
  //     authtoken: process.env.NGROK_TOKEN,
  //     region: 'us',
  //   });
  //   const api = await ngrok.getApi();
  //   const tunnels = await api.listTunnels();
  //   console.log(
  //     `User local server is publicly-accessible at ${
  //       Object.values(tunnels)[0][0].public_url
  //     }`,
  //   );
  //   console.log(
  //     `Please combine (ctrl+click) to this link "${
  //       url + '/health'
  //     }" for check health service ^^!`,
  //   );
  // })();

  console.log(await app.getUrl());
}
bootstrap().then(() =>
  console.log(`User service is running on port ${process.env.PORT}`),
);
