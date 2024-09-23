import { AnyHCommand, AnyHQuery } from '@hexancore/common';
import { GeneralBus, type HCommandHandleResult, type HQueryHandleResult } from '../../../Application';
import { Inject } from '@nestjs/common';
import { AbstractController } from './AbstractController';

export abstract class AbstractAppController extends AbstractController {
  public constructor(@Inject() private gb: GeneralBus) {
    super();
  }

  protected handleCommand<T extends AnyHCommand>(command: T): HCommandHandleResult<T> {
    return this.gb.handleCommand(command);
  }

  protected handleQuery<T extends AnyHQuery>(query: T): HQueryHandleResult<T> {
    return this.gb.handleQuery(query);
  }
}
