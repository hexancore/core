import { AsyncResult, OKA } from '@hexancore/common';
import { Injectable } from '@nestjs/common';
import { ICommand, IEvent, IQuery } from '@nestjs/cqrs';
import deepEqual from 'deep-equal';
import { GeneralBus } from '../../Application/GeneralBus';

interface HandleExpectation {
  message: ICommand | IQuery | IEvent;
  result: AsyncResult<any>;
}

@Injectable()
export class MockGeneralBus extends GeneralBus {
  private commandsToHandle: HandleExpectation[];
  private eventsToHandle: IEvent[];
  private queriesToHandle: HandleExpectation[];

  public constructor() {
    super();
    this.commandsToHandle = [];
    this.eventsToHandle = [];
    this.queriesToHandle = [];
  }

  public expectHandleCommand(command: ICommand, result: AsyncResult<any>): void {
    this.commandsToHandle.unshift({ message: command, result });
  }

  public expectHandleEvent(event: IEvent | ((event: IEvent) => boolean)): void {
    this.eventsToHandle.unshift(event);
  }

  public expectHandleQuery(query: IQuery, result: AsyncResult<any>): void {
    this.queriesToHandle.unshift({ message: query, result });
  }

  public handleCommand(command: ICommand): AsyncResult<any> {
    const expectation = this.commandsToHandle.pop();
    if (expectation && deepEqual(expectation.message, command)) {
      return expectation.result;
    }

    throw new Error('Unexpected command to handle: ' + command.constructor.name + ' ' + JSON.stringify(command, null, 1));
  }

  public handleEvent(event: IEvent): AsyncResult<boolean> {
    const expectation = this.eventsToHandle.pop();
    if (typeof expectation == 'function') {
      if (!expectation(event)) {
        throw new Error('Unexpected event to handle: ' + event.constructor.name + ' ' + JSON.stringify(event, null, 1));
      }
    } else if (!deepEqual(expectation, event)) {
      throw new Error('Unexpected event to handle: ' + event.constructor.name + ' ' + JSON.stringify(event, null, 1));
    }

    return OKA(true);
  }

  public handleQuery(query: IQuery): AsyncResult<any> {
    const expectation = this.queriesToHandle.pop();
    if (expectation && deepEqual(expectation.message, query)) {
      return expectation.result;
    }

    throw new Error('Unexpected query to handle: ' + query.constructor.name + ' ' + JSON.stringify(query, null, 1));
  }

  public checkAllHandled(): void {
    if (this.commandsToHandle.length > 0) {
      throw new Error('Unhandled commands: ' + this.commandsToHandle.map((v) => JSON.stringify(v, null, 1)).join('\n'));
    }

    if (this.eventsToHandle.length > 0) {
      throw new Error('Unhandled events: ' + this.eventsToHandle.map((v) => JSON.stringify(v, null, 1)).join('\n'));
    }

    if (this.queriesToHandle.length > 0) {
      throw new Error('Unhandled queries: ' + this.queriesToHandle.map((v) => JSON.stringify(v, null, 1)).join('\n'));
    }
  }
}
