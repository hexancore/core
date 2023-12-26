import { Module } from '@nestjs/common';
import { MemoryEntityPersisterFactory } from './MemoryEntityPersisterFactory';

@Module({
  providers: [MemoryEntityPersisterFactory],
  exports: [MemoryEntityPersisterFactory],
})
export class HcInfraMemoryDomainModule {}
