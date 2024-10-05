import { HCommandHandler } from "@/Application/HCommandHandler";
import { OKA, ERRA, type HCommandAsyncResultType } from "@hexancore/common";
import { BookDto } from "../../Dto/BookDto";
import { BookCreateCommand } from "./BookCreateCommand";
import { CommandHandler } from "@nestjs/cqrs";

@CommandHandler(BookCreateCommand)
export class BookCreateCommandHandler extends HCommandHandler<BookCreateCommand> {
  protected handle(command: BookCreateCommand): HCommandAsyncResultType<BookCreateCommand> {
    if (command.title === "error") {
      return ERRA("error");
    }

    return OKA(BookDto.cs({
      title: command.title,
    }));
  }
}