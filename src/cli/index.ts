import * as ts from 'typescript';
import * as glob from 'glob';
import {analyze} from '../analyzer';
import {resolveTsConfig} from './tsConfigResolver';

const ignoredFilesPattern = '**/*.@(spec|test).*';

const createProgram = () => {
  const {compilerOptions, files} = resolveTsConfig();
  const params = process.argv.slice(2);
  const providedFiles = params.length ? params.flatMap((f) => glob.sync(f)) : undefined;
  const entrypoints = providedFiles ?? files;

  if (entrypoints.length === 0) {
    throw new Error('Missing entrypoints, add files in tsconfg.json or pass them as arguments');
  }

  const program = ts.createProgram({
    rootNames: entrypoints,
    options: compilerOptions,
  });

  if (!process.env.NO_TSC_ERRORS) {
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

const {seenIdentifiers, usedIdentifiers} = analyze(createProgram(), {ignoredFilesPattern});

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
