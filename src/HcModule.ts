import { ConfigurableModuleBuilder, Global, Module, Provider, type DynamicModule } from '@nestjs/common';
import { AccountId, CurrentTime, LogicError } from '@hexancore/common';
import { HcAppConfigModule } from './Infrastructure/Config/HcAppConfigModule';
import { HcApplicationModule } from './Application';
import { ClsModule } from 'nestjs-cls';
import { nanoid } from 'nanoid';
import { AccountContext } from './Infrastructure/Account/AccountContext';
import { ClsAccountContext } from './Infrastructure/Account/ClsAccountContext';
import { SimpleAccountContext } from './Infrastructure/Account/SimpleAccountContext';
import { HcDomainInfraModule } from './Infrastructure/Persistence/Domain/Generic/HcDomainInfraModule';

export interface HcModuleOptions { }

export interface HcModuleExtras {
  cls?: boolean;
  accountContext?: {
    useCls: boolean,
    currentAccountId?: AccountId;
  };
}

function createClsModule(): DynamicModule {
  return ClsModule.forRoot({
    global: true,
    middleware: { mount: false, generateId: true, idGenerator: (req) => req.headers['X-Request-Id'] ?? nanoid(21) },
  });
}

const CurrentTimeProvider = {
  provide: CurrentTime,
  useFactory: () => new CurrentTime(),
};

function createAccountContextProvider(options: HcModuleExtras): Provider {
  if (options.accountContext!.useCls) {
    if (!options.cls) {
      throw new LogicError("To use ClsAccountContext you need set cls=true in module options");
    }
    return {
      provide: AccountContext,
      useClass: ClsAccountContext,
    };
  } else {
    return {
      provide: AccountContext,
      useFactory: () => new SimpleAccountContext(options?.accountContext?.currentAccountId),
    };
  }
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } = new ConfigurableModuleBuilder<HcModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras<HcModuleExtras>({ cls: false, accountContext: undefined }, (def, extras) => {
    def.imports = def.imports ? def.imports : [HcDomainInfraModule];
    def.providers = def.providers ? def.providers : [];
    def.exports = def.exports ? def.exports : [HcDomainInfraModule];

    if (extras.cls) {
      def.imports.push(createClsModule());
    }

    if (extras.accountContext) {
      const accountContextProvider = createAccountContextProvider(extras);
      def.providers.push(accountContextProvider);
      def.exports.push(accountContextProvider);
    }

    def.global = true;
    return def;
  })
  .build();

@Global()
@Module({
  imports: [HcAppConfigModule, HcApplicationModule, HcDomainInfraModule],
  providers: [
    CurrentTimeProvider,
  ],
  exports: [CurrentTime, HcDomainInfraModule],
})
export class HcModule extends ConfigurableModuleClass {
  public static forRoot(options?: typeof OPTIONS_TYPE): DynamicModule {
    return super.forRoot(options ?? {});
  }
}
