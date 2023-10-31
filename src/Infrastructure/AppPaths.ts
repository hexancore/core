import path from 'path';

export interface AppPaths {
    home: string,
    configDir,
    configFilePath,
    secretsDir,
}

const appHome = process.env.APP_HOME ?? process.cwd();
const configDir = process.env.APP_CONFIG_DIR ?? path.posix.join(appHome, 'config', process.env.NODE_ENV);
const secretsDir = process.env.APP_SECRETS_DIR ?? path.posix.join(configDir, 'secrets');

export const APP_PATHS: AppPaths = {
  home: process.env.APP_HOME ?? process.cwd(),
  configDir: configDir,
  configFilePath: path.posix.join(configDir, "config.yaml"),
  secretsDir: secretsDir,
};
