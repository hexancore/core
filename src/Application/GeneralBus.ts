import {
  type AR,
  type AnyHCommand,
  type HEvent,
  type AnyHQuery,
  type HCommandAsyncResultType,
  type HQueryAsyncResultType
} from '@hexancore/common';


export abstract class GeneralBus {
  public abstract handleCommand<T extends AnyHCommand>(command: T): HCommandAsyncResultType<T>;
  public abstract handleEvent(event: HEvent): AR<boolean>;
  public abstract handleQuery<T extends AnyHQuery>(query: T): HQueryAsyncResultType<T>;
}
