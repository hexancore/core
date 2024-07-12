export class FsHelper {
  public static normalizePathSep(path: string): string {
    return path.replaceAll("\\", "/");
  }
}