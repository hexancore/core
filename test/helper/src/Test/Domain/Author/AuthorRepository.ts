import type { IAggregateRootRepository } from "@";
import type { Author } from "./Author";

export interface AuthorRepository extends IAggregateRootRepository<Author> { }