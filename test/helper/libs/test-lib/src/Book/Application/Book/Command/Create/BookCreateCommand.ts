import { HCommand } from "@hexancore/common";

export class BookCreateCommand extends HCommand<BookCreateCommand, void> {
  public title!: string;
}
