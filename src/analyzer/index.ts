import * as ts from 'typescript';
import {seenIdentifiers, usedIdentifiers, setTypeChecker} from './state';
import {walk} from './walker';
import minimatch from 'minimatch';

type Options = {
  ignoredFilesPattern?: string;
};

export const analyze = (program: ts.Program, options: Options = {}) => {
  seenIdentifiers.clear();
  setTypeChecker(program.getTypeChecker());

  program
    .getSourceFiles()
    .filter(
      (f) => !program.isSourceFileFromExternalLibrary(f) && !program.isSourceFileDefaultLibrary(f),
    )
    .filter(
      (f) => !options.ignoredFilesPattern || !minimatch(f.fileName, options.ignoredFilesPattern),
    )
    .forEach(walk);

  return {seenIdentifiers, usedIdentifiers};
};
