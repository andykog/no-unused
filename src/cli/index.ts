import * as ts from 'typescript';
import * as glob from 'glob';
import {analyze} from '../analyzer';
import {resolveTsConfig} from './tsConfigResolver';
import {Command} from 'commander';
const packageJson = require('../../package.json');

const command = new Command()
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)
  .argument('[pattern]', 'pattern for source files (omit to find automatically)')
  .option('-i, --ignore [pattern]', 'pattern for ignored files', '**/*.@(spec|test).*')
  .option('-I, --ignoreExports [pattern]', 'pattern for files where exports are ignored', [])
  .option('-p, --project [string]', 'path to tsconfig.json (omit to resolve automatically)')
  .option('-e, --errors', 'emit tsc errors')
  .action(
    (
      pattern,
      {
        ignore: ignoredFilesPattern,
        ignoreExports: ignoredExportsPattern,
        errors: tscErrors,
        project: pathToTsconfig,
      }: {ignore: string; errors: boolean; project?: string; ignoreExports?: string},
    ) => {
      console.log({pattern, ignoredExportsPattern})
      const createProgram = () => {
        const {compilerOptions, files} = resolveTsConfig(pathToTsconfig);
        const params = process.argv.slice(2);
        const providedFiles = params.length ? params.flatMap((f) => glob.sync(f)) : undefined;
        const entrypoints = providedFiles ?? files;

        if (entrypoints.length === 0) {
          throw new Error("Couldn't find any files");
        }

        const program = ts.createProgram({
          rootNames: entrypoints,
          options: compilerOptions,
        });

        if (tscErrors) {
          console.log(
            ts.formatDiagnosticsWithColorAndContext(ts.getPreEmitDiagnostics(program), {
              getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
              getCanonicalFileName: (f) => f,
              getNewLine: () => '\n',
            }),
          );
        }

        return program;
      };

      const {seenIdentifiers, usedIdentifiers} = analyze(createProgram(), {
        ignoredFilesPattern,
        ignoredExportsPattern,
      });

      const unusedIdentifiers = Array.from(seenIdentifiers).filter((i) => !usedIdentifiers.has(i));
      let diagnostics: ts.DiagnosticWithLocation[] = unusedIdentifiers.map((identifier) => ({
        category: ts.DiagnosticCategory.Message,
        code: 0,
        file: identifier.getSourceFile(),
        length: identifier.getWidth(),
        messageText: 'Unused identifier',
        start: identifier.getStart(),
      }));
      console.log(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
          getCanonicalFileName: (f) => f,
          getNewLine: () => '\n',
        }),
      );

      console.log(`Total: ${unusedIdentifiers.length} unused identifiers`);
    },
  )
  .parse();
