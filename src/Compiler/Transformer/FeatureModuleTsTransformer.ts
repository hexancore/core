import { execFileSync, execSync } from "node:child_process";
import ts from 'typescript';
import { type FeatureApplicationMessageInfo, type FeatureModuleDiscovery } from "../../Util/FeatureModuleDiscoverer";
import { TsTransfromerHelper } from "./TsTransformerHelper";

/**
 * Adding automatic injection of message handlers, services, infra module to `[Feature]Module` source.
 * Less write, more fun !
 */
export class FeatureModuleTsTransformer {
  public constructor(private features: Map<string, FeatureModuleDiscovery>) {
  }

  public static create(sourceRoot: string, compilerDir: string): FeatureModuleTsTransformer {
    const features = this.loadFeaturesMapSync(sourceRoot, compilerDir);
    return new this(features);
  }

  private static loadFeaturesMapSync(sourceRoot: string, compilerDir: string): Map<string, FeatureModuleDiscovery> {
    // TS transformer can't use async, but we need async code and execSync allows run async code :) Hack of day !
    const output = execFileSync('node', [`${compilerDir}/discoverer.js`, sourceRoot]);
    const features = JSON.parse(output.toString());
    return new Map(features);
  }

  public transform(featureName: string, source: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile {
    const feature = this.features.get(featureName);
    if (!feature) {
      throw new Error(`No found feature module info, name: ${featureName}`);
    }

    let imported = false;
    const currentImports = new Set<string>();
    let importMap: Map<string, ts.ImportDeclaration>;

    const visitor: ts.Visitor = (node) => {
      if (ts.isImportDeclaration(node)) {
        currentImports.add(TsTransfromerHelper.extractModuleSpecifierFromImportDeclaration(node));
        return node;
      }

      if (!ts.isImportDeclaration(node) && !imported) {
        imported = true;
        importMap = this.createImportDeclarations(feature, currentImports);
        if (ts.isClassDeclaration(node)) {
          node = ts.visitEachChild(node, (n) => this.transformModuleDecorator(n, feature, importMap, context), context);
        }
        return [...importMap.values(), node];
      }

      if (ts.isClassDeclaration(node)) {
        node = ts.visitEachChild(node, (n) => this.transformModuleDecorator(n, feature, importMap, context), context);
      }

      return node;

    };

    return ts.factory.updateSourceFile(source, ts.visitNodes(
      source.statements,
      visitor,
      (node): node is ts.Statement => ts.isStatement(node))
    );
  }

  private createImportDeclarations(feature: FeatureModuleDiscovery, currentImports: Set<string>) {
    const importMap: Map<string, ts.ImportDeclaration> = new Map();

    this.addMessageHandlerImportDeclarations(feature.application.commands, currentImports, importMap);
    this.addMessageHandlerImportDeclarations(feature.application.queries, currentImports, importMap);
    this.addMessageHandlerImportDeclarations(feature.application.events, currentImports, importMap);
    this.addServiceImportDeclarations(feature, currentImports, importMap);
    this.addInfrastructureModuleImportDeclaration(feature, importMap);

    return importMap;
  }

  private addMessageHandlerImportDeclarations(messages: FeatureApplicationMessageInfo[], currentImports: Set<string>, importMap: Map<string, ts.ImportDeclaration>) {
    for (const m of messages) {
      const importPath = `./${m.path}/${m.handlerClassName}`;
      if (currentImports.has(importPath)) {
        continue;
      }

      importMap.set(m.handlerClassName, this.createImportDeclaration(m.handlerClassName, importPath));
    }
  }

  private addServiceImportDeclarations(feature: FeatureModuleDiscovery, currentImports: Set<string>, importMap: Map<string, ts.ImportDeclaration>): void {
    for (const s of feature.application.services) {
      if (s.isInjectable) {
        const importPath = `./${s.path}`;
        if (currentImports.has(importPath)) {
          continue;
        }

        importMap.set(s.className, this.createImportDeclaration(s.className, importPath));
      }
    }
  }
  private addInfrastructureModuleImportDeclaration(feature: FeatureModuleDiscovery, importMap: Map<string, ts.ImportDeclaration>): void {
    const infrastructureModuleImportDec = this.createImportDeclaration(feature.infrastructure.module.className, `./${feature.infrastructure.module.path}`);
    importMap.set(feature.infrastructure.module.className, infrastructureModuleImportDec);
  }

  private createImportDeclaration(importName: string, importPath: string): ts.ImportDeclaration {
    const namedImports = ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(importName))
    ]);
    const importFrom = ts.factory.createStringLiteral(importPath);
    return ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(false, undefined, namedImports),
      importFrom
    );
  }

  private transformModuleDecorator(
    node: ts.Node,
    feature: FeatureModuleDiscovery,
    importMap: Map<string, ts.ImportDeclaration>,
    context: ts.TransformationContext
  ) {
    return TsTransfromerHelper.transformModuleDecoratorExpression(node, () => {
      const imports = [
        feature.infrastructure.module.className
      ];

      const providers = [
        ...feature.application.commands.map((m) => m.handlerClassName),
        ...feature.application.queries.map((m) => m.handlerClassName),
        ...feature.application.events.map((m) => m.handlerClassName),
        ...feature.application.services.filter((s) => s.isInjectable).map((s) => s.className)
      ];
      const classIdentifierMapper = (className) => TsTransfromerHelper.createNamedImportAccess(importMap.get(className)!, className, context);
      return {
        imports: imports.map(classIdentifierMapper),
        providers: providers.map(classIdentifierMapper),
      };
    });
  }
}