import { Module } from "@nestjs/common";
import ts, { type TransformationContext } from "typescript";

export class TsTransfromerHelper {

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
    providers?: ts.Expression[],
    imports?: ts.Expression[],
    exports?: ts.Expression[],
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

  public static createNamedImportAccess(importDec: ts.ImportDeclaration, name: string, context: TransformationContext): ts.PropertyAccessChain | ts.Identifier {
    const opts = context.getCompilerOptions();

    if (opts.module === ts.ModuleKind.Node16) {
      return ts.factory.createPropertyAccessChain(ts.factory.getGeneratedNameForNode(importDec), undefined, name);
    }

    return ts.factory.createIdentifier(name);

  }

}