/**
 * @group unit/core
 */

import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { Mocker } from '@hexancore/mocker';
import { Email, ERR, ERRA, HCommand, HEvent, HQuery, INTERNAL_ERR, OK, OKA, type JsonObjectType } from '@hexancore/common';
import { GeneralBus } from '@/Application/GeneralBus';
import { DefaultGeneralBus } from '@/Application/DefaultGeneralBus';

class TestCommand extends HCommand<TestCommand, boolean> {
  public constructor(public readonly email: Email) {
    super();
  }

  public toJSON(): JsonObjectType<TestCommand> {
    return {
      email: this.email.toJSON(),
    };
  }
}

class TestEvent extends HEvent<TestEvent> {
  public constructor(public readonly email: Email) {
    super();
  }

  public toJSON(): JsonObjectType<TestEvent> {
    return {
      email: this.email.toJSON(),
    };
  }
}

class TestQuery extends HQuery<TestQuery, boolean> {
  public constructor(public readonly email: Email) {
    super();
  }

  public toJSON(): JsonObjectType<TestQuery> {
    return {
      email: this.email.toJSON(),
    };
  }
}

describe('DefaultGeneralBus', () => {
  let commandBus: Mocker<CommandBus>;
  let eventBus: Mocker<EventBus>;
  let queryBus: Mocker<QueryBus>;

  let gb: GeneralBus;

  beforeEach(() => {
    commandBus = Mocker.of();
    eventBus = Mocker.of();
    queryBus = Mocker.of();
    gb = new DefaultGeneralBus(commandBus.i, eventBus.i, queryBus.i);
  });

  afterEach(() => {
    commandBus.checkExpections();
    eventBus.checkExpections();
    queryBus.checkExpections();
  });

  describe('handleCommand', () => {
    const command = new TestCommand(Email.cs('test@test.com'));

    test('when ok', async () => {
      const expectedResult = OKA(true);
      commandBus.expects('execute', command).andReturn(expectedResult.p);

      const current = await gb.handleCommand(command);

      expect(current).toEqual(OK(true));
    });

    test('when error', async () => {
      const expectedResult = ERRA({ type: 'test' });
      commandBus.expects('execute', command).andReturn(expectedResult.p);

      const current = await gb.handleCommand(command);

      expect(current).toEqual(ERR({ type: 'test' }));
    });
  });

  describe('handleEvent', () => {
    const event: TestEvent = new TestEvent(Email.cs('test@test.com'));

    test('when ok', async () => {
      eventBus.expects('publish', event).andReturn(Promise.resolve());

      const current = await gb.handleEvent(event);

      expect(current).toEqual(OK(true));
    });

    test('when error', async () => {
      eventBus.expects('publish', event).andReturnWith(async () => { throw new Error("test"); });

      const current = await gb.handleEvent(event);

      expect(current).toEqual(INTERNAL_ERR(new Error("test")));
    });
  });

  describe('handleQuery', () => {
    const query = new TestQuery(Email.cs('test@test.com'));

    test('when ok', async () => {
      const expectedResult = OKA(true);
      queryBus.expects('execute', query).andReturn(expectedResult.p);

      const currentResult = await gb.handleQuery(query);

      expect(currentResult).toEqual(OK(true));
    });

    test('when error', async () => {
      const expectedResult = ERRA({ type: 'test' });
      queryBus.expects('execute', query).andReturn(expectedResult.p);

      const currentResult = await gb.handleQuery(query);

      expect(currentResult).toEqual(ERR({ type: 'test' }));
    });
  });
});
