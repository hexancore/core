import { readFileSync } from "node:fs";
import path from "node:path";
import * as ts from "typescript";
export class TsTransformerTestHelper {
  public constructor(private compilerOptions: ts.CompilerOptions) {

  }

  public static createFromTsConfig(tsConfigFilePath: string): TsTransformerTestHelper {
    const tsConfig = this.loadTsConfig(tsConfigFilePath);
    return new this(tsConfig.options);
  }

  private static loadTsConfig(tsConfigFilePath: string): ts.ParsedCommandLine {
    const configFile = ts.readConfigFile(tsConfigFilePath, ts.sys.readFile);
    if (configFile.error) {
      throw new Error(`Error reading tsconfig.json: ${configFile.error.messageText}`);
    }
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(tsConfigFilePath)
    );

    return parsedConfig;
  }

  public createSourceFileFromExisting(existingFilePath: string, filePath?: string): ts.SourceFile {
    const code = readFileSync(existingFilePath).toString();
    return this.createSourceFile(filePath ?? existingFilePath, code);
  }

  public createSourceFile(filePath: string, code: string): ts.SourceFile {
    return ts.createSourceFile(
      filePath,
      code,
      this.compilerOptions.target ?? ts.ScriptTarget.Latest
    );
  }

  public createTransformerFactory(transformer: (sourceFile: ts.SourceFile) => ts.SourceFile): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => transformer;
  }

  public transformAndReturnAsString(sourceFile: ts.SourceFile, transformers: ts.TransformerFactory<ts.SourceFile>[]): string {
    const transformResult = ts.transform(sourceFile, transformers, this.compilerOptions);

    const transformedSourceFile = transformResult.transformed[0];
    const printer = ts.createPrinter();

    const result = printer.printNode(
      ts.EmitHint.SourceFile,
      transformedSourceFile,
      sourceFile
    );

    return result;
  }
}