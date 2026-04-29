import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScoringService } from './scoring.service';
import { ScoringGateway } from './scoring.gateway';
import { ScoringController } from './scoring.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000,
          limit: 10, // 10 requests per second peak
        },
        {
          name: 'medium',
          ttl: 60000,
          limit: 120, // 120 requests per minute
        },
        {
          name: 'long',
          ttl: 600000,
          limit: 500, // 500 requests per 10 minutes
        },
      ],
    }),
  ],
  controllers: [ScoringController],
  providers: [ScoringService, ScoringGateway],
  exports: [ScoringService],
})
export class ScoringModule {}
