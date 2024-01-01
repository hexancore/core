import { AppMeta } from '@hexancore/common';
import path from 'path';

export class AppPaths {
  private paths: Record<string, string>;

  public get home(): string {
    this.load();
    return this.paths.home;
  }
  public get configDir(): string {
    this.load();
    return this.paths.configDir;
  }
  public get configFilePath(): string {
    this.load();
    return this.paths.configFilePath;
  }
  public get secretsDir(): string {
    this.load();
    return this.paths.secretsDir;
  }

  private load(): void {
    if (this.paths) {
      return;
    }

    const appHome = process.env.APP_HOME ?? process.cwd();
    const configDir = process.env.APP_CONFIG_DIR ?? path.posix.join(appHome, 'config', AppMeta.get().env);
    const secretsDir = process.env.APP_SECRETS_DIR ?? path.posix.join(configDir, 'secrets');

    this.paths = {
      home: appHome,
      configDir: configDir,
      configFilePath: path.posix.join(configDir, 'config.yaml'),
      secretsDir: secretsDir,
    };
  }
}

export const APP_PATHS: AppPaths = new AppPaths();
