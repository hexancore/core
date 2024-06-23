import { AggregateRootRepositoryManager, getAggregateRootRepositoryToken } from '../../../../Domain';
import { HcAppModuleMeta } from '@/Util/ModuleHelper';
import { ConfigurableModuleBuilder, DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { InfraAggregateRootRepositoryManager } from './Manager';
import { EntityPersisterFactoryManager } from './Persister';
import { DomainErrors, LogicError } from '@hexancore/common';
import { glob } from 'glob';
import path from 'path';
import { AggregateRootRepositoryProxyHandler } from './AggregateRootRepositoryProxyHandler';

export interface HcInfraDomainModuleOptions {
  moduleInfraDir: string;
}

export type HcInfraDomainModuleExtra = Pick<ModuleMetadata, 'imports' | 'exports' | 'providers'>;

async function importDomainErrors(moduleMeta: HcAppModuleMeta): Promise<DomainErrors<any>> {
  const domainErrorsConst = moduleMeta.name + 'DomainErrors';
  const domainErrorsImportPath = moduleMeta.getDomainPath(domainErrorsConst);
  const domainErrors = (await import(domainErrorsImportPath))[domainErrorsConst];
  if (!domainErrors) {
    throw new LogicError(
      `Not found DomainErrors for module: '+moduleMeta.name+' , ${domainErrorsImportPath} need export const ${domainErrorsConst} = DomainErrors(...)`,
    );
  }

  return domainErrors;
}

async function importRepositoriesImpl(moduleInfraDir: string) {
  moduleInfraDir = moduleInfraDir.split(path.sep).join(path.posix.sep);
  const pattern = 'Persistence/**/*Repository.{ts,js}';
  const files = await glob(pattern, { absolute: true, magicalBraces: true, cwd: moduleInfraDir });
  const imports = files.map((file) => import(path.resolve(file)));
  await Promise.all(imports);
}

const { ConfigurableModuleClass, OPTIONS_TYPE } = new ConfigurableModuleBuilder<HcInfraDomainModuleOptions>()
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

  public static async forFeature(options: typeof OPTIONS_TYPE): Promise<DynamicModule> {
    const moduleMeta = HcAppModuleMeta.fromPath(options.moduleInfraDir);
    const m = super.register(options);

    await importRepositoriesImpl(options.moduleInfraDir);

    m.providers!.push(AggregateRootRepositoryManager);
    m.providers!.push({
      provide: InfraAggregateRootRepositoryManager,
      inject: [EntityPersisterFactoryManager],
      useFactory: async (factoryManager: EntityPersisterFactoryManager) => {
        const domainErrors = await importDomainErrors(moduleMeta);
        return new InfraAggregateRootRepositoryManager(moduleMeta, factoryManager, domainErrors);
      },
    });
    m.exports!.push(AggregateRootRepositoryManager);


    const aggregateRootMetas = InfraAggregateRootRepositoryManager.getModuleAggregateRootMetas(moduleMeta.name);
    for (const meta of aggregateRootMetas) {
      const provider = {
        provide: getAggregateRootRepositoryToken(meta.entityClass),
        useFactory: (manager: AggregateRootRepositoryManager) => {
          return AggregateRootRepositoryProxyHandler.create(manager, meta.entityClass);
        },
        inject: [AggregateRootRepositoryManager]
      };
      m.providers?.push(provider);
      m.exports?.push(provider);
    }

    return m;
  }
}
