import { HQuery } from "@hexancore/common";
import type { BookDto } from "../../Dto/BookDto";

export class BookGetByIdQuery extends HQuery<BookGetByIdQuery, BookDto> {
  public title!: string;
}
