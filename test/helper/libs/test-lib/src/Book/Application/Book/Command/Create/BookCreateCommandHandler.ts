import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { BookCreateCommand } from "./BookCreateCommand";
import { OKAP, type ARP } from "@hexancore/common";
import { BookDto } from "../../Dto/BookDto";

@CommandHandler(BookCreateCommand)
export class BookCreateCommandHandler implements ICommandHandler<BookCreateCommand> {
  public execute(command: BookCreateCommand): ARP<BookDto> {
    return OKAP(BookDto.cs({
      title: command.title,

    }));
  }
}