import { AccountId, LogicError } from '@hexancore/common';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { AccountContext } from './AccountContext';

/**
 * Async concurency safe AccountContext implementation using nodejs AsyncLocalStorage
 */
@Injectable()
export class ClsAccountContext extends AccountContext {
  public constructor(protected cls: ClsService) {
    super();
  }
  public get(): AccountId {
    const id = this.cls.get('accountId');
    if (!id) {
      throw new LogicError('AccountContext is not sets');
    }

    return id;
  }

  public set(accountId: AccountId): void {
    this.cls.set('accountId', accountId);
  }
}

export function createInAccountContextFn(cls: ClsService, ac: AccountContext): (accountId: string, fn: () => Promise<void>) => () => Promise<void> {
  return (accountId: string, fn: () => Promise<void>) => {
    return () => {
      return cls.run(() => {
        ac.set(AccountId.cs(accountId));
        return fn();
      });
    };
  };
}
