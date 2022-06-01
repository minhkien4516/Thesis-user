import { Module } from '@nestjs/common';
import databaseConfig from './database/database.config';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './domain/Services/users/user.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './domain/Services/auth/guards/jwt-auth.guard';
import { RolesGuard } from './domain/Services/auth/guards/role.guard';
import { AuthModule } from './domain/Services/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.production', '.env'],
      isGlobal: true,
      load: [databaseConfig],
    }),
    HealthModule,
    DatabaseModule,
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
