import * as ts from 'typescript';
import {seenIdentifiers, usedIdentifiers, setTypeChecker} from './state';
import {walk} from './walker';

export const analyze = (program: ts.Program) => {
  seenIdentifiers.clear();
  setTypeChecker(program.getTypeChecker());

  program
    .getSourceFiles()
    .filter(
      (f) => !program.isSourceFileFromExternalLibrary(f) && !program.isSourceFileDefaultLibrary(f),
    )
    .forEach(walk);

  return {seenIdentifiers, usedIdentifiers};
};
