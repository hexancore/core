
import ts from "typescript";
import type { HObjectPropertyTsMeta } from "./HObjectPropertyTsMeta";

import type { ImportDeclarationWrapper } from "../../Helper/ImportDeclarationWrapper";
import { TsTransfromerHelper } from "../../TsTransformerHelper";
import { HObjectPropertyParseTsFactory } from "./HObjectPropertyParseTsFactory";

export class HObjectParseTsFactory {

  private propertyTsFactory: HObjectPropertyParseTsFactory;

  public constructor() {
    this.propertyTsFactory = new HObjectPropertyParseTsFactory();
  }

  public create(hObjectClassName: string, properties: HObjectPropertyTsMeta[], hCommonImportDecl: ImportDeclarationWrapper): ts.MethodDeclaration {
    const returnType = ts.factory.createTypeReferenceNode(
      hCommonImportDecl.getEntityName('R'), [ts.factory.createTypeReferenceNode(hObjectClassName, [])]
    );

    const parameters = [
      ts.factory.createParameterDeclaration(undefined, undefined, 'plain', undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword))
    ];

    return ts.factory.createMethodDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword), ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)],
      undefined, // *
      'parse',
      undefined, // '?'
      undefined, // generic
      parameters,
      returnType,
      ts.factory.createBlock(this.createBody(hObjectClassName, properties), true)
    );
  }

  private createBody(hObjectClassName: string, properties: HObjectPropertyTsMeta[]): ts.Statement[] {

    const statements: ts.Statement[] = [
      this.createCheckIsObject(hObjectClassName),
      this.createPlainObjVarDeclaration(hObjectClassName),
      this.createIssuesVarDeclaration(),
    ];

    for (const p of properties) {
      statements.push(...this.propertyTsFactory.create(p));
    }

    return statements;
  }

  /**
    `
      if (typeof plain !== 'object') {
      return PlainParseHelper.HObjectIsNotObjectParseErr(hObjectClassName as any, plain]);
      }
    `
  */
  private createCheckIsObject(hObjectClassName: string): ts.Statement {
    // `typeof plain !== 'object'`
    const condtionExpression = ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(ts.factory.createIdentifier('plain')),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral('object')
    );

    const block = ts.factory.createBlock([
      ts.factory.createReturnStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('PlainParseHelper'),
            'HObjectIsNotObjectParseErr'
          ),
          undefined,
          [
            ts.factory.createAsExpression(
              ts.factory.createIdentifier(hObjectClassName),
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            ),
            ts.factory.createIdentifier('plain')
          ]
        )
      )
    ], true);

    return ts.factory.createIfStatement(condtionExpression, block);
  }

  // `const p = plain as Record<keyof TestDto, unknown>;`
  private createPlainObjVarDeclaration(hObjectClassName: string): ts.Statement {
    const initializer = ts.factory.createAsExpression(
      ts.factory.createIdentifier('plain'),
      ts.factory.createTypeReferenceNode(
        ts.factory.createIdentifier('Record'),
        [
          ts.factory.createTypeOperatorNode(ts.SyntaxKind.KeyOfKeyword, ts.factory.createTypeReferenceNode(hObjectClassName, undefined)),
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
        ]
      )
    );
    return TsTransfromerHelper.createConstStatement("p", undefined, initializer);
  }

  // `const issues: PlainParseIssue[] = [];`
  private createIssuesVarDeclaration() {
    const type = ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode('PlainParseIssue', undefined));
    const initializer = ts.factory.createArrayLiteralExpression([], false);
    return TsTransfromerHelper.createConstStatement("issues", type, initializer);

  }
}