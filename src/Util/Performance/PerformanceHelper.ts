import { performance, type PerformanceEntry } from "node:perf_hooks";

export class PerformanceHelper {

  public static async measureFunction<R = unknown>(name: string, fn: () => Promise<any>): Promise<R> {
    if (!process.env["HC_TRACK_PERF"]) {
      return await fn();
    }
    const startMarker = name + ".start";
    performance.mark(startMarker);
    const result = await fn();
    const endMarker = name + ".end";
    performance.mark(endMarker);
    performance.measure(name, startMarker, endMarker);
    return result;
  }

  public static getFirstMeasure(name: string): PerformanceEntry | null {
    const list = performance.getEntriesByName(name);
    return list.length > 0 ? list[0] : null;
  }
}