import { type IEventHandler } from "@nestjs/cqrs";
import { type HEvent, type AR } from "@hexancore/common";

export abstract class HEventHandler<T extends HEvent> implements IEventHandler<T> {
  public abstract handle(event: T): AR<unknown>;
}