import ts from "typescript";
import { TsTransfromerHelper } from "../../TsTransformerHelper";
import { CollectionType, HObjectPropertyKind, HObjectPropertyTsMeta, HObjectPropertyPrimitiveType, ValueValidationRule } from "./HObjectPropertyTsMeta";

export class HObjectPropertyExtractor {
  public extract(node: ts.ClassDeclaration, sourceFile: ts.SourceFile, diagnostics: ts.Diagnostic[]): HObjectPropertyTsMeta[] {
    const properties: HObjectPropertyTsMeta[] = [];
    node.members.forEach(member => {
      if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
        const meta = this.extractPropertyMeta(member, sourceFile, diagnostics);
        if (meta) {
          properties.push(meta);
        }
      }

      if (ts.isConstructorDeclaration(member)) {
        diagnostics.push(TsTransfromerHelper.createDiagnostic(node, "HObject user defined constructor is unsupported"));
        //this.collectFromConstructor(member, properties, sourceFile, diagnostics);
      }
    }, this);

    return properties;
  }

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

  private extractPropertyMeta(member: ts.PropertyDeclaration | ts.ParameterPropertyDeclaration, sourceFile: ts.SourceFile, diagnostics: ts.Diagnostic[]) {
    if (member.type === undefined) {
      diagnostics.push(TsTransfromerHelper.createDiagnostic(member, 'Property has type "any", which is not allowed in HObject'));

      return undefined;
    }

    const typeMeta = this.extractPropertyType(member, member.type, sourceFile, diagnostics);
    if (!typeMeta) {
      return;
    }

    return new HObjectPropertyTsMeta(
      typeMeta.kind,
      (member.name as ts.Identifier).text,
      typeMeta.tsType,
      !!member.questionToken,
      typeMeta.validationRules,
      typeMeta.collectionType
    );
  }

  private extractPropertyType(
    parentNode: ts.Node,
    typeNode: ts.TypeNode,
    sourceFile: ts.SourceFile,
    diagnostics: ts.Diagnostic[]
  ): Pick<HObjectPropertyTsMeta, 'tsType' | 'kind' | 'validationRules' | 'collectionType'> | undefined {
    // v.int.between<10, 100>[] & v.items.exactly<10>
    // v.int[] & v.items.exactly<10>
    // string[] & v.items.exactly<10>
    if (ts.isIntersectionTypeNode(typeNode)) {
      return this.extractTypeFromIntesectionTypeNode(parentNode, typeNode, sourceFile, diagnostics);
    }

    // TODO: support type union

    // v.int.between<10, 100>[]
    // v.int[]
    // string[]
    if (ts.isArrayTypeNode(typeNode)) {
      return this.extractTypeFromArrayTypeNode(parentNode, typeNode, sourceFile, diagnostics);
    }

    // v.int.between<10, 100>
    // v.int
    // string
    return this.extractTypeFromNode(parentNode, typeNode, sourceFile, diagnostics);
  }

  private extractTypeFromIntesectionTypeNode(
    parentNode: ts.Node,
    typeNode: ts.IntersectionTypeNode,
    sourceFile: ts.SourceFile,
    diagnostics: ts.Diagnostic[]
  ): Pick<HObjectPropertyTsMeta, 'tsType' | 'kind' | 'validationRules' | 'collectionType'> | undefined {
    if (ts.isArrayTypeNode(typeNode.types[0])) {
      const itemType = this.extractTypeFromNode(parentNode, typeNode.types[0].elementType, sourceFile, diagnostics);
      if (!itemType) {
        return undefined;
      }

      const itemsRuleType = this.extractTypeFromNode(parentNode, typeNode.types[1], sourceFile, diagnostics);
      if (!itemsRuleType) {
        return itemType;
      }

      if (itemsRuleType.validationRules && itemsRuleType.validationRules[0].rule.startsWith('v.items')) {
        return {
          tsType: itemType.tsType,
          kind: itemType.kind,
          validationRules: [...itemType.validationRules!, itemsRuleType.validationRules[0]],
          collectionType: CollectionType.Array,
        };
      } else {
        diagnostics.push(TsTransfromerHelper.createDiagnostic(parentNode, 'Only v.items.* can be used for array HObject property'));
        return undefined;
      }
    }

    diagnostics.push(TsTransfromerHelper.createDiagnostic(parentNode, 'unsupported property type intersection definition'));
    return undefined;
  }

  private extractTypeFromArrayTypeNode(
    parentNode: ts.Node,
    typeNode: ts.ArrayTypeNode,
    sourceFile: ts.SourceFile,
    diagnostics: ts.Diagnostic[]
  ): Pick<HObjectPropertyTsMeta, 'tsType' | 'kind' | 'validationRules' | 'collectionType'> | undefined {
    const itemType = this.extractTypeFromNode(parentNode, typeNode.elementType, sourceFile, diagnostics);
    if (!itemType) {
      return undefined;
    }

    return {
      tsType: itemType.tsType,
      kind: itemType.kind,
      validationRules: itemType.validationRules,
      collectionType: CollectionType.Array,
    };
  }

  private extractTypeFromNode(
    parentNode: ts.Node,
    node: ts.TypeNode,
    sourceFile: ts.SourceFile,
    diagnostics: ts.Diagnostic[]
  ): Pick<HObjectPropertyTsMeta, 'tsType' | 'kind' | 'validationRules'> | undefined {
    const primitiveType = this.extractPrimitiveTypeFromNode(node);
    if (primitiveType) {
      return {
        kind: HObjectPropertyKind.PRIMITIVE,
        tsType: primitiveType,
      };
    }


    if (ts.isTypeReferenceNode(node)) {
      if (ts.isQualifiedName(node.typeName)) {
        const typeName = node.typeName.getText(sourceFile);
        if (typeName.startsWith('v.')) {
          const validationRule = this.extractValidationRuleFromNode(typeName, node, sourceFile);
          return {
            kind: HObjectPropertyKind.PRIMITIVE,
            tsType: validationRule.primitiveType,
            validationRules: [validationRule]
          };
        }
      } else {
        return {
          kind: HObjectPropertyKind.HOBJECT,
          tsType: node,
        };
      }
    }

    diagnostics.push(TsTransfromerHelper.createDiagnostic(parentNode, 'unsupported property type definition'));
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
    const args = node.typeArguments ? node.typeArguments.map(arg => arg.getText(sourceFile)) : ([] as string[]);
    return new ValueValidationRule(typeName, args);
  }
}