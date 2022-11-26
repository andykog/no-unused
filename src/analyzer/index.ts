import * as ts from 'typescript';
import {seenIdentifiers, usedIdentifiers, setTypeChecker, setIgnoreExports} from './state';
import {walk} from './walker';
import minimatch from 'minimatch';

type Options = {
  ignoredFilesPattern?: string;
  ignoredExportsPattern?: string;
};

const matchesGlob = (fileName: string, pattern: string = '') =>
  pattern.split(',').some((pattern) => minimatch(fileName, pattern));

export const analyze = (program: ts.Program, options: Options = {}) => {
  seenIdentifiers.clear();
  setTypeChecker(program.getTypeChecker());

  program
    .getSourceFiles()
    .filter(
      (f) => !program.isSourceFileFromExternalLibrary(f) && !program.isSourceFileDefaultLibrary(f),
    )
    .filter((f) => !matchesGlob(f.fileName, options.ignoredFilesPattern))
    .forEach((f) => {
      const ignoreExports = matchesGlob(f.fileName, options.ignoredExportsPattern);
      setIgnoreExports(ignoreExports);
      walk(f);
    });

  return {seenIdentifiers, usedIdentifiers};
};
