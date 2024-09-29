import ts, { SyntaxKind } from "typescript";
import { LogicError } from "@hexancore/common";
import { TsTransfromerHelper } from "../../TsTransformerHelper";
import { CollectionType, HObjectPropertyKind, HObjectPropertyTsMeta, HObjectPropertyPrimitiveType, ValueValidationRule, type HObjectPropertyType, PrimitiveHObjectPropertyTsMeta, ObjectHObjectPropertyTsMeta } from "./HObjectPropertyTsMeta";
import type { ImportDeclarationWrapper } from "../../Helper/ImportDeclarationWrapper";

interface HObjectExtractPropertyTypeMeta {
  kind: HObjectPropertyKind;
  tsType: HObjectPropertyType;
  validationRules?: ValueValidationRule[],
  collectionType?: CollectionType,
  tsImportDeclaration?: ImportDeclarationWrapper;
}

export interface HObjectPropertyExtractContext {
  sourceFile: ts.SourceFile;
  diagnostics: ts.Diagnostic[];
  importNameToDeclarationMap: Map<string, ImportDeclarationWrapper>;
}

export class HObjectPropertyExtractor {
  public extract(node: ts.ClassDeclaration, context: HObjectPropertyExtractContext): HObjectPropertyTsMeta[] {
    const properties: HObjectPropertyTsMeta[] = [];
    node.members.forEach(member => {
      if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
        const meta = this.extractPropertyMeta(member, context);
        if (meta) {
          properties.push(meta);
        }
      }

      if (ts.isConstructorDeclaration(member)) {
        context.diagnostics.push(TsTransfromerHelper.createDiagnostic(member, "HObject user defined constructor is unsupported", context.sourceFile));
        //this.collectFromConstructor(member, properties, sourceFile, diagnostics);
      }
    }, this);

