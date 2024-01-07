import { AccountContext, createInAccountContextFn } from '@/Infrastructure';
import { TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';

export function createInAccountContextModuleFn(module: TestingModule): (accountId: string, fn: () => Promise<void>) => () => Promise<void> {
  return createInAccountContextFn(module.get(ClsService), module.get(AccountContext));
}
