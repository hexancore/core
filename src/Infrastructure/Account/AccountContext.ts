import { AccountId} from '@hexancore/common';

/**
 * An abstract class representing an account context.
 * It provides abstract methods for getting and setting an account identifier (AccountId).
 * Classes inheriting from this class must implement these methods to tailor the logic
 * to the specific requirements of the application.
 */
export abstract class AccountContext {
  /**
   * Retrieves the account identifier.
   * @returns {AccountId} The current account identifier.
   */
  public abstract get(): AccountId;

  /**
   * Sets the account identifier.
   * @param {AccountId} accountId - The account identifier to set.
   */
  public abstract set(accountId: AccountId): void;
}


