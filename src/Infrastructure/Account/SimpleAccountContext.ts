import { AccountId, LogicError } from "@hexancore/common";
import { Injectable } from "@nestjs/common";
import { AccountContext } from "./AccountContext";

/**
 * Simple, not request concurency safe implementation of AccountContext. Usable for integration tests.
 */
@Injectable()
export class SimpleAccountContext extends AccountContext {
  public constructor(private current?: AccountId) {
    super();
  }

  public get(): AccountId {
    if (!this.current) {
      throw new LogicError('AccountContext is not sets');
    }

    return this.current;
  }

  public set(accountId: AccountId): void {
    this.current = accountId;
  }
}