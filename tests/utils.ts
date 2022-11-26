import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as _ from 'tsutils';
import {analyze} from '../src/analyzer';

const resolve = (...pathComponents: string[]) => path.resolve(__dirname, ...pathComponents);

const createTestProgram = (filePath: string) => {
  return ts.createProgram({
    rootNames: [filePath],
    options: {
      module: ts.ModuleKind.CommonJS,
      noImplicitAny: true,
      removeComments: true,
      preserveConstEnums: true,
      outDir: 'lib',
      sourceMap: true,
      lib: ['es2017', 'dom'],
    },
  });
};

const getNodeLine = (node: ts.Node) => {
  const {line} = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());
  return line + 1;
};

const getExpectedUnused = (sourceFile: ts.SourceFile) =>
  sourceFile
    .getFullText()
    .split('\n')
    .map(
      (line, lineNumber) =>
        line
          .trim()
          // find comments like: //<- name1, name2
          .match(/^((?!\/\/).)*\/\/<-\s*(.*)/)?.[2]
          .split(/,\s*/)
          .map((name) => ({name, lineNumber: lineNumber + 1})) ?? [],
    )
    .flat();

export const getFiles = (specsFolder: string) =>
  fs
    .readdirSync(resolve(specsFolder))
    .filter((name) => name.endsWith('.ts'))
    .map((f) => resolve(specsFolder, f));

export const testUnusedProperties = (filePath: string) => {
  const program = createTestProgram(filePath);
  const sourceFile = program.getSourceFile(filePath);
  const {seenIdentifiers, usedIdentifiers} = analyze(program, {
    ignoredExportsPattern: '**/ignoredExports.ts',
  });
  const expectedUnused = getExpectedUnused(sourceFile!);

  const unusedIdentifiers = Array.from(seenIdentifiers).filter((i) => !usedIdentifiers.has(i));

  unusedIdentifiers.forEach((identifier, identifierIdx) => {
    const expectedIdx = expectedUnused.findIndex(
      ({name, lineNumber}) =>
        identifier.escapedText === name && getNodeLine(identifier) === lineNumber,
    );
    if (expectedIdx !== -1) {
      expectedUnused.splice(expectedIdx, 1);
      unusedIdentifiers.splice(identifierIdx, 1);
    }
  });

  const expected = expectedUnused.map(({name, lineNumber}) => `${name} (line ${lineNumber})`);
  const actual = unusedIdentifiers.map(
    (identifier) => `${identifier.escapedText} (line ${getNodeLine(identifier)})`,
  );

  return {expected, actual};
};
