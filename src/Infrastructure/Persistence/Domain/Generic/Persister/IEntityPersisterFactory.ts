import { AbstractEntityPersister } from './AbstractEntityPersister';
import { AbstractEntityRepositoryCommon } from '../AbstractEntityRepositoryCommon';

export interface IEntityPersisterFactory {
  create<P extends AbstractEntityPersister<any, any>>(repository: AbstractEntityRepositoryCommon<any, any, any>): P;
}
