import { Module } from "@nestjs/common";
import { BookModule } from "./Book/BookModule";

@Module({
  imports: [BookModule]
})
export class TestLibModule {

}