import { GeneralBus } from '../../Application/GeneralBus';
import { ICommand, IQuery } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { AsyncResult } from '@hexancore/common';
import { FResponse, sendAsyncResultResponse } from './RestHelperFunctions';

export abstract class AbstractController {
  public constructor(private gb: GeneralBus) {}

  protected handleCommandAndSendResponse(command: ICommand, response: FResponse, successCode: HttpStatus = HttpStatus.OK): Promise<void> {
    return sendAsyncResultResponse(this.handleCommand(command), response, successCode);
  }

  protected handleCommand<R>(command: ICommand): AsyncResult<R> {
    return this.gb.handleCommand<R>(command);
  }

  protected handleQueryAndSendResponse(query: IQuery, response: FResponse, successCode: HttpStatus = HttpStatus.OK): Promise<void> {
    return sendAsyncResultResponse(this.handleQuery(query), response, successCode);
  }

  protected handleQuery<R>(query: IQuery): AsyncResult<R> {
    return this.gb.handleQuery<R>(query);
  }
}
