/**
 * @group unit/core
 */

import { CommandBus, EventBus, ICommand, IEvent, IQuery, QueryBus } from '@nestjs/cqrs';
import { Mocker } from '@hexancore/mocker';
import { Email, ERR, ERRA, OK, OKA } from '@hexancore/common';
import { GeneralBus } from '@/Application/GeneralBus';
import { DefaultGeneralBus } from '@/Application/DefaultGeneralBus';

class TestCommand implements ICommand {
  public readonly email: Email;
  public constructor(emailRaw: string) {
    this.email = Email.c(emailRaw).v;
  }
}

class TestEvent implements IEvent {
  public readonly email: Email;
  public constructor(emailRaw: string) {
    this.email = Email.c(emailRaw).v;
  }
}

class TestQuery implements IQuery {
  public readonly email: Email;
  public constructor(emailRaw: string) {
    this.email = Email.c(emailRaw).v;
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
    const command = new TestCommand('test@test.com');

    test('when ok', async () => {
      const expectedResult = OKA(true);

      commandBus.expects('execute', command).andReturn(expectedResult.p);

      const currentResult = await gb.handleCommand(command);

      expect(currentResult).toEqual(OK(true));
    });

    test('when error', async () => {
      const expectedResult = ERRA({ type: 'test' });

      commandBus.expects('execute', command).andReturn(expectedResult.p);

      const currentResult = await gb.handleCommand(command);

      expect(currentResult).toEqual(ERR({ type: 'test' }));
    });
  });
});
