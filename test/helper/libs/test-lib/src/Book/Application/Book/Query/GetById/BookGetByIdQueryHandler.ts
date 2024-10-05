import { OKA, ERRA, type HQueryAsyncResultType } from "@hexancore/common";
import { BookGetByIdQuery } from "./BookGetByIdQuery";
import { BookDto } from "../../Dto/BookDto";
import { HQueryHandler } from "@/Application/HQueryHandler";

export class BookGetByIdQueryHandler extends HQueryHandler<BookGetByIdQuery> {
  protected handle(query: BookGetByIdQuery): HQueryAsyncResultType<BookGetByIdQuery> {
    if (query.title === "error") {
      return ERRA("error");
    }

    return OKA(BookDto.cs({
      title: query.title,
    }));
  }
}