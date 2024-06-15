import { Injectable } from '@nestjs/common';
import { CommandBus, EventBus, ICommand, IEvent, IQuery, QueryBus } from '@nestjs/cqrs';
import { ARW, AsyncResult, OKA } from '@hexancore/common';
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

  public handleCommand<T>(command: ICommand): AsyncResult<T> {
    return ARW(this.commandBus.execute(command));
  }

  public handleEvent(event: IEvent): AsyncResult<boolean> {
    this.eventBus.publish(event);
    return OKA(true);
  }

  public handleQuery<T>(query: IQuery): AsyncResult<T> {
    return ARW(this.queryBus.execute(query));
  }
}
