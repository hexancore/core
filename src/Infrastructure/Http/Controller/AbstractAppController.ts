import { GeneralBus } from '../../../Application/GeneralBus';
import { ICommand, IQuery } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { type AR } from '@hexancore/common';
import { AbstractController } from './AbstractController';

export abstract class AbstractAppController extends AbstractController {
  public constructor(@Inject() private gb: GeneralBus) {
    super();
  }

  protected handleCommand<C extends ICommand, R>(command: C): AR<R> {
    return this.gb.handleCommand<R>(command);
  }

  protected handleQuery<Q extends IQuery, R>(query: Q): AR<R> {
    return this.gb.handleQuery<R>(query);
  }
}
