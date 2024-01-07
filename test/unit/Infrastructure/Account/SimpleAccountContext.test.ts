/**
 * @group unit
 */

import { AccountId } from '@hexancore/common';
import { AccountContext, SimpleAccountContext } from '@';

describe('SimpleAccountContext', () => {

  let context: AccountContext;

  beforeEach(() => {
    context = new SimpleAccountContext();
  });

  test('get when sets', () => {
    const accountId = AccountId.cs("test");
    context.set(accountId);
    expect(context.get()).toBe(accountId);
  });

  test('get when not sets', () => {
    expect(() => context.get()).toThrowError("");
  });

});
