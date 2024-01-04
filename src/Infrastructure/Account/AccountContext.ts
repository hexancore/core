import { AccountId } from '@hexancore/common';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AccountContext {
  public constructor(protected cls: ClsService) {}

  public get(): AccountId {
    return this.cls.get('accountId');
  }

  public set(accountId: AccountId): void {
    this.cls.set('accountId', accountId);
  }
}
