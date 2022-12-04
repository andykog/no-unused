import * as ts from 'typescript';
import * as path from 'path';
import {
  seenIdentifiers,
  usedIdentifiers,
  setTypeChecker,
  setProgram,
  setInsideIgnoredExport,
  exportsByFile,
  requiredPaths,
} from './state';
import {walk} from './walker';
import minimatch from 'minimatch';
import {debugTime} from '../utils/debugTime';
import {nodeKindToString} from '../utils/nodeKindToString';

type Options = {
  includeFilesPattern?: string;
  ignoredFilesPattern?: string;
  ignoredExportsPattern?: string;
};

const matchesGlob = (fileName: string, pattern: string = '') => {
  const relativeFileName = path.relative(process.cwd(), fileName);
  return pattern.split(',').some((pattern) => minimatch(relativeFileName, pattern));
};

const deduplicate = <T>(arr: T[]) => Array.from(new Set(arr));

export const analyze = (program: ts.Program, options: Options = {}) => {
  seenIdentifiers.clear();
  setProgram(program);
  setTypeChecker(program.getTypeChecker());

  const sourceFiles = program
    .getSourceFiles()
    .filter(
      (file) =>
        !program.isSourceFileFromExternalLibrary(file) && !program.isSourceFileDefaultLibrary(file),
    )
    .filter(
      (file) =>
        (!options.includeFilesPattern || matchesGlob(file.fileName, options.includeFilesPattern)) &&
        !matchesGlob(file.fileName, options.ignoredFilesPattern),
    );

  sourceFiles.forEach(walk);

  const ignoredExportsFilePaths = options.ignoredExportsPattern
    ? sourceFiles
        .filter((f) => matchesGlob(f.fileName, options.ignoredExportsPattern))
        .map((f) => f.fileName)
    : [];
  const requiredFilePaths = sourceFiles
    .filter((f) => requiredPaths.has(f.fileName.replace(/.tsx?$/, '')))
    .map((f) => f.fileName);

  setInsideIgnoredExport(true);
  deduplicate([...ignoredExportsFilePaths, ...requiredFilePaths])
    .flatMap((f) => exportsByFile.get(f) ?? [])
    .forEach(walk);
  setInsideIgnoredExport(false);

  return {seenIdentifiers, usedIdentifiers};
};
