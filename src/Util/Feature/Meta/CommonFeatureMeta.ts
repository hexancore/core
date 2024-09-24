import type { JsonSerialize, HFeatureBackendLayer } from "@hexancore/common";

export interface FeatureClassMeta {
  name: string;

  /** Relative to feature root without extension */
  path: string;

  /** Relative to feature root */
  filePath: string;
}

export enum HObjectKind {
  Command = 'Command',
  Query = 'Query',
  Event = 'Event',
  Dto = 'Dto',
  ValueObject = 'ValueObject',
  Entity = 'Entity',
  AggregateRoot = 'AggregateRoot'
}

export interface FeatureHObjectMeta extends FeatureClassMeta, JsonSerialize {
  context: string;
  className: string;
  get hashData(): string;
  get kind(): HObjectKind;
  get layer(): HFeatureBackendLayer;
}

export type FeatureHObjectMap = Map<string, FeatureHObjectMeta>;

export class FeatureDtoMeta implements FeatureHObjectMeta {
  public layer: HFeatureBackendLayer;

  public constructor(
    public name: string,
    public context: string,
    public path: string,
  ) {
    this.layer = path.split('/')[0].toLowerCase() as HFeatureBackendLayer;
  }

  public static parse(plain: unknown): FeatureDtoMeta {
    const data = plain as Record<keyof FeatureDtoMeta, any>;
    return new FeatureDtoMeta(data.name, data.context, data.path);
  }

  public get className(): string {
    return this.name;
  }

  public get filePath(): string {
    return this.path + '.ts';
  }

  public get kind(): HObjectKind.Dto {
    return HObjectKind.Dto;
  }

  public get hashData(): string {
    return this.path;
  }

  public toJSON(): any {
    return {
      name: this.name,
      context: this.context,
      path: this.path,
    };
  }
}