import { FeatureApplicationCommandMeta, type FeatureApplicationQueryMeta } from '../../../Util/Feature/Meta';
import ts from "typescript";
import { type FeatureMeta } from "../../../Util/Feature/Meta";
import { AbstractFeatureTsTransformer } from "./AbstractFeatureTsTransformer";
import type { FeatureTransformContext } from "./FeatureTransformContext";
import type { FeatureSourcePath } from "../../../Util/Feature/FeatureModuleDiscoverer";
import { ImportDeclarationWrapper } from "../Helper/ImportDeclarationWrapper";

interface VisitContext extends FeatureTransformContext {
  meta: FeatureApplicationCommandMeta | FeatureApplicationQueryMeta;
  handlerDecoratorName: string;
  cqrsImport: ImportDeclarationWrapper;
}

export class FeatureApplicationMessageHandlerTsTransformer extends AbstractFeatureTsTransformer {

  public supports(featureSourcePath: FeatureSourcePath, feature: FeatureMeta): boolean {
    const meta = feature.applicationCqrsHandlerMap.get(featureSourcePath.localSourcePath);
    return !!meta;
  }

  public transform(source: ts.SourceFile, context: FeatureTransformContext): ts.SourceFile {
    const messageMeta = context.feature.applicationCqrsHandlerMap.get(context.featureSourcePath.localSourcePath)!;
    const handlerDecoratorName = messageMeta instanceof FeatureApplicationCommandMeta ? "CommandHandler" : "QueryHandler";
    const cqrsImport = ImportDeclarationWrapper.create(handlerDecoratorName, "@nestjs/cqrs", context.tsContext);
    const visitContext: VisitContext = {
      ...context,
      meta: messageMeta,
      handlerDecoratorName: handlerDecoratorName,
      cqrsImport
    };

    const transformed = ts.factory.updateSourceFile(source, [
      cqrsImport.declaration,
      ...ts.visitNodes(
        source.statements,
        this.visitSourceStatement.bind(this, visitContext),
        (node): node is ts.Statement => ts.isStatement(node)
      )
    ]);

    return transformed;
  }

  private visitSourceStatement(visitContext: VisitContext, node: ts.Statement) {
    if (ts.isClassDeclaration(node)) {
      const handlerDecorator = ts.factory.createDecorator(ts.factory.createCallExpression(
        visitContext.cqrsImport.get(visitContext.handlerDecoratorName),
        undefined,
        [ts.factory.createIdentifier(visitContext.meta.className)]
      ));
      return ts.factory.updateClassDeclaration(
        node,
        [handlerDecorator, ...node.modifiers ?? []],
        node.name,
        node.typeParameters,
        node.heritageClauses,
        node.members
      );
    }

    return node;
  }
}