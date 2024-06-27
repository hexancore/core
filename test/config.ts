import 'reflect-metadata';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import '@hexancore/common/testing/jest';

process.env['APP_ENV'] = 'test';
process.env['APP_ID'] = 'core';

process.env['TEST_TMP_DIR'] = path.join(__dirname, 'tmp');
if (!existsSync(process.env['TEST_TMP_DIR'])) {
  mkdirSync(process.env['TEST_TMP_DIR']);
}

process.on('unhandledRejection', (err) => {
  console.log(err);
});
