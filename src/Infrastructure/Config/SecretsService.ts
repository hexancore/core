import { DefineInfrastructureErrors, ERR, INTERNAL_ERR, OK, R } from '@hexancore/common';
import { existsSync, readFileSync } from 'fs';

export interface BasicAuthSecret {
  username: string;
  password: string;
}

export enum SecretsServiceErrors {
  basic_auth_invalid = 'core.infra.config.secret.basic_auth_invalid',
  not_found = 'core.infra.config.secret.not_found',
  json_parse = 'core.infra.config.secret.json_parse',
  file_read = 'core.infra.config.secret.file_read',
}

export class SecretsService {
  public constructor(private secretsDir: string) {}

  public getAsBasicAuth(key: string): R<BasicAuthSecret> {
    return this.getFromJson<BasicAuthSecret>(key).onOk((v) => {
      if (typeof v.password !== 'string' || v.password.length === 0 || typeof v.username !== 'string' || v.username.length === 0) {
        return ERR(SecretsServiceErrors.basic_auth_invalid, 500);
      }

      return OK(v);
    });
  }

  public get(key: string): R<string> {
    const filePath = this.getFilePath(key);
    if (!existsSync(filePath)) {
      return ERR(SecretsServiceErrors.not_found, 500, { key, filePath });
    }
    try {
      return OK(readFileSync(filePath).toString());
    } catch (e) {
      return ERR(SecretsServiceErrors.file_read, 500);
    }
  }

  public getFromJson<T extends Record<string, any>>(key: string): R<T> {
    return this.get(key).map((v: string) => {
      try {
        return JSON.parse(v);
      } catch (e) {
        return ERR(SecretsServiceErrors.json_parse, 500);
      }
    });
  }

  private getFilePath(key: string): string {
    return this.secretsDir + '/' + key;
  }
}
