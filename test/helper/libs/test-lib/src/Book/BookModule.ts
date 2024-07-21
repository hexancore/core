import { Module } from "@nestjs/common";
import { BookInfraModule } from "./Infrastructure/BookInfraModule";

// TEST TRANSFORMING IGNORE COMMENT

export const SOME_ASSIGMENT_NOISE = 10;



@Module({
  imports: [BookInfraModule]
})
export class BookModule {
}