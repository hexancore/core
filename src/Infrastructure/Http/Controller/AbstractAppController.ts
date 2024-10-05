import {
  type AnyHCommand,
  type AnyHQuery,
  type HCommandAsyncResultType,
  type HQueryAsyncResultType
} from '@hexancore/common';
import { GeneralBus } from '../../../Application';
import { Inject } from '@nestjs/common';
import { AbstractController } from './AbstractController';

export abstract class AbstractAppController extends AbstractController {
  public constructor(@Inject() private gb: GeneralBus) {
    super();
  }

  protected handleCommand<T extends AnyHCommand>(command: T): HCommandAsyncResultType<T> {
    return this.gb.handleCommand(command);
  }

  protected handleQuery<T extends AnyHQuery>(query: T): HQueryAsyncResultType<T> {
    return this.gb.handleQuery(query);
  }
}
