import { AppErrorCode, DefineErrorsUnion, ERR, JsonErrors, JsonHelper, OK, R } from '@hexancore/common';
import { existsSync, readFileSync } from 'fs';

export interface BasicAuthSecret {
  username: string;
  password: string;
}

export const SecretsErrors = {
  basic_auth_invalid: 'core.infra.config.secret.basic_auth_invalid',
  not_found: 'core.infra.config.secret.not_found',
  file_read: 'core.infra.config.secret.file_read',
  not_array: 'core.infra.config.secret.not_array',
  json_invalid: 'core.infra.config.secret.json_invalid'
} as const;

export type SecretsErrors<K extends keyof typeof SecretsErrors> = DefineErrorsUnion<typeof SecretsErrors, K, 'internal'>;

export class SecretsService {
  public constructor(private secretsDir: string) { }

  public getAsBasicAuth(key: string): R<BasicAuthSecret, JsonErrors<'parse'> | SecretsErrors<'basic_auth_invalid' | 'file_read' | 'not_found'>> {
    return this.getFromJson<BasicAuthSecret>(key).onOk((v) => {
      if (typeof v.password !== 'string' || v.password.length === 0 || typeof v.username !== 'string' || v.username.length === 0) {
        return ERR(SecretsErrors.basic_auth_invalid, 500);
      }

      return OK(v);
    });
  }

  public get(key: string): R<string, SecretsErrors<'file_read' | 'not_found'>> {
    const filePath = this.getFilePath(key);
    if (!existsSync(filePath)) {
      return ERR(SecretsErrors.not_found, 500, { key, filePath });
    }

    try {
      return OK(readFileSync(filePath).toString());
    } catch (e) {
      return ERR(SecretsErrors.file_read, 500);
    }
  }

  public getFromJson<T = Record<string, any>>(
    key: string,
  ): R<T, JsonErrors<'parse'> | SecretsErrors<'file_read' | 'not_found'>> {
    const c = this.get(key)
      .onOk((v: string) => JsonHelper.parse(v)
        .onErr((e) => ERR({ type: SecretsErrors.json_invalid, code: AppErrorCode.INTERNAL_ERROR, data: { secretKey: key }, cause: e })));
    return c as any;
  }

  private getFilePath(key: string): string {
    return this.secretsDir + '/' + key;
  }
}
