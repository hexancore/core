import { Module } from "@nestjs/common";
import ts from "typescript";

export type ImportFromMapper = (importFrom: string) => string;

export type ImportedIdentifierMapper = (identifier: string) => ts.PropertyAccessChain | ts.Identifier;

export class TsTransfromerHelper {

  private static printer: ts.Printer;

  public static getLastImportIndex(source: ts.SourceFile): number {
    let lastIndex: number = 0;

    for (let i = 0; i < source.statements.length; ++i) {
      if (ts.isImportDeclaration(source.statements[i])) {
        lastIndex = i;
        continue;
      }

      if (ts.isDecorator(source.statements[i])) {
        break;
      }
    }

    return lastIndex;
  }

  public static transformDecoratorCallOfType(
    node: ts.Node,
    decoratorType: (...args) => any,
    updater: (decorator: ts.Decorator, decoratorExpression: ts.CallExpression) => ts.Node
  ): ts.Node {
    if (ts.isDecorator(node)) {
      const decoratorExpression = node.expression;
      if (ts.isCallExpression(decoratorExpression) && ts.isIdentifier(decoratorExpression.expression)) {
        if (decoratorExpression.expression.text === decoratorType.name) {
          return updater(node, decoratorExpression);
        }
      }
    }

    return node;
  }

  public static transformModuleDecoratorExpression(node: ts.Node, moduleMetaProvider: () => ({
    providers?: any[],
    imports?: ts.Expression[],
    exports?: any[],
  })): ts.Node {
    return TsTransfromerHelper.transformDecoratorCallOfType(node, Module, (decorator, decoratorExpression) => {
      const decoratorArguments = decoratorExpression.arguments;
      if (decoratorArguments.length > 0 && ts.isObjectLiteralExpression(decoratorArguments[0])) {
        const moduleMetaExpression = decoratorArguments[0];

        const assignedProps: string[] = [];
        const moduleMeta = moduleMetaProvider();
        const newProperties = moduleMetaExpression.properties.map(prop => {
          return TsTransfromerHelper.updatePropertyArrayAssigment(prop, (name: string) => {
            if (moduleMeta[name]) {
              assignedProps.push(name);
              return moduleMeta[name];
            }
            return null;
          });
        });

        for (const p in moduleMeta) {
          if (!assignedProps.includes(p)) {
            newProperties.push(ts.factory.createPropertyAssignment(p, ts.factory.createArrayLiteralExpression(moduleMeta[p])));
          }
        }
        const updatedModuleMetaExpression = ts.factory.updateObjectLiteralExpression(moduleMetaExpression, newProperties);
        const updatedDecoratorExpression = ts.factory.updateCallExpression(
          decoratorExpression,
          decoratorExpression.expression,
          decoratorExpression.typeArguments,
          [updatedModuleMetaExpression]
        );
        return ts.factory.updateDecorator(decorator, updatedDecoratorExpression);
      }

      return node;
    });
  }

  public static updatePropertyArrayAssigment(prop: ts.ObjectLiteralElementLike, newElementsProvider: (name: string) => ts.Expression[] | null): ts.ObjectLiteralElementLike {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      const newElements = newElementsProvider(prop.name.text);
      if (newElements) {
        if (ts.isArrayLiteralExpression(prop.initializer)) {
          const elements = [...prop.initializer.elements, ...newElements];
          return ts.factory.updatePropertyAssignment(prop, prop.name, ts.factory.updateArrayLiteralExpression(prop.initializer, elements));
        }
      }
    }

    return prop;
  }

  public static extractModuleSpecifierFromImportDeclaration(node: ts.ImportDeclaration): string {
    return (node.moduleSpecifier as ts.StringLiteral).text;
  }

  public static createNamedImportAccess(importDec: ts.ImportDeclaration, name: string, context: ts.TransformationContext): ts.PropertyAccessChain | ts.Identifier {
    const opts = context.getCompilerOptions();
    if (opts.module === ts.ModuleKind.Node16 || opts.module === ts.ModuleKind.CommonJS) {
      return ts.factory.createPropertyAccessChain(ts.factory.getGeneratedNameForNode(importDec), undefined, name);
    }

    return ts.factory.createIdentifier(name);

  }

  public static createImportDeclaration(importName: string | string[], importPath: string): ts.ImportDeclaration {
    importName = Array.isArray(importName) ? importName : [importName];

    const namedImports = ts.factory.createNamedImports(importName.map(n =>
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(n)))
    );

    const importFrom = ts.factory.createStringLiteral(importPath);

    return ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(false, undefined, namedImports),
      importFrom
    );
  }

  public static createConstStatement(name: string, initializer: ts.Expression, type?: ts.TypeNode): ts.VariableStatement {
    return ts.factory.createVariableStatement([], ts.factory.createVariableDeclarationList(
      [ts.factory.createVariableDeclaration(name, undefined, type, initializer)],
      ts.NodeFlags.Const,
    ));
  }

  public static createImportFromMapper(sourceRoot: string): ImportFromMapper {
    const isInternalCoreTesting = sourceRoot.includes("/test/helper/libs");
    return isInternalCoreTesting ? (importFrom: string) => {
      return importFrom.replace('@hexancore/core', '@');//FsHelper.normalizePathSep(process.cwd() + "/lib/index.js"));
    } : (importFrom: string) => importFrom;
  }

  public static printFile(source: ts.SourceFile): string {
    if (!this.printer) {
      this.printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        removeComments: false,
        omitTrailingSemicolon: true,
      });
    }

    return this.printer.printFile(source);
  }
}