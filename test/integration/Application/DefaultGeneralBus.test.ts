/**
 * @group unit/core
 */

import { Email, HCommand, HEvent, HQuery, type JsonObjectType } from '@hexancore/common';
import { GeneralBus } from '@/Application/GeneralBus';
import { Test, TestingModule } from "@nestjs/testing";
import { BookCreateCommand, BookGetByIdQuery, TestLibModule } from "@test/libs/test-lib/src";
import { BookDto } from "@test/libs/test-lib/src/Book/Application/Book/Dto/BookDto";
import { HcModule } from "@/HcModule";
import { HcMemoryDomainInfraModule } from "@";

class TestCommand extends HCommand<boolean> {
  public constructor(public readonly email: Email) {
    super();
  }

  public toJSON(): JsonObjectType<this> {
    return {
      email: this.email.toJSON(),
    } as any;
  }
}

class TestEvent extends HEvent {
  public constructor(public readonly email: Email) {
    super();
  }

  public toJSON(): JsonObjectType<this> {
    return {
      email: this.email.toJSON(),
    } as any;
  }
}

class TestQuery extends HQuery<boolean> {
  public constructor(public readonly email: Email) {
    super();
  }

  public toJSON(): JsonObjectType<this> {
    return {
      email: this.email.toJSON(),
    } as any;
  }
}

describe("DefaultGeneralBus", () => {
  let gb: GeneralBus;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        HcModule.forRoot(),
        HcMemoryDomainInfraModule,
        TestLibModule
      ],
    }).compile();
    await module.init();
    gb = module.get(GeneralBus);
  });

  afterAll(() => {
    module?.close();
  });

  describe('Command', () => {
    test('when sucess', async () => {
      const current = await gb.handleCommand(BookCreateCommand.cs({ title: "test" }));

      expect(current).toMatchSuccessResult(BookDto.cs({ title: "test" }));
    });

    test('when error', async () => {
      const current = await gb.handleCommand(BookCreateCommand.cs({ title: "error" }));

      expect(current).toMatchAppError({ type: "error" });

    });
  });

  describe('Query', () => {
    test('when sucess', async () => {
      const current = await gb.handleQuery(BookGetByIdQuery.cs({ title: "test" }));

      expect(current).toMatchSuccessResult(BookDto.cs({ title: "test" }));
    });

    test('when error', async () => {
      const current = await gb.handleQuery(BookGetByIdQuery.cs({ title: "error" }));

      expect(current).toMatchAppError({ type: "error" });

    });
  });
  /*
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


    */
});
