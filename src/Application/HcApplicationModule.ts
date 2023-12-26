import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DefaultGeneralBus } from '@/Application/DefaultGeneralBus';
import { GeneralBus } from '@/Application/GeneralBus';

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
