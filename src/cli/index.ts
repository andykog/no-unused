#!/usr/bin/env node

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import {analyze} from '../analyzer';

const createProgram = () => {
  const tsConfigPath = path.resolve('tsconfig.json');
  const tsConfigJSON = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
  const entrypoints: string[] =
    process.argv.length > 2
      ? process.argv.slice(2)
      : tsConfigJSON?.files?.map((file: string) =>
          path.resolve(path.dirname(tsConfigPath), file),
        ) || [];

  if (entrypoints.length === 0) {
    throw new Error('Missing entrypoints, add `files` in tsconfg.json or pass files as arguments');
  }

  const program = ts.createProgram({
    rootNames: entrypoints,
    options: require(tsConfigPath).compilerOptions ?? {},
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

const {seenIdentifiers, usedIdentifiers} = analyze(createProgram());

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
