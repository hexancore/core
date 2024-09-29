import { readFileSync } from "node:fs";
import path from "node:path";
import * as ts from "typescript";

export type ContextAwareCustomTransformer = (sourceFile: ts.SourceFile, context: ts.TransformationContext) => ts.SourceFile;
export class TsTransformerTestHelper {

  public constructor(private compilerOptions: ts.CompilerOptions) {

  }

  public static createFromTsConfig(tsConfigFilePath?: string): TsTransformerTestHelper {
    tsConfigFilePath = tsConfigFilePath ?? process.cwd() + "/tsconfig.json";
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
      this.compilerOptions.target ?? ts.ScriptTarget.Latest,
      true,
    );
  }

  public createTransformerFactory(transformer: ContextAwareCustomTransformer): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => (sourceFile: ts.SourceFile) => transformer(sourceFile, context);
  }

  public transformExistingAndReturnAsString(sourceFilePath: string, transformers: ts.TransformerFactory<ts.SourceFile>[]): string {
    const sourceFile = this.createSourceFileFromExisting(sourceFilePath);
    return this.transformAndReturnAsString(sourceFile, transformers);
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

  public transpileModule(transformer: ContextAwareCustomTransformer, sourceFilePath: string, sourceText?: string): ts.TranspileOutput {
    const sourceFile = sourceText ? this.createSourceFile(sourceFilePath, sourceText) : this.createSourceFileFromExisting(sourceFilePath);
    return ts.transpileModule(sourceFile.text, {
      compilerOptions: this.compilerOptions,
      fileName: sourceFilePath,
      transformers: {
        before: [(context) => (sourceFile: ts.SourceFile) => transformer(sourceFile, context)]
      }
    });
  }
}