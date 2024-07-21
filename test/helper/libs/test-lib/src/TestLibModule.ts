import { Module } from "@nestjs/common";
import { BookModule } from "./Book/BookModule";

@Module({
  imports: [BookModule],
  exports: [BookModule]
})
export class TestLibModule {

}