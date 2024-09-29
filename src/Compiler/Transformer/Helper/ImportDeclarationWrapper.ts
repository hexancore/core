import ts from "typescript";
import { TsTransfromerHelper } from "../TsTransformerHelper";

export class ImportDeclarationWrapper {
  public constructor(
    public declaration: ts.ImportDeclaration,
    private context: ts.TransformationContext
  ) {

  }

  public static create(importName: string | string[], importPath: string, context: ts.TransformationContext): ImportDeclarationWrapper {
    return ImportDeclarationWrapper.from(TsTransfromerHelper.createImportDeclaration(importName, importPath), context);
  }

  public static from(importDecl: ts.ImportDeclaration, context: ts.TransformationContext): ImportDeclarationWrapper {
    return new this(importDecl, context);
  }

  public get(name: string): ts.PropertyAccessChain | ts.Identifier {
    return ts.factory.createIdentifier(name); //TsTransfromerHelper.createNamedImportAccess(this.declaration, name, this.context);
  }

  public hasNamedAccess(name: string): boolean {
    if (!this.declaration.importClause?.namedBindings) {
      return false;
    }

    return (this.declaration.importClause.namedBindings as ts.NamedImports).elements.filter(i => i.name.text === name).length > 0;
  }

  public getEntityName(name: string): ts.EntityName {
    const current = this.get(name);
    if (ts.isIdentifier(current)) {
      return current;
    }

    return ts.factory.createQualifiedName(current.expression as ts.Identifier, current.name as ts.Identifier);
  }

  public addNamedImports(elements: (ts.ImportSpecifier | string)[]): ts.ImportDeclaration {
    const newNamedImports = ts.factory.createNamedImports([
      ...(this.declaration.importClause?.namedBindings as ts.NamedImports).elements.map(e => ts.factory.createImportSpecifier(e.isTypeOnly, e.propertyName, ts.factory.createIdentifier(e.name.text))),
      ...elements.map(e => typeof e === 'string' ? ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(e)) : e),
    ]);

    this.declaration = ts.factory.updateImportDeclaration(
      this.declaration,
      undefined,
      ts.factory.updateImportClause(this.declaration.importClause!,
        this.declaration.importClause!.isTypeOnly, undefined, newNamedImports),
      this.declaration.moduleSpecifier, this.declaration.attributes
    );

    return this.declaration;
  }

  public get importNames(): string[] {
    return (this.declaration.importClause?.namedBindings as ts.NamedImports).elements.map(e => e.name.text);
  }
}