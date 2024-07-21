import { DefineDomainErrors, standard_entity_errors } from "@hexancore/common";

export const BookDomainErrors = DefineDomainErrors('Book', new (class {
  public entity_book: standard_entity_errors = 'not_found';
})());