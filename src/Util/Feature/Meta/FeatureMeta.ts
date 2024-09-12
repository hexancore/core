import { type JsonSerialize, LogicError } from '@hexancore/common';
import { hash } from "node:crypto";
import type { FeatureHObjectMap, FeatureHObjectMeta } from './CommonFeatureMeta';
import { FeatureApplicationMeta } from './FeatureApplicationMeta';
import { FeatureDomainMeta } from './FeatureDomainMeta';
import { FeatureInfrastructureMeta } from './FeatureInfrastructureMeta';

export type FeatureMap = Map<string, FeatureMeta>;

export class FeatureMeta implements JsonSerialize {
  private _hObjectMap!: Map<string, FeatureHObjectMeta>;
  public cacheKey!: string;

  public constructor(
    public name: string,
    public application: FeatureApplicationMeta,
    public domain: FeatureDomainMeta,
    public infrastructure: FeatureInfrastructureMeta,
    cacheKey?: string
  ) {
    if (!cacheKey) {
      this.cacheKey = this.calcCacheKey();
    }
  }

  public static parseMap(plain: unknown): FeatureMap {
    if (!Array.isArray(plain)) {
      throw new LogicError('Wrong plain in FeatureMeta.parseMap()');
    }

    return new Map(plain.map(entry => [entry[0], this.parse(entry[1])]));
  }

  public static parse(plain: unknown): FeatureMeta {
    if (typeof plain !== 'object' && plain !== null) {
      throw new LogicError('Wrong plain in FeatureMeta.parse()');
    }

    const data = plain as Record<string, any>;
    const application = FeatureApplicationMeta.parse(data.application);
    const domain = FeatureDomainMeta.parse(data.domain);
    const infrastructure = FeatureInfrastructureMeta.parse(data.infrastructure);

    return new this(data.name, application, domain, infrastructure, data.cacheKey);
  }

  private calcCacheKey(): string {
    const data = this.application.hashData + this.domain.hashData;
    return hash("sha1", data, "hex");
  }

  public get hObjectMap(): Map<string, FeatureHObjectMeta> {
    if (!this._hObjectMap) {
      this._hObjectMap = this.createHObjectMap();
    }

    return this._hObjectMap;
  }

  private createHObjectMap(): FeatureHObjectMap {
    const map = new Map();
    this.application.collectHObjects(map);
    this.domain.collectHObjects(map);

    return map;
  }

  public toJSON(): any {
    return {
      name: this.name,
      cacheKey: this.cacheKey,

      application: this.application.toJSON(),
      domain: this.domain.toJSON(),
      infrastructure: this.infrastructure.toJSON(),
    };
  }
}