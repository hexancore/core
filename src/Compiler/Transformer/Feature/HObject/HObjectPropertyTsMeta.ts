import ts from "typescript";
import type { ImportDeclarationWrapper } from "../../Helper/ImportDeclarationWrapper";

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

export type HObjectPropertyType = HObjectPropertyPrimitiveType | ts.TypeReferenceNode | ts.Identifier;

export class ValueValidationRule {
  public extraRuleParts: string[];
  public primitiveType: HObjectPropertyPrimitiveType;

  public constructor(public rule: string, public args: string[]) {
    const parts = rule.split('.');
    parts.shift(); // remove `v`
    this.primitiveType = this.parseRulePrimitiveType(parts);
    this.extraRuleParts = parts;
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

    parts.shift();
    return type;
  }

  public isCollectionItemsRule(): boolean {
    return this.extraRuleParts[0] === "items";
  }

  public isStringLengthRule(): boolean {
    return this.extraRuleParts[1] === "length";
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

export interface PrimitiveHObjectPropertyTsMeta {
  kind: HObjectPropertyKind.PRIMITIVE,
  name: string,
  tsType: HObjectPropertyPrimitiveType,
  optional: boolean,
  validationRules?: ValueValidationRule[],
  collectionType?: CollectionType,
}

export interface ObjectHObjectPropertyTsMeta {
  kind: HObjectPropertyKind.HOBJECT,
  name: string,
  tsType: ts.TypeReferenceNode | ts.Identifier,
  tsImportDeclaration: ImportDeclarationWrapper,
  optional: boolean,
  collectionType?: CollectionType,
}

export class HObjectPropertyTsMeta {
  public constructor(
    public kind: HObjectPropertyKind,
    public name: string,
    public tsType: HObjectPropertyType,
    public optional: boolean,
    public validationRules?: ValueValidationRule[],
    public collectionType?: CollectionType,
    public tsImportDeclaration?: ImportDeclarationWrapper,
  ) {

  }

  public static createWithValidationRule(
    name: string,
    optional: boolean,
    validationRules: ValueValidationRule[],
    collectionType?: CollectionType
  ): HObjectPropertyTsMeta {
    const primitiveType = validationRules[0].primitiveType;
    return new this(HObjectPropertyKind.PRIMITIVE, name, primitiveType, optional, validationRules, collectionType);
  }

  public static createString(name: string, optional: boolean, collectionType?: CollectionType, itemsValidationRule?: ValueValidationRule): HObjectPropertyTsMeta {
    return new this(
      HObjectPropertyKind.PRIMITIVE,
      name,
      HObjectPropertyPrimitiveType.string,
      optional,
      itemsValidationRule ? [itemsValidationRule] : [],
      collectionType
    );
  }

  public static createNumber(
    name: string,
    optional: boolean,
    collectionType?: CollectionType,
    itemsValidationRule?: ValueValidationRule,
  ): HObjectPropertyTsMeta {
    return new this(
      HObjectPropertyKind.PRIMITIVE,
      name,
      HObjectPropertyPrimitiveType.number,
      optional,
      itemsValidationRule ? [itemsValidationRule] : [],
      collectionType
    );
  }

  public static createBoolean(
    name: string,
    optional: boolean,
    collectionType?: CollectionType,
    itemsValidationRule?: ValueValidationRule,
  ): HObjectPropertyTsMeta {
    return new this(
      HObjectPropertyKind.PRIMITIVE,
      name,
      HObjectPropertyPrimitiveType.boolean,
      optional,
      itemsValidationRule ? [itemsValidationRule] : [],
      collectionType
    );
  }

  public static createBigInt(
    name: string,
    optional: boolean,
    collectionType?: CollectionType,
    itemsValidationRule?: ValueValidationRule,
  ): HObjectPropertyTsMeta {
    return new this(
      HObjectPropertyKind.PRIMITIVE,
      name,
      HObjectPropertyPrimitiveType.bigint,
      optional,
      itemsValidationRule ? [itemsValidationRule] : [],
      collectionType
    );
  }

  public isPrimitive(): this is PrimitiveHObjectPropertyTsMeta {
    return this.kind === HObjectPropertyKind.PRIMITIVE;
  }

  public isHObject(): this is ObjectHObjectPropertyTsMeta {
    return this.kind === HObjectPropertyKind.HOBJECT;
  }

  public toJSON(): any {
    return {
      kind: HObjectPropertyKind[this.kind],
      name: this.name,
      type: this.kind === HObjectPropertyKind.PRIMITIVE ? HObjectPropertyPrimitiveType[this.tsType as HObjectPropertyPrimitiveType] : this.tsType,
      optional: this.optional,
      validationRules: this.validationRules,
      collectionType: this.collectionType,
    };
  }

  public toString(): string {
    let type: string;
    if (this.kind === HObjectPropertyKind.PRIMITIVE) {
      type = this.formatPrimitiveTypeToString();
    } else {
      type = (this.tsType as ts.TypeReferenceNode | ts.Identifier).getText();
      type = this.formatCollectionTypeToString(type);
    }
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

  private formatCollectionTypeToString(type: string): string {
    if (this.collectionType === CollectionType.Array) {
      return type + "[]";
    }

    return type;
  }
}