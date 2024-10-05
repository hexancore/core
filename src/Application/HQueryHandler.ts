import { type AnyHQuery, HQueryResultType, HQueryAsyncResultType } from "@hexancore/common";
import { type IQueryHandler } from "@nestjs/cqrs";

export abstract class HQueryHandler<T extends AnyHQuery> implements IQueryHandler<T, HQueryResultType<T>> {
  public execute(query: T): Promise<HQueryResultType<T>> {
    return this.handle(query).p;
  }

  protected abstract handle(query: T): HQueryAsyncResultType<T>;
}