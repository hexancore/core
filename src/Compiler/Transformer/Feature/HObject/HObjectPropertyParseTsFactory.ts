import {
  LogicError,
  PlainParseHelper,
  IntegerPlainParseHelper,
  ArrayPlainParseHelper,
  NumberPlainParseHelper,
  StringPlainParseHelper,
} from "@hexancore/common";
import ts from "typescript";
import type { ImportDeclarationWrapper } from "../../Helper/ImportDeclarationWrapper";
import { TsTransfromerHelper } from "../../TsTransformerHelper";
import {
  CollectionType,
  HObjectPropertyPrimitiveType,
  HObjectPropertyTsMeta,
  type ObjectHObjectPropertyTsMeta,
  type PrimitiveHObjectPropertyTsMeta
} from "./HObjectPropertyTsMeta";

interface PlainParseHelperMethodCallContext {
  meta: HObjectPropertyTsMeta;
  helper: new () => any;
  method: string;
  args: ts.Expression[];
  hCommonImportDecl: ImportDeclarationWrapper;
}

export class HObjectPropertyParseTsFactory {
  public create(meta: HObjectPropertyTsMeta, hCommonImportDecl: ImportDeclarationWrapper): ts.Statement[] {
    const initializer = meta.isPrimitive()
      ? this.createPrimitivePropInitializer(meta, hCommonImportDecl)
      : this.createHObjectPropParse(meta as ObjectHObjectPropertyTsMeta, hCommonImportDecl);

    return meta.optional
      ? this.createOptionalPropertyParse(meta, initializer)
      : [TsTransfromerHelper.createConstStatement(meta.name, undefined, initializer)];
  }

  private createPrimitivePropInitializer(meta: PrimitiveHObjectPropertyTsMeta, hCommonImportDecl: ImportDeclarationWrapper): ts.Expression {
    switch (meta.tsType) {
      case HObjectPropertyPrimitiveType.string:
        return this.createStringPropParseInitializer(meta, hCommonImportDecl);
      case HObjectPropertyPrimitiveType.boolean:
        return this.createPrimitivePropParse({
          meta,
          helper: PlainParseHelper,
          method: "parseBoolean",
          args: [],
          hCommonImportDecl
        });
      case HObjectPropertyPrimitiveType.number:
        return this.createNumberPropParseInitializer(meta, hCommonImportDecl);
      case HObjectPropertyPrimitiveType.bigint:
        return this.createPrimitivePropParse({
          meta,
          helper: PlainParseHelper,
          method: "parseBigInt64",
          args: [],
          hCommonImportDecl
        });
    }

    throw new LogicError('Unspported property meta in parse(), meta: ' + meta);
  }

  private createStringPropParseInitializer(meta: HObjectPropertyTsMeta, hCommonImportDecl: ImportDeclarationWrapper): ts.Expression {
    if (meta.validationRules && !meta.validationRules[0].isCollectionItemsRule()) {
      let method: string;
      let args: ts.Expression[];
      const rule = meta.validationRules[0];
      switch (rule.rule) {
        case "string.length":
          method = "parseStringLength";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "string.length.min":
          method = "parseStringLengthMin";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "string.length.max":
          method = "parseStringLengthMax";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "string.length.between":
          method = "parseStringLengthBetween";
          args = [this.createNumericLiteral(rule.args[0]), this.createNumericLiteral(rule.args[1])];
          break;
        case "string.regex":
          method = "parseStringRegex";
          // eslint-disable-next-line no-case-declarations
          const pattern = rule.args[0].replace(/\\\\/g, '\\');
          // eslint-disable-next-line no-case-declarations
          const flags = rule.args.length === 2 ? rule.args[1] : '';
          // eslint-disable-next-line no-case-declarations
          const regex = `/${pattern}/${flags}`;

          args = [ts.factory.createRegularExpressionLiteral(regex)];
          break;
        default:
          throw new LogicError("Unsupported property validation rule in parse(), meta: " + meta);
      }

      return this.createPrimitivePropParse({
        meta,
        helper: StringPlainParseHelper,
        method,
        args,
        hCommonImportDecl,
      });
    }

    return this.createPrimitivePropParse({
      meta,
      helper: StringPlainParseHelper,
      method: "parseString",
      args: [],
      hCommonImportDecl,
    });
  }

  private createNumberPropParseInitializer(meta: PrimitiveHObjectPropertyTsMeta, hCommonImportDecl: ImportDeclarationWrapper): ts.Expression {
    if (meta.validationRules && !meta.validationRules[0].isCollectionItemsRule()) {
      let method: string;
      let args: ts.Expression[];
      const rule = meta.validationRules[0];
      switch (rule.rule) {
        case "int":
          method = "parseInt";
          args = [];
          break;

        case "int.min":
          method = "parseIntGTE";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "int.max":
          method = "parseIntLTE";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "int.between":
          method = "parseIntBetween";
          args = [this.createNumericLiteral(rule.args[0]), this.createNumericLiteral(rule.args[1])];
          break;

        case "int.gt":
          method = "parseIntGT";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "int.lt":
          method = "parseIntLT";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "int.between_exclusively":
          method = "parseIntBetweenExclusively";
          args = [this.createNumericLiteral(rule.args[0]), this.createNumericLiteral(rule.args[1])];
          break;

        case "uint":
          method = "parseUInt";
          args = [];
          break;
        case "uint.min":
          method = "parseUIntGTE";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "uint.max":
          method = "parseUIntLTE";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "uint.between":
          method = "parseUIntBetween";
          args = [this.createNumericLiteral(rule.args[0]), this.createNumericLiteral(rule.args[1])];
          break;

        case "uint.gt":
          method = "parseUIntGT";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "uint.lt":
          method = "parseUIntLT";
          args = [this.createNumericLiteral(rule.args[0])];
          break;
        case "uint.between_exclusively":
          method = "parseUIntBetweenExclusively";
          args = [this.createNumericLiteral(rule.args[0]), this.createNumericLiteral(rule.args[1])];
          break;

        default:
          throw new LogicError("Unsupported property validation rule in parse(), meta: " + meta);
      }

      return this.createPrimitivePropParse({
        meta,
        helper: IntegerPlainParseHelper,
        method,
        args,
        hCommonImportDecl,
      });
    }

    return this.createPrimitivePropParse({
      meta,
      helper: NumberPlainParseHelper,
      method: "parseNumber",
      args: [],
      hCommonImportDecl,
    });
  }

