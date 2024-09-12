import { LogicError } from "@hexancore/common";
import { FeatureHObjectMeta, HObjectType, type FeatureHObjectMap } from "./CommonFeatureMeta";

export class FeatureAggregateRootMeta implements FeatureHObjectMeta {
  public repositoryName: string;
  public infraRepositoryName: string;

  public constructor(
    public name: string,
    public entities: FeatureEntityMeta[],
    public valueObjects: FeatureValueObjectMeta[]
  ) {
    this.repositoryName = name + "Repository";
    this.infraRepositoryName = "Infra" + name + "Repository";
  }

  public static parse(plain: unknown): FeatureAggregateRootMeta {
    const data = plain as Record<keyof FeatureAggregateRootMeta, any>;

    const entities = data.entities.map(FeatureEntityMeta.parse);
    const valueObjects = data.valueObjects.map(FeatureValueObjectMeta.parse);
    return new FeatureAggregateRootMeta(data.name, entities, valueObjects);
  }

  public get context(): string {
    return this.name;
  }

  public get path(): string {
    return `Domain/${this.name}/${this.name}`;
  }

  public get filePath(): string {
    return this.path + '.ts';
  }

  public get className(): string {
    return this.name;
  }

  public get objectType(): HObjectType {
    return HObjectType.AggregateRoot;
  }

  public get hashData(): string {
    return this.path + this.entities.map(i => i.hashData) + this.valueObjects.map(i => i.hashData);
  }

  public toJSON(): any {
    return {
      name: this.name,
      entities: this.entities.map(v => v.toJSON()),
      valueObjects: this.valueObjects.map(v => v.toJSON()),
    };
  }
}

export class FeatureEntityMeta implements FeatureHObjectMeta {
  public repositoryName: string;
  public infraRepositoryName: string;

  public constructor(
    public name: string,
    public aggregateRootName: string,
  ) {
    this.repositoryName = name + "Repository";
    this.infraRepositoryName = "Infra" + name + "Repository";
  }

  public static parse(plain: unknown): FeatureEntityMeta {
    const data = plain as Record<keyof FeatureEntityMeta, any>;
    return new FeatureEntityMeta(data.name, data.aggregateRootName);
  }

  public get path(): string {
    return `Domain/${this.aggregateRootName}/${this.name}`;
  }

  public get filePath(): string {
    return this.path + '.ts';
  }

  public get className(): string {
    return this.name;
  }

  public get context(): string {
    return this.aggregateRootName;
  }

  public get objectType(): HObjectType {
    return HObjectType.Entity;
  }

  public get hashData(): string {
    return this.path;
  }

  public toJSON(): any {
    return {
      name: this.name,
      aggregateRootName: this.aggregateRootName
    };
  }
}

export class FeatureValueObjectMeta implements FeatureHObjectMeta {
  public constructor(
    public name: string,
    public context: string,

    public shared: boolean,
  ) { }

  public static parse(plain: unknown): FeatureValueObjectMeta {
    const data = plain as Record<keyof FeatureValueObjectMeta, any>;
    return new FeatureValueObjectMeta(data.name, data.context, data.shared);
  }

  public get path(): string {
    if (this.context === '') {
      return `Domain/Shared/ValueObject/${this.name}`;
    }

    return `Domain/${this.context}/${this.shared ? 'Shared/ValueObject/' : 'ValueObject/'}${this.name}`;
  }

  public get filePath(): string {
    return this.path + '.ts';
  }

  public get className(): string {
    return this.name;
  }

  public get objectType(): HObjectType.ValueObject {
    return HObjectType.ValueObject;
  }

  public get hashData(): string {
    return this.path;
  }

  public toJSON(): any {
    return {
      name: this.name,
      context: this.context,
      shared: this.shared
    };
  }
}

export class FeatureDomainMeta {
  public constructor(
    public aggregateRoots: FeatureAggregateRootMeta[],
    public valueObjects: FeatureValueObjectMeta[],
  ) { }

  public static parse(plain: unknown): FeatureDomainMeta {
    if (typeof plain !== 'object' && plain !== null) {
      throw new LogicError('Wrong plain in FeatureDomainMeta.parse()');
    }

    const data = plain as Record<string, any[]>;
    const aggregateRoots = data.aggregateRoots.map(FeatureAggregateRootMeta.parse);
    const valueObjects = data.valueObjects.map(FeatureValueObjectMeta.parse);
    return new FeatureDomainMeta (aggregateRoots, valueObjects);
  }

  public collectHObjects(map: FeatureHObjectMap): void {
    for (const ar of this.aggregateRoots) {
      for (const vo of ar.valueObjects) {
        map.set(vo.filePath, vo);
      }
    }

    for (const vo of this.valueObjects) {
      map.set(vo.filePath, vo);

    }
  }

  public get hashData(): string {
    let data = "";
    for (const i of this.aggregateRoots) {
      data += i.hashData;
    }

    for (const i of this.valueObjects) {
      data += i.hashData;
    }

    return data;
  }

  public toJSON(): any {
    return {
      aggregateRoots: this.aggregateRoots.map(v => v.toJSON()),
      valueObjects: this.valueObjects.map(v => v.toJSON()),
    };
  }
}