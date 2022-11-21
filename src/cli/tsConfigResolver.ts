import * as path from 'path';
import * as ts from 'typescript';
import * as getTsconfig from 'get-tsconfig';
import * as glob from 'glob';

const convertLibs = (lib: string) => `lib.${lib.toLowerCase()}.d.ts`;

const convertType = (type: string) => path.join(process.cwd(), 'node_modules', '@types', type);

const convertModule = (module?: string) => {
  if (!module) return undefined;
  switch (module.toLowerCase()) {
    case 'classic':
      return ts.ModuleResolutionKind.Classic;
    case 'node':
    default:
      return ts.ModuleResolutionKind.NodeJs;
  }
};

const convertTarget = (target?: string) => {
  if (!target) return undefined;
  switch (target.toLowerCase()) {
    case 'es6':
      return ts.ScriptTarget.ES5;
    case 'es2015':
      return ts.ScriptTarget.ES2015;
    case 'es2016':
      return ts.ScriptTarget.ES2016;
    case 'es2017':
      return ts.ScriptTarget.ES2017;
    case 'esnext':
    case 'latest':
      return ts.ScriptTarget.ESNext;
    case 'es5':
    default:
      return ts.ScriptTarget.ES5;
  }
};

const convert = (compilerOpts: getTsconfig.TsConfigJson.CompilerOptions = {}): ts.CompilerOptions => ({
  ...compilerOpts,
  lib: compilerOpts.lib?.map(convertLibs),
  types: compilerOpts.types?.map(convertType),
  moduleResolution: convertModule(compilerOpts.moduleResolution),
  target: convertTarget(compilerOpts.target),
  importsNotUsedAsValues: compilerOpts.importsNotUsedAsValues as any,
  jsx: compilerOpts.jsx as any,
  module: compilerOpts.jsx as any,
  newLine: compilerOpts.newLine as any,
  plugins: compilerOpts.plugins as any,
});

export const resolveTsConfig = (searchPath?: string) => {
  const getConfigResult = getTsconfig.getTsconfig(searchPath);
  if (!getConfigResult) {
    throw new Error('tsconfig.json not found');
  }
  const {config, path: configPath} = getConfigResult;
  const configDir = path.dirname(configPath);
  const mapGlobs = (f: string[] = []) =>
    f?.flatMap((f) =>
      glob.sync(f, {
        cwd: configDir,
        ignore: config.exclude,
      }),
    );
  const files = mapGlobs(config.files).concat(mapGlobs(config.include));
  return {compilerOptions: convert(config.compilerOptions), files};
};
