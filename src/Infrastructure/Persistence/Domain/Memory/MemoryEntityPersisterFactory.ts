import { Injectable } from '@nestjs/common';
import { AbstractEntityPersister, AbstractEntityRepositoryCommon, EntityPersisterFactoryManager, IEntityPersisterFactory } from '../Generic';
import { MemoryEntityPersister } from './MemoryEntityPersister';
import { CurrentTime } from '@hexancore/common';

@Injectable()
export class MemoryEntityPersisterFactory implements IEntityPersisterFactory {
  public constructor(protected ct: CurrentTime, factoryManager: EntityPersisterFactoryManager) {
    factoryManager.registerFactory('memory', this);
  }
  public create<P extends AbstractEntityPersister<any, any>>(repository: AbstractEntityRepositoryCommon<any, any, any>): P {
    return new MemoryEntityPersister(repository, this.ct) as any;
  }
}
