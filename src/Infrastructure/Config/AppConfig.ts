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

  public get<T>(propertyPath: string): R<T> {
    const value = this.config.get<T>(propertyPath);
    if (value === undefined) {
      return ERR(AppConfigErrors.property_not_found, AppErrorCode.INTERNAL_ERROR, { propertyPath });
    }

    return OK(value as T);
  }

  public getOrPanic<T>(propertyPath: string): R<T> {
    const r = this.get<T>(propertyPath);
    r.panicIfError();
    return r;
  }

  public getSecret(key: string, panicIfError = true): R<string, SecretsErrors<'file_read' | 'not_found'>> {
    const r = this.secrets.get(key);
    if (panicIfError) {
      r.panicIfError();
      return undefined as any;
    }

    return r;
  }

  public getSecretFromJson<T>(key: string, panicIfError = true): R<T, JsonErrors<'parse'> | SecretsErrors<'file_read' | 'not_found'>> {
    const r = this.secrets.getFromJson<T>(key);
    if (panicIfError) {
      r.panicIfError();
      return undefined as any;
    }

    return r;
  }

  public getSecretAsBasicAuth(key: string, panicIfError = true): R<BasicAuthSecret, JsonErrors<'parse'> | SecretsErrors<'basic_auth_invalid' | 'file_read' | 'not_found'>> {
    const r = this.secrets.getAsBasicAuth(key);
    if (panicIfError) {
      r.panicIfError();
      return undefined as any;
    }

    return r;
  }

}
