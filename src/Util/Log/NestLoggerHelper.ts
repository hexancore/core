import { Logger } from "@hexancore/common";
import { LoggerService } from "@nestjs/common";


class NestLoggerWrapper implements LoggerService {
  public constructor(private w: Logger) {}

  public debug(message: any, ...optionalParams: any[]): any {
    this.w.debug(message, optionalParams.length ? { nest: optionalParams } : undefined, ["nest"]);
  }

  public log(message: any, ...optionalParams: any[]): any {
    this.w.info(message, optionalParams.length ? { nest: optionalParams } : undefined, ["nest"]);
  }

  public warn(message: any, ...optionalParams: any[]): any {
    this.w.warn(message, optionalParams.length ? { nest: optionalParams } : undefined, ["nest"]);
  }

  public error(message: any, ...optionalParams: any[]): any {
    this.w.error(message, optionalParams.length ? { nest: optionalParams } : undefined, ["nest"]);
  }
}

export function toNestLogger(logger: Logger): LoggerService {
  return new NestLoggerWrapper(logger);
}
