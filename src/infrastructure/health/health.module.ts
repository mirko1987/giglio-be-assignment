import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { CustomHealthIndicator } from './custom-health.indicator';

@Module({
  imports: [
    TerminusModule,
    HttpModule, // Required for HTTP health indicators
  ],
  controllers: [HealthController],
  providers: [CustomHealthIndicator],
  exports: [CustomHealthIndicator],
})
export class HealthModule {}
