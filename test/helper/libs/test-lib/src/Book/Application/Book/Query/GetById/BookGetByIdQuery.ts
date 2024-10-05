import { HQuery } from "@hexancore/common";
import type { BookDto } from "../../Dto/BookDto";

export class BookGetByIdQuery extends HQuery<BookDto> {
  public title!: string;
}
