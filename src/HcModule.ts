import { Global, Module } from '@nestjs/common';
import { CurrentTime } from '@hexancore/common';
import { HcAppConfigModule } from './Infrastructure/Config/HcAppConfigModule';
import { HcApplicationModule } from './Application';
import { EntityPersisterFactoryManager } from './Infrastructure';

@Global()
@Module({
  imports: [HcAppConfigModule, HcApplicationModule],
  providers: [
    {
      provide: CurrentTime,
      useFactory: () => new CurrentTime(),
    },
    EntityPersisterFactoryManager,
  ],
  exports: [CurrentTime, EntityPersisterFactoryManager],
})
export class HcModule {}
