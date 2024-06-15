import type { R } from "@hexancore/common/lib/mjs";
import { HttpStatus } from "@nestjs/common";
import { RedirectResult } from "../RedirectResult";

export class AbstractController {

  protected redirect(url: string, statusCode: HttpStatus = HttpStatus.FOUND): R<RedirectResult> {
    return RedirectResult.create(url, statusCode);
  }
}