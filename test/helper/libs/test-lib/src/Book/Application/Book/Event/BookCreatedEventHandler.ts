import { OKAP, type ARP } from "@hexancore/common";
import { EventsHandler, type IEventHandler } from "@nestjs/cqrs";
import { BookCreatedEvent } from "@test/libs/test-lib/src/Book/Domain/Book/BookCreatedEvent";

@EventsHandler(BookCreatedEvent)
export class BookCreatedEventHandler implements IEventHandler<BookCreatedEvent> {
  public handle(event: BookCreatedEvent): ARP<boolean> {
    return OKAP(true);
  }
}