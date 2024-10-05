import {
  AR,
  OKA,
  AnyHCommand,
  AnyHQuery,
  HEvent,
  type HCommandAsyncResultType,
  type HQueryAsyncResultType
} from '@hexancore/common';
import { Injectable } from '@nestjs/common';
import { IEvent } from '@nestjs/cqrs';
import deepEqual from 'deep-equal';
import { GeneralBus } from '../../Application/GeneralBus';

interface HandleExpectation {
  message: AnyHCommand | AnyHQuery;
  result: AR<any>;
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

  public expectHandleCommand<T extends AnyHCommand>(command: T, result: HCommandAsyncResultType<T>): void {
    this.commandsToHandle.unshift({ message: command as any, result });
  }

  public expectHandleEvent(event: HEvent | ((event: HEvent) => boolean)): void {
    this.eventsToHandle.unshift(event);
  }

  public expectHandleQuery<T extends AnyHQuery>(query: T, result: HQueryAsyncResultType<T>): void {
    this.queriesToHandle.unshift({ message: query as any, result });
  }

  public handleCommand<T extends AnyHCommand>(command: T): HCommandAsyncResultType<T> {
    const expectation = this.commandsToHandle.pop();
    if (expectation && deepEqual(expectation.message, command)) {
      return expectation.result as any;
    }

    throw new Error('Unexpected command to handle: ' + command.constructor.name + ' ' + JSON.stringify(command, null, 1));
  }

  public handleEvent(event: HEvent): AR<boolean> {
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

  public handleQuery<T extends AnyHQuery>(query: T): HQueryAsyncResultType<T> {
    const expectation = this.queriesToHandle.pop();
    if (expectation && deepEqual(expectation.message, query)) {
      return expectation.result as any;
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
