import ts from "typescript";
import { CollectionType, HObjectPropertyTsMeta, HObjectPropertyPrimitiveType, type PrimitiveHObjectPropertyTsMeta } from "./HObjectPropertyTsMeta";
import type { ImportDeclarationWrapper } from "../../Helper/ImportDeclarationWrapper";

export class HObjectToJSONTsFactory {

  public create(hObjectClassName: string, properties: HObjectPropertyTsMeta[], hCommonImportDecl: ImportDeclarationWrapper): ts.MethodDeclaration {
    const returnType = ts.factory.createTypeReferenceNode(
      hCommonImportDecl.getEntityName('JsonObjectType'), [ts.factory.createTypeReferenceNode(hObjectClassName, [])]
    );

    return ts.factory.createMethodDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
      undefined, // *
      'toJSON',
      undefined, // '?'
      undefined, // generic
      [],
      returnType,
      ts.factory.createBlock(this.createBody(properties), true)
    );
  }

  private createBody(properties: HObjectPropertyTsMeta[]): ts.Statement[] {
    const props: ts.ObjectLiteralElementLike[] = [];
    for (const p of properties) {
      const initializer = p.isPrimitive() ? this.createPrimitivePropInitializer(p) : this.createHObjectPropInitializer(p);
      props.push(ts.factory.createPropertyAssignment(p.name, initializer));
    }

    return [
      ts.factory.createReturnStatement(ts.factory.createObjectLiteralExpression(props, true))
    ];
  }

  private createPrimitivePropInitializer(p: PrimitiveHObjectPropertyTsMeta): ts.Expression {
    if (p.tsType === HObjectPropertyPrimitiveType.bigint) {
      if (p.collectionType === CollectionType.Array) {
        return this.createMethodOfPropCall(
          ts.factory.createThis(), p.name, 'map',
          this.createArrayMapCallArgs(this.createMethodCall('item', 'toString', []),),
          p.optional
        );
      }
      return this.createMethodOfPropCall(ts.factory.createThis(), p.name, 'toString', [], p.optional);
    }

    return ts.factory.createPropertyAccessExpression(ts.factory.createThis(), ts.factory.createIdentifier(p.name));
  }

  private createHObjectPropInitializer(p: HObjectPropertyTsMeta): ts.Expression {
    if (p.collectionType === CollectionType.Array) {
      return this.createMethodOfPropCall(
        ts.factory.createThis(), p.name, 'map',
        this.createArrayMapCallArgs(this.createMethodCall('item', 'toJSON', [])),
        p.optional
      );
    }

    return this.createMethodOfPropCall(ts.factory.createThis(), p.name, 'toJSON', [], p.optional);
  }

  private createArrayMapCallArgs(body: ts.ConciseBody, itemVarName = 'item') {
    return [
      ts.factory.createArrowFunction(
        undefined,
        undefined,
        [ts.factory.createParameterDeclaration(undefined, undefined, ts.factory.createIdentifier(itemVarName))],
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        body
      )
    ];
  }

  private createMethodOfPropCall(objExp: ts.Expression, prop: string, method: string, args: ts.Expression[], optional: boolean): ts.CallExpression {
    const questionDot = optional ? ts.factory.createToken(ts.SyntaxKind.QuestionDotToken) : undefined;
    const objPropMethodAccess = ts.factory.createPropertyAccessChain(
      ts.factory.createPropertyAccessExpression(objExp, prop),
      questionDot,
      method
    );
    return ts.factory.createCallChain(objPropMethodAccess, undefined, undefined, args);
  }

  private createMethodCall(varName: string, method: string, args: ts.Expression[]): ts.CallExpression {
    return ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(varName), method),
      undefined,
      args,
    );
  }

}