    return properties;
  }

  /*
  private collectFromConstructor(node: ts.ConstructorDeclaration, properties: HObjectPropertyTsMeta[], sourceFile: ts.SourceFile, diagnostics: ts.Diagnostic[]): void {
    for (const param of node.parameters) {
      if (ts.isParameterPropertyDeclaration(param, node) && ts.isIdentifier(param.name)) {
        const meta = this.extractPropertyMeta(param, sourceFile, diagnostics);
        if (meta) {
          properties.push(meta);
        }
      }
    }
  }
    */

  private extractPropertyMeta(member: ts.PropertyDeclaration | ts.ParameterPropertyDeclaration, context: HObjectPropertyExtractContext) {
    if (member.type === undefined) {
      context.diagnostics.push(TsTransfromerHelper.createDiagnostic(member, 'Property has type "any", which is not allowed in HObject', context.sourceFile));

      return undefined;
    }

    const typeMeta = this.extractPropertyType(member, member.type, context);
    if (!typeMeta) {
      return;
    }

    const name = (member.name as ts.Identifier).text;
    const optional = !!member.questionToken;
    if (typeMeta.kind === HObjectPropertyKind.PRIMITIVE) {
      return new PrimitiveHObjectPropertyTsMeta(
        name,
        typeMeta.tsType as any,
        optional,
        typeMeta.validationRules,
        typeMeta.collectionType
      );
    } else {
      return new ObjectHObjectPropertyTsMeta(
        name,
        typeMeta.tsType as any,
        typeMeta.tsImportDeclaration!,
        optional,
        typeMeta.validationRules,
        typeMeta.collectionType
      );
    }
  }

  private extractPropertyType(
    parentNode: ts.Node,
    typeNode: ts.TypeNode,
    context: HObjectPropertyExtractContext,
  ): HObjectExtractPropertyTypeMeta | undefined {
    // v.int.between<10, 100>[] & v.items.exactly<10>
    // v.int[] & v.items.exactly<10>
    // string[] & v.items.exactly<10>
    if (ts.isIntersectionTypeNode(typeNode)) {
      return this.extractTypeFromIntesectionTypeNode(parentNode, typeNode, context);
    }

    // TODO: support type union

    // v.int.between<10, 100>[]
    // v.int[]
    // string[]
    if (ts.isArrayTypeNode(typeNode)) {
      return this.extractTypeFromArrayTypeNode(parentNode, typeNode, context);
    }

    // v.int.between<10, 100>
    // v.int
    // string
    return this.extractTypeFromNode(parentNode, typeNode, context);
  }

  private extractTypeFromIntesectionTypeNode(
    parentNode: ts.Node,
    typeNode: ts.IntersectionTypeNode,
    context: HObjectPropertyExtractContext
  ): HObjectExtractPropertyTypeMeta | undefined {
    if (ts.isArrayTypeNode(typeNode.types[0])) {
      const itemType = this.extractTypeFromNode(parentNode, typeNode.types[0].elementType, context);
      if (!itemType) {
        return undefined;
      }

      const itemsRuleType = this.extractTypeFromNode(parentNode, typeNode.types[1], context);
      if (!itemsRuleType) {
        return itemType;
      }

      if (itemsRuleType.validationRules && itemsRuleType.validationRules[0].isCollectionItemsRule()) {
        return {
          tsType: itemType.tsType,
          kind: itemType.kind,
          validationRules: [...itemType.validationRules!, itemsRuleType.validationRules[0]],
          collectionType: CollectionType.Array,
          tsImportDeclaration: itemType.tsImportDeclaration,
        };
      } else {
        context.diagnostics.push(TsTransfromerHelper.createDiagnostic(parentNode, 'v.items.* can be used only for `Array|Set|Map` property', context.sourceFile));
        return undefined;
      }
    }

    context.diagnostics.push(TsTransfromerHelper.createDiagnostic(parentNode, 'unsupported property type intersection definition', context.sourceFile));
    return undefined;
  }

  private extractTypeFromArrayTypeNode(
    parentNode: ts.Node,
    typeNode: ts.ArrayTypeNode,
    context: HObjectPropertyExtractContext
  ): HObjectExtractPropertyTypeMeta | undefined {
    const itemType = this.extractTypeFromNode(parentNode, typeNode.elementType, context);
    if (!itemType) {
      return undefined;
    }

    return {
      ...itemType,
      collectionType: CollectionType.Array,
    };
  }

  private extractTypeFromNode(
    parentNode: ts.Node,
    node: ts.TypeNode,
    context: HObjectPropertyExtractContext
  ): HObjectExtractPropertyTypeMeta | undefined {
    const primitiveType = this.extractPrimitiveTypeFromNode(node);
    if (primitiveType) {
      return {
        kind: HObjectPropertyKind.PRIMITIVE,
        tsType: primitiveType,
      };
    }


    if (ts.isTypeReferenceNode(node)) {
      if (ts.isQualifiedName(node.typeName)) {
        const typeName = node.typeName.getText(context.sourceFile);
        if (typeName.startsWith('v.')) {
          const validationRule = this.extractValidationRuleFromNode(typeName, node, context.sourceFile);
          return {
            kind: HObjectPropertyKind.PRIMITIVE,
            tsType: validationRule.primitiveType,
            validationRules: [validationRule]
          };
        }
      } else {
        const importDeclaration = context.importNameToDeclarationMap.get(node.typeName.text);
        if (!importDeclaration) {
          context.diagnostics.push(TsTransfromerHelper.createDiagnostic(parentNode, `Missing type import: ${node.typeName.text}`, context.sourceFile));
        }

        return {
          kind: HObjectPropertyKind.HOBJECT,
          tsType: node.typeName,
          tsImportDeclaration: importDeclaration
        };
      }
    }

    context.diagnostics.push(TsTransfromerHelper.createDiagnostic(parentNode, 'unsupported property type definition', context.sourceFile));
    return undefined;
  }

  private extractPrimitiveTypeFromNode(node: ts.TypeNode): HObjectPropertyPrimitiveType | null {
    switch (node.kind) {
      case ts.SyntaxKind.StringKeyword:
        return HObjectPropertyPrimitiveType.string;
      case ts.SyntaxKind.BooleanKeyword:
        return HObjectPropertyPrimitiveType.boolean;
      case ts.SyntaxKind.NumberKeyword:
        return HObjectPropertyPrimitiveType.number;
      case ts.SyntaxKind.BigIntKeyword:
        return HObjectPropertyPrimitiveType.bigint;
    }
    return null;
  }

  private extractValidationRuleFromNode(typeName: string, node: ts.TypeReferenceNode, sourceFile: ts.SourceFile): ValueValidationRule {
    const mapArgs = (arg: ts.TypeNode) => {
      if (ts.isLiteralTypeNode(arg)) {
        switch (arg.literal.kind) {
          case SyntaxKind.StringLiteral:
          case SyntaxKind.NumericLiteral:
            return arg.literal.text;
          case SyntaxKind.PrefixUnaryExpression:
            return arg.literal.getText(sourceFile);
          default:
            throw new LogicError(`Unsupported type argument literal kind: ${SyntaxKind[arg.literal.kind]}`);
        }
      }
      throw new LogicError(`Unsupported type argument kind: ${SyntaxKind[arg.kind]}`);
    };

    const args = node.typeArguments ? node.typeArguments.map(mapArgs) : ([] as string[]);
    return new ValueValidationRule(typeName.substring(2), args);
  }
}