import { LogicError } from '@hexancore/common';
import pathModule from 'path';

export function isModuleExists(name: string): boolean {
  try {
    require.resolve(name);
    return true;
  } catch (error) {
    return false;
  }
}

export class HcAppModuleMeta {
  public constructor(public readonly name: string, public readonly rootPath: string) { }

  public static fromError(e: Error, metaForId: string): HcAppModuleMeta {

    const stack = e.stack ? e.stack.split('\n') : [];
    let foundModuleMeta: HcAppModuleMeta | null = null;
    for (const i in stack) {
      const v = stack[i];
      if (v.indexOf('Domain') !== -1 && v.indexOf('EntityDecorator') === -1) {
        const regex = /\(([^)]+)\)/;
        const match: RegExpMatchArray = regex.exec(v) as any;
        foundModuleMeta = HcAppModuleMeta.fromPath(match[1]);
        break;
      }
    }
    if (!foundModuleMeta) {
      throw new LogicError('Not found module meta of: ' + metaForId);
    }

    return foundModuleMeta;
  }
  public static fromPath(path: string): HcAppModuleMeta {
    path = path.split(pathModule.sep).join(pathModule.posix.sep);
    const extractModuleNameRegex = /src\/([^/]+)/;
    const extractModuleMatch = extractModuleNameRegex.exec(path);
    if (!extractModuleMatch) {
      throw new LogicError('Not found module name in path: ' + path);
    }

    const name = extractModuleMatch[1];
    const modulePathPrefix = name;
    const rootPath = path.substring(0, path.indexOf(modulePathPrefix) + modulePathPrefix.length);

    return new HcAppModuleMeta(name, rootPath);
  }

  public getModulePath(...parts: string[]): string {
    return pathModule.join(this.rootPath, ...parts);
  }

  public getApplicationPath(...parts: string[]): string {
    return this.getModulePath('Application', ...parts);
  }

  public getDomainPath(...parts: string[]): string {
    return this.getModulePath('Domain', ...parts);
  }

  public getInfrastructurePath(...parts: string[]): string {
    return this.getModulePath('Infrastructure', ...parts);
  }
}
