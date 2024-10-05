import {
  type AR,
  ARW,
  type AnyHCommand,
  type AnyHQuery,
  type HEvent,
  type HCommandAsyncResultType,
  type HQueryAsyncResultType
} from '@hexancore/common';
import { Injectable } from '@nestjs/common';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { GeneralBus } from './GeneralBus';

@Injectable()
export class DefaultGeneralBus extends GeneralBus {
  public constructor(
    private commandBus: CommandBus,
    private eventBus: EventBus,
    private queryBus: QueryBus
  ) {
    super();
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.queryBus = queryBus;
  }

  public handleCommand<T extends AnyHCommand>(command: T): HCommandAsyncResultType<T> {
    return ARW(this.commandBus.execute(command)) as any;
  }

  public handleEvent(event: HEvent): AR<boolean> {
    return ARW(this.eventBus.publish(event)).mapToTrue();
  }

  public handleQuery<T extends AnyHQuery>(query: T): HQueryAsyncResultType<T> {
    return ARW(this.queryBus.execute(query)) as any;
  }
}
