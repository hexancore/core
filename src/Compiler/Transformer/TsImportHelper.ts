import ts from "typescript";
import { TsTransfromerHelper, type ImportFromMapper } from "./TsTransformerHelper";

export class TsImportHelper {

  protected importedIdentifierMapper: (importDec: ts.ImportDeclaration, name: string, context: ts.TransformationContext) => ts.PropertyAccessChain | ts.Identifier;

  public constructor(
    protected importFromMapper: ImportFromMapper,
    protected needFixImportAccess: boolean
  ) {
    this.importedIdentifierMapper = this.needFixImportAccess ? (importDec, name, context) =>
      TsTransfromerHelper.createNamedImportAccess(importDec, name, context)
      : (_importDec, name, _context) => ts.factory.createIdentifier(name);
  }

  public mapFrom(importFrom: string): string {
    return this.importFromMapper(importFrom);
  }

  public mapAccess(importDec: ts.ImportDeclaration, name: string, context: ts.TransformationContext): ts.PropertyAccessChain | ts.Identifier {
    return this.importedIdentifierMapper(importDec, name, context);
  }
}