import { AggregateRootRepositoryManager } from '@/Domain';
import { HcAppModuleMeta } from '@/Util/ModuleHelper';
import { ConfigurableModuleBuilder, DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { InfraAggregateRootRepositoryManager } from './Manager';
import { EntityPersisterFactoryManager } from './Persister';
import { LogicError } from '@hexancore/common';

export interface HcInfraDomainModuleOptions {}

export type HcInfraDomainModuleExtra = Pick<ModuleMetadata, 'imports' | 'exports' | 'providers'>;

const { ConfigurableModuleClass } = new ConfigurableModuleBuilder<HcInfraDomainModuleOptions>()
  .setExtras<HcInfraDomainModuleExtra>(
    {
      imports: [],
      providers: [],
      exports: [],
    },
    (definition, extras) => ({
      ...definition,
      ...extras,
    }),
  )
  .build();

@Module({})
export class HcInfraDomainModule extends ConfigurableModuleClass {
  public static forFeature(options: { moduleInfraFilePath: string } & HcInfraDomainModuleExtra): DynamicModule {
    const moduleMeta = HcAppModuleMeta.fromPath(options.moduleInfraFilePath);
    const m = super.register(options);
    m.providers.push(AggregateRootRepositoryManager);
    m.providers.push({
      provide: InfraAggregateRootRepositoryManager,
      inject: [EntityPersisterFactoryManager],
      useFactory: async (factoryManager: EntityPersisterFactoryManager) => {
        const domainErrorsConst = moduleMeta.name + 'DomainErrors';
        const domainErrorsImportPath = moduleMeta.getDomainPath(domainErrorsConst);
        const domainErrors = (await import(domainErrorsImportPath))[domainErrorsConst];
        if (!domainErrors) {
          throw new LogicError(`Not found DomainErrors for module: '+moduleMeta.name+' , ${domainErrorsImportPath} need export const ${domainErrorsConst} = DomainErrors(...)`);
        }
        return new InfraAggregateRootRepositoryManager(moduleMeta, factoryManager, domainErrors);
      },
    });
    m.exports.push(AggregateRootRepositoryManager);

    return m;
  }
}
