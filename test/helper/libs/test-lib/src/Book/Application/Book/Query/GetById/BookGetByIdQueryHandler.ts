import { OKAP, type ARP } from "@hexancore/common";
import { CommandHandler, type IQueryHandler } from "@nestjs/cqrs";
import { BookDto } from "@test/libs/test-lib/src/Book/Domain/Book/BookDto";
import { BookGetByIdQuery } from "./BookGetByIdQuery";

@CommandHandler(BookGetByIdQuery)
export class BookGetByIdQueryHandler implements IQueryHandler<BookGetByIdQuery> {
  public execute(command: BookGetByIdQuery): ARP<BookDto> {
    return OKAP(BookDto.cs({
      title: command.title
    }));
  }
}