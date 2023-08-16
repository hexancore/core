/**
 * @group unit/core
 */

import { ICommand, IEvent, IQuery } from '@nestjs/cqrs';
import { Email, OK, OKA } from '@hexancore/common';
import { MockGeneralBus } from '@/Test/Application/MockGeneralBus';

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

describe('MockGeneralBus', () => {
  let generalBus: MockGeneralBus;
  beforeEach(() => {
    generalBus = new MockGeneralBus();
  });

  test('handleCommand() when expected is correct', async () => {
    const expectedResult = OKA(true);
    generalBus.expectHandleCommand(new TestCommand('test@test.com'), expectedResult);

    const currentResult = await generalBus.handleCommand(new TestCommand('test@test.com'));

    expect(currentResult).toEqual(OK(true));
  });

  test('handleCommand() then return in expects order', async () => {
    const expectedResult1 = OKA(true);
    const expectedResult2 = OKA(true);
    generalBus.expectHandleCommand(new TestCommand('test1@test.com'), expectedResult1);
    generalBus.expectHandleCommand(new TestCommand('test2@test.com'), expectedResult2);

    const currentResult1 = await generalBus.handleCommand(new TestCommand('test1@test.com'));
    const currentResult2 = await generalBus.handleCommand(new TestCommand('test2@test.com'));

    expect(currentResult1).toEqual(OK(true));
    expect(currentResult2).toEqual(OK(true));
  });

  test('handleCommand() when expected is not correct', async () => {
    generalBus.expectHandleCommand(new TestCommand('test@test.com'), OKA(true));
    const expectedNotCorrectCommand = new TestCommand('test2@test.com');

    expect(() => generalBus.handleCommand(expectedNotCorrectCommand)).toThrowError(
      new Error('Unexpected command to handle: TestCommand ' + JSON.stringify(expectedNotCorrectCommand, null, 1)),
    );
  });

  test('handleCommand() when no expectations', async () => {
    const expectedNotCorrectCommand = new TestCommand('test2@test.com');

    expect(() => generalBus.handleCommand(expectedNotCorrectCommand)).toThrowError(
      new Error('Unexpected command to handle: TestCommand ' + JSON.stringify(expectedNotCorrectCommand, null, 1)),
    );
  });

  test('handleEvent() when expected is correct', async () => {
    generalBus.expectHandleEvent(new TestEvent('test@test.com'));

    await expect(generalBus.handleEvent(new TestEvent('test@test.com'))).resolves;
  });

  test('handleEvent() when use function matcher and expected is correct', () => {
    generalBus.expectHandleEvent((event: IEvent) => event instanceof TestEvent && event.email.v === 'test@test.com');

    expect(() => generalBus.handleEvent(new TestEvent('test@test.com'))).not.toThrow();
  });

  test('handleEvent() when expected is not correct', async () => {
    generalBus.expectHandleEvent(new TestEvent('test@test.com'));
    const expectedNotCorrectEvent = new TestEvent('test2@test.com');

    expect(() => generalBus.handleEvent(expectedNotCorrectEvent)).toThrow(
      'Unexpected event to handle: TestEvent ' + JSON.stringify(expectedNotCorrectEvent, null, 1),
    );
  });

  test('handleEvent() when no expectations', async () => {
    const expectedNotCorrectEvent = new TestEvent('test2@test.com');

    expect(() => generalBus.handleEvent(expectedNotCorrectEvent)).toThrow(
      'Unexpected event to handle: TestEvent ' + JSON.stringify(expectedNotCorrectEvent, null, 1),
    );
  });

  test('handleQuery() when expected is correct', async () => {
    const expectedResult = OKA(true);
    generalBus.expectHandleQuery(new TestQuery('test@test.com'), expectedResult);

    const currentResult = await generalBus.handleQuery(new TestQuery('test@test.com'));

    expect(currentResult).toEqual(OK(true));
  });

  test('handleQuery() then return in expects order', async () => {
    const expectedResult1 = OKA(true);
    const expectedResult2 = OKA(true);
    generalBus.expectHandleQuery(new TestQuery('test1@test.com'), expectedResult1);
    generalBus.expectHandleQuery(new TestQuery('test2@test.com'), expectedResult2);

    const currentResult1 = await generalBus.handleQuery(new TestQuery('test1@test.com'));
    const currentResult2 = await generalBus.handleQuery(new TestQuery('test2@test.com'));

    expect(currentResult1).toEqual(OK(true));
    expect(currentResult2).toEqual(OK(true));
  });

  test('handleQuery() when expected is not correct', async () => {
    generalBus.expectHandleQuery(new TestQuery('test@test.com'), OKA(true));
    const expectedNotCorrectQuery = new TestQuery('test2@test.com');

    expect(() => generalBus.handleQuery(expectedNotCorrectQuery)).toThrowError(
      new Error('Unexpected query to handle: TestQuery ' + JSON.stringify(expectedNotCorrectQuery, null, 1)),
    );
  });

  test('handleQuery() when no expectations', async () => {
    const expectedNotCorrectQuery = new TestQuery('test2@test.com');

    expect(() => generalBus.handleQuery(expectedNotCorrectQuery)).toThrowError(
      new Error('Unexpected query to handle: TestQuery ' + JSON.stringify(expectedNotCorrectQuery, null, 1)),
    );
  });
});
