import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { universityProvider } from './university.provider';
import { UniversityService } from './university.service';

@Module({
  imports: [ConfigModule],
  providers: [...universityProvider, UniversityService],
  exports: [...universityProvider, UniversityService],
})
export class UniversityModule {}
