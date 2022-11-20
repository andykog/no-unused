import * as ts from 'typescript';
import * as _ from 'tsutils';

export const seenIdentifiers = new Set<ts.Identifier>();
export const usedIdentifiers = new WeakSet<ts.Identifier>();
export const functionsStack: ts.FunctionLikeDeclarationBase[] = [];
export const whitelistStack: (Set<ts.Identifier> | undefined)[] = [];
export const withFunctionsStack = (node: ts.FunctionLikeDeclarationBase, cb: () => void) => {
  functionsStack.push(node);
  cb();
  functionsStack.pop();
};
export const withWhitelistStack = (node: Set<ts.Identifier> | undefined, cb: () => void) => {
  whitelistStack.push(node);
  cb();
  whitelistStack.pop();
};

let typeChecker: ts.TypeChecker;

export const tc = () => typeChecker;
export const setTypeChecker = (t: ts.TypeChecker) => {
  typeChecker = t;
};

export const use = (node?: ts.Symbol | (ts.Node & {name?: any})) => {
  if (!node) return;
  if ('declarations' in node) {
    node.declarations?.forEach(use);
  } else if (node.name && _.isIdentifier(node.name)) {
    usedIdentifiers.add(node.name);
  }
};

export const see = (node: ts.Node & {name?: any}) => {
  if (!node?.name) return;
  if (_.isIdentifier(node.name)) {
    seenIdentifiers.add(node.name);
  } else if (_.isBindingPattern(node.name)) {
    node.name.elements.forEach(see);
  }
};

export const getResult = () => ({seenIdentifiers, usedIdentifiers});
