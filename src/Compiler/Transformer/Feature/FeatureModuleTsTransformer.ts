import ts from 'typescript';
import type {FeatureMeta } from "../../../Util/Feature/Meta/FeatureMeta";
import { AbstractFeatureTsTransformer } from "./AbstractFeatureTsTransformer";
import type { ProviderModuleMetaTransformDef } from '../ModuleClassTsTransformer';
import type { FeatureTransformContext } from './FeatureTransformContext';
import type { FeatureApplicationMessageMeta } from '../../../Util/Feature/Meta';
import type { FeatureSourcePath } from "../../../Util/Feature/FeatureModuleDiscoverer";

/**
 * Adding automatic injection of message handlers, services, infra module to `[Feature]Module` source.
 * Less write, more fun !
 */
export class FeatureModuleTsTransformer extends AbstractFeatureTsTransformer {

  public supports(featureSourcePath: FeatureSourcePath, feature: FeatureMeta): boolean {
    return featureSourcePath.localSourcePath.endsWith(feature.name + "Module.ts");
  }

  public transform(source: ts.SourceFile, context: FeatureTransformContext): ts.SourceFile {
    const feature = context.feature;

    const messageHandlersProviders: ProviderModuleMetaTransformDef[] = [];
    messageHandlersProviders.push(...this.createMessageHandlerProviders(feature.application.commands));
    messageHandlersProviders.push(...this.createMessageHandlerProviders(feature.application.queries));

    return this.moduleClassTransformer.transform({
      imports: [],
      meta: {
        imports: [],
        providers: [...messageHandlersProviders, ...this.createServiceProviders(feature)],
      },
      source,
      context: context.tsContext,
    });
  }

  private createMessageHandlerProviders(messages: FeatureApplicationMessageMeta[]): ProviderModuleMetaTransformDef[] {
    const providers: ProviderModuleMetaTransformDef[] = [];
    for (const m of messages) {
      const importPath = `./${m.path}/${m.handlerClass}`;
      providers.push({
        addToExports: false,
        name: m.handlerClass,
        importFrom: importPath
      });
    }

    return providers;
  }

  private createServiceProviders(feature: FeatureMeta): ProviderModuleMetaTransformDef[] {
    const providers: ProviderModuleMetaTransformDef[] = [];
    for (const s of feature.application.services) {
      if (!s.isInjectable) {
        continue;
      }

      providers.push({
        addToExports: false,
        name: s.name,
        importFrom: `./${s.path}`
      });
    }

    return providers;
  }
}