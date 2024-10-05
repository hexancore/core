import { Module } from '@nestjs/common';
import { BookInfraPort } from '../Application/Book/Service/BookInfraPort';
import { BookInfraAdapter } from './Service/Book/BookInfraAdapter';
import { BookDomainInfraModule } from './Domain/BookDomainInfraModule';

export const BookInfraPortProvider = {
  provide: BookInfraPort,
  useClass: BookInfraAdapter
};

@Module({
  imports: [BookDomainInfraModule],
  providers: [
    BookInfraPortProvider,
  ],
  exports: [BookInfraPortProvider, BookDomainInfraModule]
})
export class BookInfraModule { }


