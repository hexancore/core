import ts from 'typescript';
import type { FeatureMeta } from "../../../Util/Feature/Meta/FeatureMeta";
import { AbstractFeatureTsTransformer } from './AbstractFeatureTsTransformer';
import { TsTransfromerHelper } from '../TsTransformerHelper';
import type { AddImportTransformDef } from '../ModuleClassTsTransformer';
import type { FeatureTransformContext } from './FeatureTransformContext';

export class FeatureInfraDomainModuleTsTransformer extends AbstractFeatureTsTransformer {

  public transform(source: ts.SourceFile, context: FeatureTransformContext): ts.SourceFile {
    const feature = context.feature;
    const domainErrorsClassName = feature.name + "DomainErrors";

    const imports: AddImportTransformDef[] = [
      { name: "DomainInfraModuleHelper", importModuleSpecifier: '@hexancore/core' },
      { name: domainErrorsClassName, importModuleSpecifier: '../../Domain' }
    ];

    const repos: string[] = [];

    for (const r of feature.domain.aggregateRoots) {
      repos.push(r.infraRepositoryName);
      imports.push(
        { name: r.name, importModuleSpecifier: `../../Domain/${r.name}/${r.name}` },
        { name: r.infraRepositoryName, importModuleSpecifier: `./${r.name}/${r.infraRepositoryName}` }
      );

      for (const e of r.entities) {
        repos.push(e.infraRepositoryName);
        imports.push({ name: e.infraRepositoryName, importModuleSpecifier: `./${r.name}/${e.infraRepositoryName}` });
      }
    }

    return this.moduleClassTransformer.transform({
      imports,
      extraStatementProvider(importedIdentifierMapper) {
        const classIdentifier = importedIdentifierMapper("DomainInfraModuleHelper");
        const methodIdentifier = ts.factory.createIdentifier("createMeta");

        const optionsObject = ts.factory.createObjectLiteralExpression([
          ts.factory.createPropertyAssignment("featureName", ts.factory.createStringLiteral(feature.name)),
          ts.factory.createPropertyAssignment("aggregateRootCtrs", ts.factory.createArrayLiteralExpression(feature.domain.aggregateRoots.map((r) => ts.factory.createIdentifier(r.name)))),
          ts.factory.createPropertyAssignment("domainErrors", ts.factory.createIdentifier(domainErrorsClassName)),
        ]);

        const createMeta = TsTransfromerHelper.createConstStatement("HcDomainInfraModuleMetaExtra", ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(classIdentifier, methodIdentifier),
          undefined,
          [optionsObject]
        ));

        return [
          TsTransfromerHelper.createConstStatement("HcDomainInfraAggrgateRootRepositories",
            ts.factory.createArrayLiteralExpression(repos.map((r) => ts.factory.createIdentifier(r)))
          ),
          createMeta
        ];
      },

      extraMetaProvider() {
        return ts.factory.createIdentifier("HcDomainInfraModuleMetaExtra");
      },
      source,
      context: context.tsContext,
    });
  }

  public supports(sourcefilePath: string, feature: FeatureMeta): boolean {
    return sourcefilePath.endsWith("DomainInfraModule.ts");
  }
}