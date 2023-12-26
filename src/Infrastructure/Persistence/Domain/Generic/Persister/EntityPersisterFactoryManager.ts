import { Injectable } from '@nestjs/common';
import { IEntityPersisterFactory } from './IEntityPersisterFactory';
import { AbstractEntityPersister } from './AbstractEntityPersister';
import { ENTITY_REPOSITORY_PERSISTER_TYPE_PROPERTY } from '../EntityRepositoryDecorator';
import { AbstractEntityRepositoryCommon } from '../AbstractEntityRepositoryCommon';
import { LogicError } from '@hexancore/common';

@Injectable()
export class EntityPersisterFactoryManager implements IEntityPersisterFactory {
  protected factories: Map<string, IEntityPersisterFactory>;

  public constructor() {
    this.factories = new Map();
  }

  public create<P extends AbstractEntityPersister<any, any>>(repository: AbstractEntityRepositoryCommon<any, any, any>): P {
    const persisterType = repository.constructor[ENTITY_REPOSITORY_PERSISTER_TYPE_PROPERTY];
    const factory = this.factories.get(persisterType);
    if (!factory) {
      throw new LogicError(`Persister factory for type: ${persisterType} is not registered`);
    }
    return factory.create(repository);
  }

  public registerFactory(persisterType: string, factory: IEntityPersisterFactory): void {
    this.factories.set(persisterType, factory);
  }
}
