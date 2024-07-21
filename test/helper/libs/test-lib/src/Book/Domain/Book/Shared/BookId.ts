import { UIntValue, ValueObject } from "@hexancore/common";

@ValueObject('Book')
export class BookId extends UIntValue<BookId> { }