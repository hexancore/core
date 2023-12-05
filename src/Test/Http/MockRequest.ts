import { HttpMethod } from "@/Infrastructure/Http/RestHelperFunctions";

export class MockRequest {
  public cookies = {};
  public headers = {};
  public constructor(public readonly method: HttpMethod, public readonly url: string) {}
}