import { OK, type R } from "@hexancore/common";
import { HttpStatus } from "@nestjs/common";
import { RedirectResult } from "../RedirectResult";

export abstract class AbstractController {

  protected redirect(url: string, statusCode: HttpStatus = HttpStatus.FOUND): R<RedirectResult> {
    return OK(RedirectResult.create(url, statusCode));
  }
}