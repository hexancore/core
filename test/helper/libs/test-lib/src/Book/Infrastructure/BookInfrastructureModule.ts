import { Module } from '@nestjs/common';
import { BookInfraPort } from '../Application/Book/Service/BookInfraPort';
import { BookInfraAdapter } from './Service/Book/BookInfraAdapter';

export const BookInfraPortProvider = {
  provide: BookInfraPort,
  useClass: BookInfraAdapter
};

@Module({
  imports: [],
  providers: [
    BookInfraPortProvider
  ],
  exports: [BookInfraPortProvider]
})
export class BookInfrastructureModule { }
