import { type JsonSerialize, LogicError, HFeatureBackendLayer } from "@hexancore/common";
import { FeatureClassMeta, FeatureDtoMeta, FeatureHObjectMap, FeatureHObjectMeta, HObjectKind } from "./CommonFeatureMeta";

export interface FeatureApplicationMessageMeta extends FeatureHObjectMeta {
  handlerClass: string;
}
export class FeatureApplicationCommandMeta implements FeatureApplicationMessageMeta {
  public readonly className: string;
  public readonly handlerClass: string;
  public readonly path: string;

  public constructor(
    public readonly name: string,
    public readonly context: string,
  ) {
    this.className = `${this.context}${this.name}Command`;
    this.handlerClass = `${this.context}${this.name}CommandHandler`;
    this.path = `Application/${this.context}/Command/${this.name}`;
  }

  public static parse(plain: unknown): FeatureApplicationCommandMeta {
    const data = plain as Record<keyof FeatureApplicationCommandMeta, any>;

    return new FeatureApplicationCommandMeta(data.name, data.context);
  }

  public get filePath(): string {
    return this.path + '/' + this.className + '.ts';
  }

  public get kind(): HObjectKind.Command {
    return HObjectKind.Command;
  }

  public get layer(): HFeatureBackendLayer {
    return 'application';
  }

  public get hashData(): string {
    return this.path;
  }



  public toJSON(): any {
    return {
      name: this.name,
      context: this.context,
    };
  }
}

export class FeatureApplicationQueryMeta implements FeatureApplicationMessageMeta {
  public readonly className: string;
  public readonly handlerClass: string;
  public readonly path: string;

  public constructor(
    public readonly name: string,
    public readonly context: string,
  ) {
    this.className = `${this.context}${this.name}Query`;
    this.handlerClass = `${this.context}${this.name}QueryHandler`;
    this.path = `Application/${this.context}/Query/${this.name}`;
  }

  public static parse(plain: unknown): FeatureApplicationQueryMeta {
    const data = plain as Record<keyof FeatureApplicationQueryMeta, any>;
    return new FeatureApplicationQueryMeta(data.name, data.context);
  }

  public get filePath(): string {
    return this.path + '/' + this.className + '.ts';
  }

  public get kind(): HObjectKind.Query {
    return HObjectKind.Query;
  }

  public get layer(): HFeatureBackendLayer {
    return 'application';
  }

  public get hashData(): string {
    return this.path;
  }

  public toJSON(): any {
    return {
      name: this.name,
      context: this.context,
    };
  }
}

export class FeatureApplicationServiceMeta implements FeatureClassMeta {
  public constructor(
    public name: string,
    public context: string,
    public path: string,

    public isInjectable: boolean,
  ) {
  }

  public static parse(plain: unknown): FeatureApplicationServiceMeta {
    const data = plain as Record<keyof FeatureApplicationServiceMeta, any>;
    return new FeatureApplicationServiceMeta(data.name, data.context, data.path, data.isInjectable);
  }

  public get filePath(): string {
    return this.path + '.ts';
  }

  public get hashData(): string {
    return this.path;
  }

  public toJSON(): any {
    return {
      name: this.name,
      context: this.context,
      path: this.path,
      isInjectable: this.isInjectable
    };
  }
}

export class FeatureApplicationMeta implements JsonSerialize {

  public constructor(
    public commands: FeatureApplicationCommandMeta[],
    public queries: FeatureApplicationQueryMeta[],
    public dtos: FeatureDtoMeta[],
    public services: FeatureApplicationServiceMeta[],
  ) {

  }

  public static parse(plain: unknown): FeatureApplicationMeta {
    if (typeof plain !== 'object' && plain !== null) {
      throw new LogicError('Wrong plain in FeatureApplicationMeta.parse()');
    }

    const data = plain as Record<keyof FeatureApplicationMeta, any[]>;

    const commands = data.commands.map(FeatureApplicationCommandMeta.parse);
    const queries = data.queries.map(FeatureApplicationQueryMeta.parse);
    const dtos = data.dtos.map(FeatureDtoMeta.parse);
    const services = data.services.map(FeatureApplicationServiceMeta.parse);
    return new this(commands, queries, dtos, services);
  }

  public collectHObjects(map: FeatureHObjectMap): void {
    for (const i of this.commands) {
      map.set(i.filePath, i);
    }

    for (const i of this.queries) {
      map.set(i.filePath, i);
    }

    for (const i of this.dtos) {
      map.set(i.filePath, i);
    }
  }

  public get hashData(): string {
    let data = "";
    for (const i of this.commands) {
      data += i.hashData;
    }

    for (const i of this.queries) {
      data += i.hashData;
    }

    for (const i of this.dtos) {
      data += i.hashData;
    }

    for (const i of this.services) {
      data += i.hashData;
    }

    return data;
  }

  public toJSON(): any {
    return {
      commands: this.commands.map(v => v.toJSON()),
      queries: this.queries.map(v => v.toJSON()),
      dtos: this.dtos.map(v => v.toJSON()),
      services: this.services.map(v => v.toJSON()),
    };
  }
}