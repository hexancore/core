
import ts from "typescript";
import type { HObjectPropertyTsMeta } from "./HObjectPropertyTsMeta";

import type { ImportDeclarationWrapper } from "../../Helper/ImportDeclarationWrapper";
import { TsTransfromerHelper } from "../../TsTransformerHelper";
import { HObjectPropertyParseTsFactory } from "./HObjectPropertyParseTsFactory";
import { HObjectKind, type FeatureHObjectMeta } from "@/Util/Feature/Meta";

const HOBJECT_ANY_TYPE_MAP = {
  [HObjectKind.Command]: {
    anyTypeName: "AnyHCommand",
    typeName: "HCommandType"
  },
  [HObjectKind.Query]: {
    anyTypeName: "AnyHQuery",
    typeName: "HQueryType"
  },
  [HObjectKind.Event]: {
    anyTypeName: "AnyHEvent",
    typeName: "HEventType"
  },
  [HObjectKind.Dto]: {
    anyTypeName: "AnyDto",
    typeName: "HDtoType"
  },
  [HObjectKind.ValueObject]: {
    anyTypeName: "AnyValueObject",
    typeName: "HValueObjectType"
  },
  [HObjectKind.Entity]: {
    anyTypeName: "AnyEntity",
    typeName: "HEntityType"
  },
  [HObjectKind.AggregateRoot]: {
    anyTypeName: "AnyAggregateRoot",
    typeName: "HAggregateRootType"
  }
};

export class HObjectParseTsFactory {
  private propertyTsFactory: HObjectPropertyParseTsFactory;

  public constructor() {
    this.propertyTsFactory = new HObjectPropertyParseTsFactory();
  }

  //`public static parse<T extends AnyDto>(this: DtoType<T>, plain: unknown): R<T, PlainParseError>`
  public create(meta: FeatureHObjectMeta, hObjectClassName: string, properties: HObjectPropertyTsMeta[], hCommonImportDecl: ImportDeclarationWrapper): ts.MethodDeclaration {
    const returnType = ts.factory.createTypeReferenceNode(
      hCommonImportDecl.getEntityName('R'), [ts.factory.createTypeReferenceNode(hObjectClassName, [])]
    );

    const typeInfo = HOBJECT_ANY_TYPE_MAP[meta.kind];

    const parameters = [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier('this'),
        undefined,
        ts.factory.createTypeReferenceNode(typeInfo.typeName, [ts.factory.createTypeReferenceNode("T")])
      ),
      ts.factory.createParameterDeclaration(undefined, undefined, 'plain', undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword))
    ];

    const genericT = ts.factory.createTypeParameterDeclaration(
      undefined,
      ts.factory.createIdentifier("T"),
      ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(typeInfo.anyTypeName), undefined)
    );

    return ts.factory.createMethodDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword), ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)],
      undefined, // *
      'parse',
      undefined, // '?'
      [genericT],
      parameters,
      returnType,
      ts.factory.createBlock(this.createBody(hObjectClassName, properties, hCommonImportDecl), true)
    );
  }

  private createBody(hObjectClassName: string, properties: HObjectPropertyTsMeta[], hCommonImportDecl: ImportDeclarationWrapper): ts.Statement[] {
    properties = [...properties.filter(p => !p.optional), ...properties.filter(p => p.optional)];

    const statements: ts.Statement[] = [
      this.createCheckIsObject(hObjectClassName, hCommonImportDecl),
      this.createPlainObjVarDeclaration(hObjectClassName),
      this.createIssuesVarDeclaration(),
    ];

    const propNames: string[] = [];
    for (const p of properties) {
      statements.push(...this.propertyTsFactory.create(p, hCommonImportDecl));
      propNames.push(p.name);
    }

    statements.push(this.createCheckAnyIssues(hObjectClassName, hCommonImportDecl));
    statements.push(this.createReturnNew(hObjectClassName, hCommonImportDecl, propNames));

    return statements;
  }

  /**
    `
      if (typeof plain !== 'object') {
      return PlainParseHelper.HObjectIsNotObjectParseErr(hObjectClassName as any, plain]);
      }
    `
  */
  private createCheckIsObject(hObjectClassName: string, hCommonImportDecl: ImportDeclarationWrapper): ts.Statement {
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
            hCommonImportDecl.get('PlainParseHelper'),
            'HObjectIsNotObjectParseErr'
          ),
          undefined,
          [
            this.createAsAny(hObjectClassName),
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

  private createCheckAnyIssues(hObjectClassName: string, hCommonImportDecl: ImportDeclarationWrapper): ts.Statement {
    return ts.factory.createIfStatement(
      ts.factory.createBinaryExpression(
        ts.factory.createPropertyAccessExpression(
          this.issuesVarIdentifier(),
          ts.factory.createIdentifier('length')
        ),
        ts.factory.createToken(ts.SyntaxKind.GreaterThanToken),
        ts.factory.createNumericLiteral('0')
      ),
      ts.factory.createBlock(
        [
          ts.factory.createReturnStatement(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                hCommonImportDecl.get('PlainParseHelper'),
                ts.factory.createIdentifier('HObjectParseErr')
              ),
              undefined,
              [
                this.createAsAny(hObjectClassName),
                this.issuesVarIdentifier(),
              ]
            )
          )
        ],
        true
      ),
      undefined
    );
  }

  private createReturnNew(hObjectClassName: string, hCommonImportDecl: ImportDeclarationWrapper, propNames: string[]) {
    return ts.factory.createReturnStatement(
      ts.factory.createAsExpression(
        ts.factory.createCallExpression(
          hCommonImportDecl.get("OK"),
          undefined,
          [
            ts.factory.createNewExpression(
              hCommonImportDecl.get(hObjectClassName),
              undefined,
              propNames.map((name) => this.createAsAny(name))
            )
          ]
        ),
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      )
    );
  }

  private issuesVarIdentifier(): ts.Identifier {
    return ts.factory.createIdentifier("issues");
  }

  private createAsAny(name: string): ts.Expression {
    return ts.factory.createAsExpression(
      ts.factory.createIdentifier(name),
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    );
  }

}