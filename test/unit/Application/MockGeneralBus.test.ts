/**
 * @group unit/core
 */

import { Email, OK, OKA, JsonObjectType, HCommand,HQuery, HEvent } from '@hexancore/common';
import { MockGeneralBus } from '@/Test/Application/MockGeneralBus';

class TestCommand extends HCommand<boolean> {
  public readonly email!: Email;
  public toJSON(): JsonObjectType<this> {
    return {
      email: this.email.toJSON(),
    } as any;
  }
}

class TestEvent extends HEvent {
  public readonly email!: Email;

  public toJSON(): JsonObjectType<this> {
    return {
      email: this.email.toJSON(),
    } as any;
  }
}

class TestQuery extends HQuery<boolean> {
  public readonly email!: Email;

  public toJSON(): JsonObjectType<this> {
    return {
      email: this.email.toJSON(),
    } as any;
  }
}

describe('MockGeneralBus', () => {
  let generalBus: MockGeneralBus;
  const email = Email.cs('test@test.com');
  const email1 = Email.cs('test_1@test.com');
  const email2 = Email.cs('test_2@test.com');
  beforeEach(() => {
    generalBus = new MockGeneralBus();
  });

  test('handleCommand() when expected is correct', async () => {
    const expectedResult = OKA(true);
    generalBus.expectHandleCommand(TestCommand.cs({ email: email }), expectedResult);

    const currentResult = await generalBus.handleCommand(TestCommand.cs({ email: email }));

    expect(currentResult).toEqual(OK(true));
  });

  test('handleCommand() then return in expects order', async () => {
    const expectedResult1 = OKA(true);
    const expectedResult2 = OKA(true);
    generalBus.expectHandleCommand(TestCommand.cs({ email: email1 }), expectedResult1);
    generalBus.expectHandleCommand(TestCommand.cs({ email: email2 }), expectedResult2);

    const currentResult1 = await generalBus.handleCommand(TestCommand.cs({ email: email1 }));
    const currentResult2 = await generalBus.handleCommand(TestCommand.cs({ email: email2 }));

    expect(currentResult1).toEqual(OK(true));
    expect(currentResult2).toEqual(OK(true));
  });

  test('handleCommand() when expected is not correct', async () => {
    generalBus.expectHandleCommand(TestCommand.cs({ email: email }), OKA(true));
    const expectedNotCorrectCommand = TestCommand.cs({ email: email2 });

    expect(() => generalBus.handleCommand(expectedNotCorrectCommand)).toThrowError(
      new Error('Unexpected command to handle: TestCommand ' + JSON.stringify(expectedNotCorrectCommand, null, 1)),
    );
  });

  test('handleCommand() when no expectations', async () => {
    const expectedNotCorrectCommand = TestCommand.cs({ email: email2 });

    expect(() => generalBus.handleCommand(expectedNotCorrectCommand)).toThrowError(
      new Error('Unexpected command to handle: TestCommand ' + JSON.stringify(expectedNotCorrectCommand, null, 1)),
    );
  });

  test('handleEvent() when expected is correct', async () => {
    generalBus.expectHandleEvent(TestEvent.cs({ email: email }));

    await expect(generalBus.handleEvent(TestEvent.cs({ email: email }))).resolves;
  });

  test('handleEvent() when use function matcher and expected is correct', () => {
    generalBus.expectHandleEvent((event) => event instanceof TestEvent && event.email.v === 'test@test.com');

    expect(() => generalBus.handleEvent(TestEvent.cs({ email: email }))).not.toThrow();
  });

  test('handleEvent() when expected is not correct', async () => {
    generalBus.expectHandleEvent(TestEvent.cs({ email: email }));
    const expectedNotCorrectEvent = TestEvent.cs({ email: email2 });

    expect(() => generalBus.handleEvent(expectedNotCorrectEvent)).toThrow(
      'Unexpected event to handle: TestEvent ' + JSON.stringify(expectedNotCorrectEvent, null, 1),
    );
  });

  test('handleEvent() when no expectations', async () => {
    const expectedNotCorrectEvent = TestEvent.cs({ email: email2 });

    expect(() => generalBus.handleEvent(expectedNotCorrectEvent)).toThrow(
      'Unexpected event to handle: TestEvent ' + JSON.stringify(expectedNotCorrectEvent, null, 1),
    );
  });

  test('handleQuery() when expected is correct', async () => {
    const expectedResult = OKA(true);
    generalBus.expectHandleQuery(TestQuery.cs({ email: email }), expectedResult);

    const currentResult = await generalBus.handleQuery(TestQuery.cs({ email: email }));

    expect(currentResult).toEqual(OK(true));
  });

  test('handleQuery() then return in expects order', async () => {
    const expectedResult1 = OKA(true);
    const expectedResult2 = OKA(true);
    generalBus.expectHandleQuery(TestQuery.cs({ email: email1 }), expectedResult1);
    generalBus.expectHandleQuery(TestQuery.cs({ email: email2 }), expectedResult2);

    const currentResult1 = await generalBus.handleQuery(TestQuery.cs({ email: email1 }));
    const currentResult2 = await generalBus.handleQuery(TestQuery.cs({ email: email2 }));

    expect(currentResult1).toEqual(OK(true));
    expect(currentResult2).toEqual(OK(true));
  });

  test('handleQuery() when expected is not correct', async () => {
    generalBus.expectHandleQuery(TestQuery.cs({ email: email }), OKA(true));
    const expectedNotCorrectQuery = TestQuery.cs({ email: email2 });

    expect(() => generalBus.handleQuery(expectedNotCorrectQuery)).toThrowError(
      new Error('Unexpected query to handle: TestQuery ' + JSON.stringify(expectedNotCorrectQuery, null, 1)),
    );
  });

  test('handleQuery() when no expectations', async () => {
    const expectedNotCorrectQuery = TestQuery.cs({ email: email2 });

    expect(() => generalBus.handleQuery(expectedNotCorrectQuery)).toThrowError(
      new Error('Unexpected query to handle: TestQuery ' + JSON.stringify(expectedNotCorrectQuery, null, 1)),
    );
  });
});
