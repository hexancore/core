import { ConfigurableModuleBuilder, Global, Module, Provider } from '@nestjs/common';
import { AccountId, CurrentTime, LogicError } from '@hexancore/common';
import { HcAppConfigModule } from './Infrastructure/Config/HcAppConfigModule';
import { HcApplicationModule } from './Application';
import { EntityPersisterFactoryManager, HcAppRedisModule } from './Infrastructure';
import { ClsModule } from 'nestjs-cls';
import { nanoid } from 'nanoid';
import { AccountContext } from './Infrastructure/Account/AccountContext';
import { ClsAccountContext } from './Infrastructure/Account/ClsAccountContext';
import { SimpleAccountContext } from './Infrastructure/Account/SimpleAccountContext';

export interface HcModuleOptions {}

export interface HcModuleExtras {
  cls?: boolean;
  accountContext?: {
    useCls: boolean,
    currentAccountId?: AccountId;
  },
  redis?: boolean;

}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<HcModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras<HcModuleExtras>({ cls: false, redis: false, accountContext: undefined }, (def, extras) => {
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
    }

    if (extras.accountContext) {
      let accountContextProvider: Provider|null = null;
      if (extras.accountContext.useCls) {
        if (!extras.cls) {
          throw new LogicError("To use ClsAccountContext you need set cls=true in module options");
        }
        accountContextProvider = {
          provide: AccountContext,
          useClass: ClsAccountContext,
        };
      } else {
        accountContextProvider =  {
          provide: AccountContext,
          useFactory: () => new SimpleAccountContext(extras.accountContext.currentAccountId),
        };
      }

      def.providers.push(accountContextProvider);
      def.exports.push(accountContextProvider);
    }

    if (extras.redis) {
      def.imports.push(HcAppRedisModule);
    }
    def.global = true;
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
