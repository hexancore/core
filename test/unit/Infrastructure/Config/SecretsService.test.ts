/**
 * @group unit/core
 */

import { SecretsService, SecretsErrors } from '@/Infrastructure/Config/SecretsService';
import path from 'path';
import { mkdirSync } from 'fs';
import fs from 'fs-extra';
import { OK } from '@hexancore/common';

describe('SecretsService', () => {
  let service: SecretsService;
  const secretsDir = path.join(process.env['TEST_TMP_DIR']!, 'SecretsServiceTest');

  function writeSecret(value: string | Record<string, any>) {
    fs.writeFileSync(path.join(secretsDir, 'test'), typeof value === 'string' ? value : JSON.stringify(value));
  }

  beforeEach(() => {
    fs.emptyDirSync(secretsDir);
    mkdirSync(secretsDir, { recursive: true });

    service = new SecretsService(secretsDir);
  });

  test('get() when exists', () => {
    writeSecret('test_secret');
    const r = service.get('test');
    expect(r).toEqual(OK('test_secret'));
  });

  test('get() when not exists', () => {
    writeSecret('test_secret');
    const r = service.get('test');
    expect(r).toEqual(OK('test_secret'));
  });

  describe('getFromJson()', () => {
    test('return secret', () => {
      writeSecret({ username: 'test_user', password: 'test_password' });
      const r = service.getFromJson('test');
      expect(r).toEqual(OK({ username: 'test_user', password: 'test_password' }));
    });

    test('when invalid json', () => {
      writeSecret("{'invalid'}");
      const r = service.getFromJson('test');
      expect(r).toMatchAppError({ type: SecretsErrors.json_invalid });
    });
  });

  describe('getAsBasicAuth()', () => {
    test('return secret', () => {
      writeSecret({ username: 'test_user', password: 'test_password' });
      const r = service.getAsBasicAuth('test');
      expect(r).toEqual(OK({ username: 'test_user', password: 'test_password' }));
    });

    test('when no password', () => {
      writeSecret({ username: 'test_user' });
      const r = service.getAsBasicAuth('test');
      expect(r).toMatchAppError({ type: SecretsErrors.basic_auth_invalid });
    });

    test('when no username', () => {
      fs.writeFileSync(path.join(secretsDir, 'test'), JSON.stringify({ password: 'test_password' }));
      const r = service.getAsBasicAuth('test');
      expect(r).toMatchAppError({ type: SecretsErrors.basic_auth_invalid });
    });
  });
});
