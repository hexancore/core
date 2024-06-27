import { AppMeta } from '@hexancore/common';
import path from 'node:path';

export class AppPaths {
  private paths!: Record<string, string>;

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
    const configMultiApps = !!(process.env.APP_CONFIG_MULTI_APPS && process.env.APP_CONFIG_MULTI_APPS == "1");
    const configDir = process.env.APP_CONFIG_DIR ?? this.getDefaultConfigDir(appHome, configMultiApps);
    const secretsDir = process.env.APP_SECRETS_DIR ?? path.posix.join(configDir, 'secrets');

    this.paths = {
      home: appHome,
      configDir: configDir,
      configFilePath: path.posix.join(configDir, 'config.yaml'),
      secretsDir: secretsDir,
    };
  }

  private getDefaultConfigDir(appHome: string, configMultiApps: boolean): string {
    const appMeta = AppMeta.get();
    if (configMultiApps) {
      return path.posix.join(appHome, 'config', appMeta.id, appMeta.env);
    }
    return path.posix.join(appHome, 'config', appMeta.env);
  }
}

export const APP_PATHS: AppPaths = new AppPaths();