  private createPrimitivePropParse(c: PlainParseHelperMethodCallContext): ts.Expression {
    const meta = c.meta;
    if (meta.collectionType === CollectionType.Array) {
      const parseFn = ts.factory.createArrowFunction(undefined, undefined,
        [ts.factory.createParameterDeclaration(undefined, undefined, "pi")],
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        this.createPlainParseHelperCall({
          meta: c.meta,
          helper: c.helper,
          method: c.method,
          args: [ts.factory.createIdentifier("pi"), ...c.args],
          hCommonImportDecl: c.hCommonImportDecl
        }, false));

      return this.createParsePrimitiveArray(c.meta, parseFn, c.hCommonImportDecl);
    }

    return this.createPlainParseHelperCall({
      meta: c.meta,
      helper: c.helper,
      method: c.method,
      args: [this.createPlainObjPropertyAccess(c.meta), ...c.args],
      hCommonImportDecl: c.hCommonImportDecl
    });
  }

  private createHObjectPropParse(meta: ObjectHObjectPropertyTsMeta, hCommonImportDecl: ImportDeclarationWrapper): ts.Expression {
    if (meta.collectionType === CollectionType.Array) {
      return this.createHObjectArrayPropParse(meta, hCommonImportDecl);
    }

    return this.createPlainParseHelperCall({
      meta,
      helper: PlainParseHelper,
      method: "parseHObject",
      args: [this.createPlainObjPropertyAccess(meta), meta.createTypeIdentifier()],
      hCommonImportDecl
    });
  }

  private createOptionalPropertyParse(meta: HObjectPropertyTsMeta, initializer: ts.Expression): ts.Statement[] {
    const letPropertyVar = TsTransfromerHelper.createLetStatement(meta.name);
    // `p.propName === undefined`
    const ifCondition = ts.factory.createBinaryExpression(
      this.createPlainObjPropertyAccess(meta),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createIdentifier("undefined")
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

  private createParsePrimitiveArray(meta: HObjectPropertyTsMeta, parseFn: ts.Expression, hCommonImportDecl: ImportDeclarationWrapper) {
    return this.createArrayPropParse(meta, "parsePrimitiveArray", [parseFn], hCommonImportDecl);
  }

  private createHObjectArrayPropParse(meta: ObjectHObjectPropertyTsMeta, hCommonImportDecl: ImportDeclarationWrapper) {
    return this.createArrayPropParse(meta, "parseHObjectArray", [meta.createTypeIdentifier()], hCommonImportDecl);
  }

  private createArrayPropParse(meta: HObjectPropertyTsMeta, method: string, extraArgs: ts.Expression[], hCommonImportDecl: ImportDeclarationWrapper): ts.Expression {
    const itemsRule = meta.getItemsRule();
    const args: ts.Expression[] = [this.createPlainObjPropertyAccess(meta)];
    if (itemsRule) {
      args.push(...itemsRule.args.map(a => this.createNumericLiteral(a)));
      const itemsRuleType = itemsRule.ruleParts[1];
      method = method + "Items" + itemsRuleType[0].toUpperCase() + itemsRuleType.slice(1);
    }

    args.push(...extraArgs);
    return this.createPlainParseHelperCall({ meta, helper: ArrayPlainParseHelper, method, args, hCommonImportDecl });
  }

  // <helperClass>.<name>(args)
  private createPlainParseHelperCall(c: PlainParseHelperMethodCallContext, appendPathAndIssuesArgs = true) {
    const helperClassIdentifier = ts.factory.createIdentifier(c.helper.name);
    let args = c.args;
    if (appendPathAndIssuesArgs) {
      args = [
        ...c.args,
        c.meta.createNameStringLiteral(),
        ts.factory.createIdentifier("issues")
      ];
    }

    return ts.factory.createCallExpression(
      this.createPlainParseHelperPropertyAccess(helperClassIdentifier, c.method),
      undefined,
      args
    );
  }

  // <helperClass>.<name>
  private createPlainParseHelperPropertyAccess(helper: ts.Identifier | ts.PropertyAccessChain, name: string): ts.PropertyAccessExpression {
    return ts.factory.createPropertyAccessExpression(
      helper,
      ts.factory.createIdentifier(name)
    );
  }

  // p.<prop>
  private createPlainObjPropertyAccess(meta: HObjectPropertyTsMeta): ts.PropertyAccessExpression {
    return ts.factory.createPropertyAccessExpression(
      this.createPlainObjIdentifier(),
      ts.factory.createIdentifier(meta.name)
    );
  }

  private createPlainObjIdentifier(): ts.Identifier {
    return ts.factory.createIdentifier("p");
  }

  private createNumericLiteral(num: string): ts.Expression {
    if (Number(num) >= 0) {
      return ts.factory.createNumericLiteral(num);
    }

    return ts.factory.createPrefixUnaryExpression(
      ts.SyntaxKind.MinusToken,
      ts.factory.createNumericLiteral(num.substring(1))
    );
  }
}