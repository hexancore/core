import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DefaultGeneralBus } from './DefaultGeneralBus';
import { GeneralBus } from './GeneralBus';

const GeneralBusProvider = {
  provide: GeneralBus,
  useClass: DefaultGeneralBus,
};

@Global()
@Module({
  imports: [CqrsModule],
  providers: [GeneralBusProvider],
  exports: [GeneralBusProvider],
})
export class HcApplicationModule {}
