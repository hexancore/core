import 'reflect-metadata';
import { AppMeta, EnvAppMetaProvider } from '@hexancore/common';

process.env['APP_ENV'] = 'test';
process.env['APP_ID'] = 'core';
AppMeta.setProvider(EnvAppMetaProvider);

process.on('unhandledRejection', (err) => {
  console.log(err);
});
