import { HCommand } from "@hexancore/common";
import { BookDto } from "../../Dto/BookDto";

export class BookCreateCommand extends HCommand<BookDto> {
  public title!: string;

}