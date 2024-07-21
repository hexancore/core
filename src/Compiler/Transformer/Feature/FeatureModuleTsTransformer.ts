import ts from 'typescript';
import type { FeatureApplicationMessageMeta, FeatureModuleMeta } from "../../../Util/Feature/FeatureModuleMeta";
import { AbstractFeatureTsTransformer } from "./AbstractFeatureTsTransformer";
import type { ProviderModuleMetaTransformDef } from '../ModuleClassTsTransformer';

/**
 * Adding automatic injection of message handlers, services, infra module to `[Feature]Module` source.
 * Less write, more fun !
 */
export class FeatureModuleTsTransformer extends AbstractFeatureTsTransformer {

  public supports(sourcefilePath: string, feature: FeatureModuleMeta): boolean {
    return sourcefilePath.endsWith(feature.name + "Module.ts");
  }

  public transform(feature: FeatureModuleMeta, source: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile {

    const messageHandlersProviders: ProviderModuleMetaTransformDef[] = [];
    messageHandlersProviders.push(...this.createMessageHandlerProviders(feature.application.commands));
    messageHandlersProviders.push(...this.createMessageHandlerProviders(feature.application.queries));
    messageHandlersProviders.push(...this.createMessageHandlerProviders(feature.application.events));

    return this.moduleClassTransformer.transform({
      imports: [],
      meta: {
        imports: [],
        providers: [...messageHandlersProviders, ...this.createServiceProviders(feature)],
      },
      source,
      context
    });
  }

  private createMessageHandlerProviders(messages: FeatureApplicationMessageMeta[]): ProviderModuleMetaTransformDef[] {
    const providers: ProviderModuleMetaTransformDef[] = [];
    for (const m of messages) {
      const importPath = `./${m.path}/${m.handlerClassName}`;
      providers.push({
        addToExports: false,
        name: m.handlerClassName,
        importFrom: importPath
      });
    }

    return providers;
  }

  private createServiceProviders(feature: FeatureModuleMeta): ProviderModuleMetaTransformDef[] {
    const providers: ProviderModuleMetaTransformDef[] = [];
    for (const s of feature.application.services) {
      if (!s.isInjectable) {
        continue;
      }

      providers.push({
        addToExports: false,
        name: s.className,
        importFrom: `./${s.path}`
      });
    }

    return providers;
  }
}