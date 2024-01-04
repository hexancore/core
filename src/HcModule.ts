import { ConfigurableModuleBuilder, Global, Module } from '@nestjs/common';
import { CurrentTime } from '@hexancore/common';
import { HcAppConfigModule } from './Infrastructure/Config/HcAppConfigModule';
import { HcApplicationModule } from './Application';
import { EntityPersisterFactoryManager, HcAppRedisModule } from './Infrastructure';
import { ClsModule } from 'nestjs-cls';
import { nanoid } from 'nanoid';
import { AccountContext } from './Infrastructure/Account/AccountContext';

export interface HcModuleOptions {}

export interface HcModuleExtras {
  cls?: boolean;
  redis?: boolean;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<HcModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras<HcModuleExtras>({ cls: false, redis: false }, (def, extras) => {
    def.imports = def.imports ? def.imports : [];
    def.providers = def.providers ? def.providers : [];
    def.exports = def.exports ? def.exports : [];

    if (extras.cls) {
      def.imports.push(
        ClsModule.forRoot({
          global: true,
          middleware: { mount: false, generateId: true, idGenerator: (req) => req.headers['X-Request-Id'] ?? nanoid(21) },
        }),
      );
      def.providers.push(AccountContext);
      def.exports.push(AccountContext);
    }

    if (extras.redis) {
      def.imports.push(HcAppRedisModule);
    }
    return def;
  })
  .build();

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
export class HcModule extends ConfigurableModuleClass {}
