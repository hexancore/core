import ts from "typescript";
import type { HObjectPropertyTsMeta } from "./HObjectPropertyTsMeta";

export class HObjectToConstructorTsFactory {
  public create(properties: HObjectPropertyTsMeta[]): ts.ConstructorDeclaration {

    const callSuper = ts.factory.createExpressionStatement(ts.factory.createCallExpression(ts.factory.createSuper(), undefined, undefined));

    const propertiesSorted = [...properties.filter(p => !p.optional), ...properties.filter(p => p.optional)];
    const constructorParameters = propertiesSorted.map(p => this.createParameter(p));
    const constructorAssignments = propertiesSorted.map(p => this.createAssignment(p));

    return ts.factory.createConstructorDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
      constructorParameters,
      ts.factory.createBlock([callSuper, ...constructorAssignments], true)
    );
  }

  private createParameter(p: HObjectPropertyTsMeta): ts.ParameterDeclaration {
    return ts.factory.createParameterDeclaration(
      undefined,
      undefined,
      ts.factory.createIdentifier(p.name),
      p.optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
      undefined
    );
  }

  private createAssignment(p: HObjectPropertyTsMeta): ts.Statement {
    return ts.factory.createExpressionStatement(
      ts.factory.createBinaryExpression(
        ts.factory.createPropertyAccessExpression(ts.factory.createThis(), p.name),
        ts.factory.createToken(ts.SyntaxKind.EqualsToken),
        ts.factory.createIdentifier(p.name)
      )
    );
  }
}