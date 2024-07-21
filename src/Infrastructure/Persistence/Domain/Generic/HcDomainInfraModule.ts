import { Module } from '@nestjs/common';
import { EntityPersisterFactoryManager } from './Persister/EntityPersisterFactoryManager';

@Module({
  providers: [EntityPersisterFactoryManager],
  exports: [EntityPersisterFactoryManager],
})
export class HcDomainInfraModule { }
