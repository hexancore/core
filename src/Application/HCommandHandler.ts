import { ICommandHandler } from "@nestjs/cqrs";
import { type AnyHCommand, type HCommandResultType, type HCommandAsyncResultType, type HCommandAsyncResultPromiseType  } from "@hexancore/common";

export abstract class HCommandHandler<T extends AnyHCommand> implements ICommandHandler<T, HCommandResultType<T>> {
  public execute(command: T): HCommandAsyncResultPromiseType<T> {
    return this.handle(command).p;
  }

  protected abstract handle(command: T): HCommandAsyncResultType<T>;
}