import {
  AR,
  AnyHCommand,
  ExtractHCommandResultValueType,
  AnyHQuery,
  ExtractHQueryResultValueType,
  AnyHEvent
} from '@hexancore/common';


export type HCommandHandleResult<T extends AnyHCommand> = AR<ExtractHCommandResultValueType<T>>;
export type HQueryHandleResult<T extends AnyHQuery> = AR<ExtractHQueryResultValueType<T>>;

export abstract class GeneralBus {
  public abstract handleCommand<T extends AnyHCommand>(command: T): HCommandHandleResult<T>;
  public abstract handleEvent(event: AnyHEvent): AR<boolean>;
  public abstract handleQuery<T extends AnyHQuery>(query: T): HQueryHandleResult<T>;
}
