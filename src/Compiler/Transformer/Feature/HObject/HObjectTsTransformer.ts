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
import { HObjectKind, type FeatureHObjectMeta } from "../../../../Util/Feature/Meta";

interface VisitContext extends FeatureTransformContext {
  source: ts.SourceFile;
  importNameToDeclarationMap: Map<string, ImportDeclarationWrapper>;
  hCommonImportDecl?: ImportDeclarationWrapper;
  meta: FeatureHObjectMeta;
}

const HObjectHCommonImports = [
  'R',
  'OK',
  'PlainParseHelper',
  'IntegerPlainParseHelper',
  'ArrayPlainParseHelper',
  'StringPlainParseHelper',
  'NumberPlainParseHelper',
  'HObjectTypeMeta',
];
const HObjectHCommonTypeOnlyImports = [
  'JsonObjectType',
  'PlainParseError',
  'PlainParseIssue'
];

const GENERATED_METHODS_NAMES = ["parse", "toJSON"];

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
      meta: context.feature.hObjectMap.get(context.featureSourcePath.localSourcePath)!,
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
      this.extendHexancoreCommonImportDecl(visitContext);
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

  private extendHexancoreCommonImportDecl(visitContext: VisitContext): void {
    const decl: ImportDeclarationWrapper = visitContext.hCommonImportDecl!;

    const newImports = [
      ...HObjectHCommonImports.filter(i => !decl.hasNamedAccess(i)),
      ...HObjectHCommonTypeOnlyImports.filter(i => !decl.hasNamedAccess(i)).map(name => ts.factory.createImportSpecifier(true, undefined, ts.factory.createIdentifier(name))),
      ts.factory.createImportSpecifier(true, undefined, ts.factory.createIdentifier("Any" + visitContext.meta.kind)),
      ts.factory.createImportSpecifier(true, undefined, ts.factory.createIdentifier(visitContext.meta.kind + "Type")),
    ];
    decl.addNamedImports(newImports);
  }

  private updateClassDeclaration(node: ts.ClassDeclaration, visitContext: Required<VisitContext>) {
    const properties = this.propertyExtractor.extract(node, {
      sourceFile: visitContext.source,
      diagnostics: visitContext.diagnostics,
      importNameToDeclarationMap: visitContext.importNameToDeclarationMap
    });
    const hObjectClassName = node.name!.text;

    const newMembers = [
      this.createHObjectMetaClassProperty(hObjectClassName, visitContext),
      ...node.members,
    ];

    if (properties.length > 0) {
      const currentGeneratedMethods = node.members.filter(
        m => ts.isConstructorDeclaration(node) || (ts.isMethodDeclaration(m) && GENERATED_METHODS_NAMES.includes(m.name.getText(visitContext.source)))
      ).map(m => m.name!.getText(visitContext.source));

      if (!currentGeneratedMethods.includes('constructor')) {
        newMembers.push(this.constructorTsFactory.create(properties));
      }

      if (!currentGeneratedMethods.includes('parse')) {
        newMembers.push(this.parseTsFactory.create(visitContext.meta, hObjectClassName, properties, visitContext.hCommonImportDecl));
      }

      if (!currentGeneratedMethods.includes('toJSON')) {
        newMembers.push(this.toJSONTsFactory.create(hObjectClassName, properties, visitContext.hCommonImportDecl));
      }
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
        ts.factory.createIdentifier(featureHObjMeta.layer.toLowerCase())
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