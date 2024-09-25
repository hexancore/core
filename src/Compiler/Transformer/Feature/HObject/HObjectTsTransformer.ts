import { HObjectPropertyExtractor } from './HObjectPropertyExtractor';
import ts from "typescript";
import type { FeatureMeta } from "../../../../Util/Feature/Meta/FeatureMeta";
import { AbstractFeatureTsTransformer, type FeatureTsTransformerHelpers } from "../AbstractFeatureTsTransformer";
import type { FeatureTransformContext } from "../FeatureTransformContext";
import { HObjectParseTsFactory } from "./HObjectParseTsFactory";
import { HObjectToJSONTsFactory } from "./HObjectToJSONTsFactory";
import type { FeatureSourcePath } from "../../../../Util/Feature/FeatureModuleDiscoverer";
import { HObjectToConstructorTsFactory } from "./HObjectConstructorTsFactory";
import { ImportDeclarationWrapper } from "../../Helper/ImportDeclarationWrapper";
import { HObjectKind } from "@/Util/Feature/Meta";

interface VisitContext extends FeatureTransformContext {
  source: ts.SourceFile;
  importNameToDeclarationMap: Map<string, ImportDeclarationWrapper>;
  hCommonImportDecl?: ImportDeclarationWrapper;
}

const HObjectHCommonImports = [
  'R',
  'OK',
  'type JsonObjectType',
  'type PlainParsableHObjectType',
  'type PlainParseError',
  'PlainParseHelper',
  'InvalidTypePlainParseIssue',
  'HObjectTypeMeta',
  'PlainParseIssue',
  'TooBigPlainParseIssue',
  'TooSmallPlainParseIssue'
];

export class HObjectTsTransformer extends AbstractFeatureTsTransformer {

  private propertyExtractor: HObjectPropertyExtractor;
  private constructorTsFactory: HObjectToConstructorTsFactory;
  private parseTsFactory: HObjectParseTsFactory;
  private toJSONTsFactory: HObjectToJSONTsFactory;

  public constructor(helpers: FeatureTsTransformerHelpers) {
    super(helpers);

    this.propertyExtractor = new HObjectPropertyExtractor();
    this.constructorTsFactory = new HObjectToConstructorTsFactory(),
      this.parseTsFactory = new HObjectParseTsFactory();
    this.toJSONTsFactory = new HObjectToJSONTsFactory();
  }

  public supports(featureSourcePath: FeatureSourcePath, feature: FeatureMeta): boolean {
    const meta = feature.hObjectMap.get(featureSourcePath.localSourcePath);
    if (meta && meta.kind !== HObjectKind.AggregateRoot && meta.kind !== HObjectKind.Entity) {
      return true;
    }

    return false;
  }

  public transform(source: ts.SourceFile, context: FeatureTransformContext): ts.SourceFile {
    const visitContext: VisitContext = {
      ...context,
      importNameToDeclarationMap: new Map(),
      source,
    };

    const transformed = ts.factory.updateSourceFile(source, ts.visitNodes(
      source.statements,
      this.visitSourceStatment.bind(this, visitContext),
      (node): node is ts.Statement => ts.isStatement(node))
    );

    return transformed;
  }

  private visitSourceStatment(visitContext: VisitContext, node: ts.Statement) {
    if (ts.isImportDeclaration(node)) {
      return this.visitImportDeclaration(visitContext, node);
    }

    if (ts.isClassDeclaration(node)) {
      if (!visitContext.hCommonImportDecl) {
        visitContext.hCommonImportDecl = ImportDeclarationWrapper.create(HObjectHCommonImports, '@hexancore/common', visitContext.tsContext);
        return [
          visitContext.hCommonImportDecl.declaration,
          this.updateClassDeclaration(node, visitContext as any)
        ];
      }

      return this.updateClassDeclaration(node, visitContext as any);
    }

    return node;
  }

  private visitImportDeclaration(visitContext: VisitContext, node: ts.ImportDeclaration) {
    const wrapper = ImportDeclarationWrapper.from(node, visitContext.tsContext);

    if (this.isHexancoreCommonImport(visitContext, node)) {
      visitContext.hCommonImportDecl = wrapper;
      return this.extendHexancoreCommonImportDecl(visitContext.hCommonImportDecl);
    }

    wrapper.importNames.forEach(name => {
      visitContext.importNameToDeclarationMap.set(name, wrapper);
    });

    return wrapper.declaration;
  }

  private isHexancoreCommonImport(visitContext: VisitContext, node: ts.ImportDeclaration): boolean {
    const moduleSpecifier = node.moduleSpecifier;
    return !visitContext.hCommonImportDecl && ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === '@hexancore/common';
  }

  private extendHexancoreCommonImportDecl(decl: ImportDeclarationWrapper): ts.ImportDeclaration {
    const newImports = HObjectHCommonImports.filter(i => !decl.hasNamedAccess(i));
    return decl.addNamedImports(newImports);
  }

  private updateClassDeclaration(node: ts.ClassDeclaration, visitContext: Required<VisitContext>) {
    const properties = this.propertyExtractor.extract(node, visitContext.source, visitContext.diagnostics);
    const hObjectClassName = node.name!.text;

    const newMembers = [
      this.createHObjectMetaClassProperty(hObjectClassName, visitContext),
      ...node.members,
    ];

    if (properties.length > 0) {
      newMembers.push(this.constructorTsFactory.create(properties));
      newMembers.push(this.parseTsFactory.create(hObjectClassName, properties, visitContext.hCommonImportDecl));
      newMembers.push(this.toJSONTsFactory.create(hObjectClassName, properties, visitContext.hCommonImportDecl));
    }

    return ts.factory.updateClassDeclaration(
      node,
      node.modifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      ts.factory.createNodeArray(newMembers)
    );
  }

  private createHObjectMetaClassProperty(hObjClassName: string, visitContext: VisitContext) {
    const featureHObjMeta = visitContext.feature.hObjectMap.get(visitContext.featureSourcePath.localSourcePath)!;

    const hObjTypeMetaCreateParameters = [
      ts.factory.createStringLiteral(visitContext.feature.name),
      ts.factory.createStringLiteral(featureHObjMeta.context),
      ts.factory.createStringLiteral(featureHObjMeta.kind + ''),
      ts.factory.createStringLiteral(featureHObjMeta.name),
      ts.factory.createIdentifier(hObjClassName)
    ];

    const hobjectTypeMetaCreateExp = ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("HObjectTypeMeta"),
        ts.factory.createIdentifier(featureHObjMeta.layer)
      ),
      undefined,
      hObjTypeMetaCreateParameters
    );

    return ts.factory.createPropertyDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword), ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)],
      "HOBJ_META",
      undefined,
      undefined,
      hobjectTypeMetaCreateExp
    );
  }
}