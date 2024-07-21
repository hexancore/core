import ts from "typescript";
import { TsTransfromerHelper, type ImportedIdentifierMapper, type ImportFromMapper } from "./TsTransformerHelper";

export type ImportDeclarationMap = Map<string, ts.ImportDeclaration>;

export interface AddImportTransformDef {
  name: string;
  importModuleSpecifier: string;
}

export interface ImportModuleMetaTransformDef {
  name: string;
  importModuleSpecifier: string;
  addToExports: boolean;
}

export interface ProviderModuleMetaTransformDef {
  name: string;
  importFrom: string;
  expression?: ts.Expression;
  addToExports: boolean;
}

export interface CreateImportDeclarationsOutput {
  declarations: ImportDeclarationMap;
  newDefImports: ImportModuleMetaTransformDef[];
  newDefProviders: ProviderModuleMetaTransformDef[];
  providerStatements: ts.VariableStatement[];
  extraMetaProvider?: ts.Identifier;
}

export interface ModuleClassTsTransformOptions {
  imports?: AddImportTransformDef[],
  meta?: {
    imports: ImportModuleMetaTransformDef[];
    providers: ProviderModuleMetaTransformDef[];
  };
  extraStatementProvider?(importedIdentifierMapper: ImportedIdentifierMapper): ts.Statement[];
  extraMetaProvider?(): ts.Identifier;
  source: ts.SourceFile;
  context: ts.TransformationContext;
}

export class ModuleClassTsTransformer {

  protected importedIdentifierMapper: (importDec: ts.ImportDeclaration, name: string, context: ts.TransformationContext) => ts.PropertyAccessChain | ts.Identifier;

  public constructor(protected importFromMapper: ImportFromMapper, protected needFixImportAccess: boolean) {
    this.importedIdentifierMapper = this.needFixImportAccess ? (importDec, name, context) =>
      TsTransfromerHelper.createNamedImportAccess(importDec, name, context)
      : (_importDec, name, _context) => ts.factory.createIdentifier(name);

  }

  public transform(options: ModuleClassTsTransformOptions): ts.SourceFile {
    let imported = false;
    const currentImports = new Set<string>();
    let importDeclarations: CreateImportDeclarationsOutput;

    const visitor: ts.Visitor = (node) => {
      if (ts.isImportDeclaration(node)) {
        currentImports.add(TsTransfromerHelper.extractModuleSpecifierFromImportDeclaration(node));
        return node;
      }

      if (!imported) {
        imported = true;
        importDeclarations = this.createImportDeclarations(options, currentImports);

        if (ts.isClassDeclaration(node)) {
          node = ts.visitEachChild(node, (childNode) => this.transformModuleDecorator(childNode, importDeclarations, options.context), options.context);
        }
        const importedIdentifierMapper = (className: string) =>
          this.importedIdentifierMapper(importDeclarations.declarations.get(className)!, className, options.context);

        let extraStatements: ts.Statement[] = [];
        if (options.extraStatementProvider) {
          extraStatements = options.extraStatementProvider(importedIdentifierMapper);
        }

        return [...importDeclarations.declarations.values(), ...extraStatements, ...importDeclarations.providerStatements, node];
      }

      if (ts.isClassDeclaration(node)) {
        node = ts.visitEachChild(node, (childNode) => this.transformModuleDecorator(childNode, importDeclarations, options.context), options.context);
      }

      return node;

    };

    return ts.factory.updateSourceFile(options.source, ts.visitNodes(
      options.source.statements,
      visitor,
      (node): node is ts.Statement => ts.isStatement(node))
    );
  }

  private createImportDeclarations(options: ModuleClassTsTransformOptions, currentImports: Set<string>): CreateImportDeclarationsOutput {

    const declarations: ImportDeclarationMap = new Map();
    const newMetaImports: ImportModuleMetaTransformDef[] = [];
    const newMetaProviders: ProviderModuleMetaTransformDef[] = [];
    const providerStatements: ts.VariableStatement[] = [];

    if (options.imports) {
      for (const i of options.imports) {
        const importModuleSpecifier = this.importFromMapper(i.importModuleSpecifier);
        if (currentImports.has(importModuleSpecifier)) {
          continue;
        }

        declarations.set(i.name, TsTransfromerHelper.createImportDeclaration(i.name, importModuleSpecifier));
      }

    }

    if (options.meta) {
      for (const d of options.meta.imports) {
        const importModuleSpecifier = this.importFromMapper(d.importModuleSpecifier);
        if (currentImports.has(importModuleSpecifier)) {
          continue;
        }

        declarations.set(d.name, TsTransfromerHelper.createImportDeclaration(d.name, importModuleSpecifier));
        newMetaImports.push(d);
      }

      for (const d of options.meta.providers) {
        const importModuleSpecifier = this.importFromMapper(d.importFrom);
        if (currentImports.has(importModuleSpecifier)) {
          continue;
        }

        declarations.set(d.name, TsTransfromerHelper.createImportDeclaration(d.name, importModuleSpecifier));
        newMetaProviders.push(d);
        if (d.expression) {
          providerStatements.push(this.createProviderDeclarationStatement(d));
        }
      }
    }

    return {
      declarations,
      providerStatements,
      newDefImports: newMetaImports,
      newDefProviders: newMetaProviders,
      extraMetaProvider: options.extraMetaProvider ? options.extraMetaProvider() : undefined
    };
  }

  private transformModuleDecorator(
    node: ts.Node,
    importDeclarations: CreateImportDeclarationsOutput,
    context: ts.TransformationContext
  ) {
    return TsTransfromerHelper.transformModuleDecoratorExpression(node, () => {
      const imports = importDeclarations.newDefImports.map((i) => i.name);

      const classIdentifierMapper = (className: string) =>
        this.importedIdentifierMapper(importDeclarations.declarations.get(className)!, className, context);

      const providers: any[] = importDeclarations.newDefProviders.map(p => p.name).map(classIdentifierMapper);
      const exports: any[] = importDeclarations.newDefProviders.filter((p) => p.addToExports).map(p => p.name).map(classIdentifierMapper);

      if (importDeclarations.extraMetaProvider) {
        providers.push(this.getArrayPropertyAsSpread(importDeclarations.extraMetaProvider, 'providers'));
        exports.push(this.getArrayPropertyAsSpread(importDeclarations.extraMetaProvider, 'exports'));
      }
      return {
        imports: imports.map(classIdentifierMapper),
        providers,
        exports
      };
    });
  }

  private createProviderDeclarationStatement(def: ProviderModuleMetaTransformDef): ts.VariableStatement {
    const varName = def.name + "Provider";
    return TsTransfromerHelper.createConstStatement(varName, def.expression!);
  }

  private getArrayPropertyAsSpread(identifier: ts.Identifier, property: string) {
    return ts.factory.createSpreadElement(
      ts.factory.createPropertyAccessChain(identifier, undefined, property));
  }
}