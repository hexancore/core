import { HcInfraDomainModule } from '@';
import { Module } from '@nestjs/common';

@Module({
  imports: [HcInfraDomainModule.forFeature({ moduleInfraDir: __dirname })],
  exports: [HcInfraDomainModule]
})
export class PrivateTestInfraModule {}
