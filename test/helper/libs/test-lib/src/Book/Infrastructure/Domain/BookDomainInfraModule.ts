import { Module, type Provider } from '@nestjs/common';
import {HcAppModuleMeta} from "@/Util/ModuleHelper";
HcAppModuleMeta; // testing transforms compilerOptions.paths

const FakeProvider: Provider = {
  provide: "FAKE_BOOK_DOMAIN_INFRA",
  useValue: "fake"
};

@Module({
  providers: [FakeProvider],
  exports: [FakeProvider]
})
export class BookDomainInfraModule { }
