import { Global, Module } from '@nestjs/common';
import { CurrentTime } from '@hexancore/common';
import { AppConfigModule } from './Infrastructure/Config/AppConfigModule';
import { HcApplicationModule } from './Application';
import { EntityPersisterFactoryManager } from './Infrastructure';

@Global()
@Module({
  imports: [AppConfigModule, HcApplicationModule],
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
