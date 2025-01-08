import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAssistantModule } from 'src/shared/modules/ai-assistant/ai-assistant.module';

import { IntegrationPlatform } from '../integration-platform/entities/integration-platform.entity';

import { TiktokshopController } from './tiktokshop.controller';
import { TiktokshopService } from './tiktokshop.service';

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationPlatform]), AiAssistantModule],
  controllers: [TiktokshopController],
  providers: [TiktokshopService],
  exports: [TiktokshopService],
})
export class TiktokshopModule {}
