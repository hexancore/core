import { type JsonSerialize, LogicError } from "@hexancore/common";
import type { FeatureClassMeta } from "./CommonFeatureMeta";

export class FeatureInfrastructureMeta implements JsonSerialize {
  public constructor(
    public module: FeatureClassMeta,
  ) {
  }

  public static parse(plain: unknown): FeatureInfrastructureMeta {
    if (typeof plain !== 'object' && plain !== null) {
      throw new LogicError('Wrong plain in FeatureInfrastructureMeta.parse()');
    }

    const data = plain as Record<string, any>;
    return new this(data.module as FeatureClassMeta);
  }

  public toJSON(): any {
    return {
      module: this.module,
    };
  }
}