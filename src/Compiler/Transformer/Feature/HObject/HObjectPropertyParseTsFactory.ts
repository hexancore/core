import ts from "typescript";
import { CollectionType, HObjectPropertyPrimitiveType, HObjectPropertyTsMeta } from "./HObjectPropertyTsMeta";
import { TsTransfromerHelper } from "../../TsTransformerHelper";

export class HObjectPropertyParseTsFactory {
  public create(meta: HObjectPropertyTsMeta): ts.Statement[] {
    if (meta.isPrimitive()) {
      switch (meta.tsType) {
        case HObjectPropertyPrimitiveType.string: return this.createStringParse(meta);
      }
    } else {
      // TODO HObject parse create
      return [];
    }

    return [];
    //throw new LogicError('Unspported property meta in parse(), meta: ' + meta);

  }

  private createStringParse(meta: HObjectPropertyTsMeta): ts.Statement[] {
    /*
    let initializer;
    if (meta.validationRules) {
      if (meta.validationRules[0].isStringLengthRule()) {
        switch (meta.validationRules[0].extraRuleParts.join('.')) {
          case "length":
            initializer = this.createPrimitivePropertyParseCode(meta, "parseStringLength", {
              scalar: meta.validationRules[0].args[0],
            });
          break;
          case "length.min":
            initializer =
          break;
          case "length.max":
            initializer =
          break;
        }
      }
    } else {
      initializer = this.createPrimitivePropertyParseCode(meta, "parseString");
    }* */

    const initializer = this.createPrimitivePropertyParseCode(meta, "parseString");
    return meta.optional
      ? this.createOptionalPropertyParse(meta, initializer)
      : [TsTransfromerHelper.createConstStatement(meta.name, undefined, initializer)];
  }

  private createPrimitivePropertyParseCode(meta: HObjectPropertyTsMeta, helperMethod: string): ts.Expression {
    if (meta.collectionType === CollectionType.Array) {
      return this.createParsePrimitiveArray(meta, helperMethod);
    } else {
      return this.createPlainParseHelperCall(meta, helperMethod);
    }
  }

  private createOptionalPropertyParse(meta: HObjectPropertyTsMeta, initializer: ts.Expression): ts.Statement[] {
    const letPropertyVar = TsTransfromerHelper.createLetStatement(meta.name);
    // `p.propName === undefined`
    const ifCondition = ts.factory.createBinaryExpression(
      this.createPlainObjPropertyAccess(meta),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createIdentifier('undefined')
    );

    const optionalPropertyIf = ts.factory.createIfStatement(
      ifCondition,
      ts.factory.createBlock([this.createAssignInitializerToLetVar(meta, initializer)], true)
    );
    return [letPropertyVar, optionalPropertyIf];
  }

  private createAssignInitializerToLetVar(meta: HObjectPropertyTsMeta, initializer: ts.Expression): ts.Statement {
    return ts.factory.createExpressionStatement(
      ts.factory.createBinaryExpression(
        ts.factory.createIdentifier(meta.name),
        ts.factory.createToken(ts.SyntaxKind.EqualsToken),
        initializer,
      )
    );
  }

  private createParsePrimitiveArray(meta: HObjectPropertyTsMeta, parse: ts.Expression | string) {
    parse = typeof parse === 'string' ? this.createPlainParseHelperPropertyAccess(parse) : parse;
    return this.createPlainParseHelperCall(meta, "parsePrimitiveArray", [parse]);
  }

  private createPlainParseHelperCall(meta: HObjectPropertyTsMeta, method: string, args: ts.Expression[] = []) {
    return ts.factory.createCallExpression(
      this.createPlainParseHelperPropertyAccess(method),
      undefined,
      [
        this.createPlainObjPropertyAccess(meta),
        ...args,
        ts.factory.createStringLiteral(meta.name),
        ts.factory.createIdentifier('issues')
      ]
    );
  }

  private createPlainParseHelperPropertyAccess(name: string): ts.PropertyAccessExpression {
    return ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier("PlainParseHelper"),
      ts.factory.createIdentifier(name)
    );
  }

  private createPlainObjPropertyAccess(meta: HObjectPropertyTsMeta): ts.PropertyAccessExpression {
    return ts.factory.createPropertyAccessExpression(
      this.createPlainObjIdentifier(),
      ts.factory.createIdentifier(meta.name)
    );
  }

  private createPlainObjIdentifier(): ts.Identifier {
    return ts.factory.createIdentifier("p");
  }



}