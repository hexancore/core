import { createHttpApp, HttpAppFactoryOptions } from './HttpAppFactory';

export interface HttpListenOptions {
  port: number;
  address?: string;
}

export function loadListenFromEnv(): HttpListenOptions {
  return {
    port: process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 3000,
    address: process.env.APP_HOST ?? '0.0.0.0',
  };
}

export async function httpBootstrap(options: HttpAppFactoryOptions): Promise<void> {
  const app = await createHttpApp(options);
  const { port, address } = loadListenFromEnv();
  await app.listen(port, address);
}
