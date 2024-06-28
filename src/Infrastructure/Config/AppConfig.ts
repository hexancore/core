import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsService, type BasicAuthSecret, type SecretsErrors } from './SecretsService';
import { type R, OK, ERR, AppErrorCode, type JsonErrors, type DefineErrorsUnion } from '@hexancore/common';

export const AppConfigErrors = {
  property_not_found: 'core.infra.config.property_not_found',
} as const;

export type AppConfigErrors<K extends keyof typeof AppConfigErrors> = DefineErrorsUnion<typeof AppConfigErrors, K, 'internal'>;

@Injectable()
export class AppConfig {
  public constructor(private config: ConfigService, private secrets: SecretsService) {

  }

  public get<T = any>(propertyPath: string): R<T> {
    const value = this.config.get<T>(propertyPath);
    if (value === undefined) {
      return ERR(AppConfigErrors.property_not_found, AppErrorCode.INTERNAL_ERROR, { propertyPath });
    }

    return OK(value as T);
  }

  public getOrDefault<T = any>(propertyPath: string, defaultValue: T): T {
    return this.config.get<T>(propertyPath, defaultValue);
  }

  public getOrPanic<T = any>(propertyPath: string): T {
    const r = this.get<T>(propertyPath);
    r.panicIfError();
    return r.v;
  }

  public getSecret(key: string): string {
    const r = this.secrets.get(key);
    r.panicIfError();
    return r.v;
  }

  public getSecretFromJson<T>(key: string): T {
    const r = this.secrets.getFromJson<T>(key);
    r.panicIfError();
    return r.v;
  }

  public getSecretAsBasicAuth(key: string): BasicAuthSecret {
    const r = this.secrets.getAsBasicAuth(key);
    r.panicIfError();
    return r.v;
  }

}
