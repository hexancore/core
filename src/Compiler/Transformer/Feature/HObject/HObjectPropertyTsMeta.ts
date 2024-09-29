import ts from "typescript";
import type { ImportDeclarationWrapper } from "../../Helper/ImportDeclarationWrapper";
import type { JsonSerialize } from "@hexancore/common";

export enum HObjectPropertyKind {
  PRIMITIVE = 0,
  HOBJECT = 1,
}

export enum HObjectPropertyPrimitiveType {
  undefined = 0,
  string = 1,
  number = 2,
  boolean = 3,
  bigint = 4,
}

export type HObjectPropertyType = HObjectPropertyPrimitiveType | ts.Identifier;

export class ValueValidationRule {
  public ruleParts: string[];
  public primitiveType: HObjectPropertyPrimitiveType;

  public constructor(public rule: string, public args: string[]) {
    const parts = rule.split('.');
    this.primitiveType = this.parseRulePrimitiveType(parts);
    this.ruleParts = parts;
  }

  private parseRulePrimitiveType(parts: string[]) {
    let type = HObjectPropertyPrimitiveType.undefined;
    switch (parts[0]) {
      case 'string':
        type = HObjectPropertyPrimitiveType.string;
        break;
      case 'uint':
      case 'int':
      case 'float':
        type = HObjectPropertyPrimitiveType.number;
        break;
      default:
        return type;
    }

    return type;
  }

  public isCollectionItemsRule(): boolean {
    return this.ruleParts[0] === "items";
  }

  // string.regex
  public isStringRegexRule(): boolean {
    return (this.ruleParts.length === 2 && this.ruleParts[1] === "regex");
  }

  // string.length
  public isStringOnlyLengthRule(): boolean {
    return this.ruleParts.length === 2 && this.ruleParts[1] === "length";
  }

  // string.length.rule
  public isStringLengthRule(rule?: | "min" | "max" | "between"): boolean {
    return (!rule && this.ruleParts.length === 2) || (this.ruleParts.length === 3 && this.ruleParts[2] === rule);
  }

  public isOnlyIntRule(): boolean {
    return this.ruleParts.length === 1 && this.ruleParts[0] === "int";
  }

  public isIntRule(rule: "min" | "max" | "between" | "between_exclusive" | "gt" | "lt"): boolean {
    return this.ruleParts.length === 2 && this.ruleParts[0] === "int" && this.ruleParts[1] === rule;
  }

  public isOnlyUIntRule(): boolean {
    return this.ruleParts.length === 1 && this.ruleParts[0] === "uint";
  }

  public isUIntRule(rule: "min" | "max" | "between" | "between_exclusive" | "gt" | "lt"): boolean {
    return this.ruleParts.length === 2 && this.ruleParts[0] === "uint" && this.ruleParts[1] === rule;
  }

  public isOnlyFloatRule(): boolean {
    return this.ruleParts.length === 1 && this.ruleParts[0] === "float";
  }

  public isFloatRule(rule: "min" | "max" | "between" | "between_exclusive" | "gt" | "lt"): boolean {
    return this.ruleParts.length === 2 && this.ruleParts[0] === "float" && this.ruleParts[1] === rule;
  }

  public toString(): string {
    const args = this.args.length > 0 ? `<${this.args.map(arg => Number.isFinite(+arg) ? arg : `'${arg}'`).join(',')}>` : '';
    return `${this.rule}${args}`;
  }
}

export enum CollectionType {
  Array = 'Array',
  Map = 'Map',
  Set = 'Set',
}

export abstract class HObjectPropertyTsMeta implements JsonSerialize {
  public constructor(
    public readonly name: string,
    public readonly optional: boolean,
    public readonly validationRules?: ValueValidationRule[],
    public readonly collectionType?: CollectionType,
  ) {

  }

  public isPrimitive(): this is PrimitiveHObjectPropertyTsMeta {
    return this instanceof PrimitiveHObjectPropertyTsMeta;
  }

  public isHObject(): this is ObjectHObjectPropertyTsMeta {
    return this instanceof ObjectHObjectPropertyTsMeta;
  }

  public getItemsRule(): ValueValidationRule | undefined {
    return this.validationRules?.find(r => r.isCollectionItemsRule());
  }

  public createNameStringLiteral(): ts.StringLiteral {
    return ts.factory.createStringLiteral(this.name);
  }

  protected formatCollectionTypeToString(type: string): string {
    if (this.collectionType === CollectionType.Array) {
      return type + "[]";
    }

    return type;
  }

  public abstract toJSON(): any;
}

export class ObjectHObjectPropertyTsMeta extends HObjectPropertyTsMeta {
  public constructor(
    name: string,
    public readonly tsType: ts.Identifier,
    public readonly tsImportDeclaration: ImportDeclarationWrapper,
    optional: boolean,
    validationRules?: ValueValidationRule[],
    collectionType?: CollectionType,
  ) {
    super(name, optional, validationRules, collectionType);
  }

  public createTypeIdentifier(): ts.PropertyAccessChain | ts.Identifier {
    return this.tsImportDeclaration.get(this.tsType.text);
  }

  public toJSON(): any {
    return {
      kind: HObjectPropertyKind.HOBJECT,
      name: this.name,
      type: this.tsType.getText(),
      optional: this.optional,
      validationRules: this.validationRules,
      collectionType: this.collectionType,
    };
  }

  public toString(): string {
    let type = (this.tsType as ts.TypeReferenceNode | ts.Identifier).getText();
    type = this.formatCollectionTypeToString(type);
    return `${this.name}${this.optional ? '?' : '!'}: ${type}`;
  }
}

export class PrimitiveHObjectPropertyTsMeta extends HObjectPropertyTsMeta {
  public constructor(
    name: string,
    public readonly tsType: HObjectPropertyPrimitiveType,
    optional: boolean,
    validationRules?: ValueValidationRule[],
    collectionType?: CollectionType,
  ) {
    super(name, optional, validationRules, collectionType);
  }

  public toJSON(): any {
    return {
      kind: HObjectPropertyKind.PRIMITIVE,
      name: this.name,
      type: HObjectPropertyPrimitiveType[this.tsType as HObjectPropertyPrimitiveType],
      optional: this.optional,
      validationRules: this.validationRules,
      collectionType: this.collectionType,
    };
  }

  public toString(): string {
    const type = this.formatPrimitiveTypeToString();
    return `${this.name}${this.optional ? '?' : '!'}: ${type}`;
  }

  private formatPrimitiveTypeToString(): string {
    if (this.validationRules) {
      if (this.validationRules[0].isCollectionItemsRule()) {
        const type = this.formatCollectionTypeToString(HObjectPropertyPrimitiveType[this.tsType as any]);
        return type + " & " + this.validationRules[0];
      } else {
        const type = this.formatCollectionTypeToString(this.validationRules[0].toString());
        if (this.validationRules.length == 2) {
          return type + " & " + this.validationRules[1];
        }
        return type;
      }
    } else {
      return this.formatCollectionTypeToString(HObjectPropertyPrimitiveType[this.tsType as any]);
    }
  }
}