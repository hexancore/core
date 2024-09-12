import { OKAP, type ARP } from "@hexancore/common";
import { CommandHandler, type IQueryHandler } from "@nestjs/cqrs";
import { BookGetByIdQuery } from "./BookGetByIdQuery";
import { BookDto } from "../../Dto/BookDto";

@CommandHandler(BookGetByIdQuery)
export class BookGetByIdQueryHandler implements IQueryHandler<BookGetByIdQuery> {
  public execute(command: BookGetByIdQuery): ARP<BookDto> {
    return OKAP(BookDto.cs({
      title: command.title
    }));
  }
}