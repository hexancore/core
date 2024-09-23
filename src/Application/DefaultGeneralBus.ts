import { AR, ARW, OKA, AnyHCommand, AnyHQuery, AnyHEvent } from '@hexancore/common';
import { Injectable } from '@nestjs/common';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { GeneralBus, type HCommandHandleResult, type HQueryHandleResult } from './GeneralBus';

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

  public handleCommand<T extends AnyHCommand>(command: T): HCommandHandleResult<T> {
    return ARW(this.commandBus.execute(command)) as any;
  }

  public handleEvent(event: AnyHEvent): AR<boolean> {
    this.eventBus.publish(event);
    return OKA(true);
  }

  public handleQuery<T extends AnyHQuery>(query: T): HQueryHandleResult<T> {
    return ARW(this.queryBus.execute(query)) as any;
  }
}
