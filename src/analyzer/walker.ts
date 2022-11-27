import * as ts from 'typescript';
import * as _ from 'tsutils';
import {logDebug} from '../utils/debugLog';
import {
  checker,
  usedIdentifiers,
  functionsStack,
  whitelistStack,
  withFunctionsStack,
  withWhitelistStack,
  use,
  see,
  ignoreExports,
  setInsideIgnoredExport,
  insideIgnoredExport,
} from './state';
import {extractIdentifiersFromType, linkTypes, findEachSymbolInType} from './typesLinker';

const getClassType = (node: ts.ClassLikeDeclaration) => {
  const type = checker.getTypeAtLocation(node);
  if (_.isClassExpression(node)) {
    const signature = checker.getSignaturesOfType(type, ts.SignatureKind.Construct)[0];
    return signature && checker.getReturnTypeOfSignature(signature);
  }
  return type;
};

const linkBindingPattern = (
  sourceType: ts.Type,
  node: ts.BindingName,
  sourceSymbol?: ts.Symbol,
) => {
  if (sourceSymbol) {
    use(sourceSymbol);
  }
  if (_.isObjectBindingPattern(node)) {
    node.elements.forEach((element) => {
      const identifier = element.propertyName ?? element.name;
      if (identifier && _.isIdentifier(identifier)) {
        const symbol = sourceType.getProperty(String(identifier.escapedText));
        const type = symbol && checker.getTypeOfSymbolAtLocation(symbol, node);
        if (type) {
          linkBindingPattern(type, element.name, symbol);
        }
      }
    });
  } else if (_.isArrayBindingPattern(node)) {
    node.elements.forEach((element, i) => {
      if (_.isTypeReference(sourceType)) {
        const type = sourceType.typeArguments?.[i];
        if (_.isBindingElement(element) && type) {
          linkBindingPattern(type, element.name);
        }
      }
    });
  }
};

const handleReturn = (node: ts.Node, parentFunction?: ts.FunctionLikeDeclarationBase) => {
  if (!parentFunction) {
    logDebug('Missing parent function');
    return;
  }
  if (!parentFunction.type) {
    logDebug('Missing parent function type');
    return;
  }
  const sourceType = checker.getTypeAtLocation(node);
  const targetType = checker.getTypeAtLocation(parentFunction.type);
  use(sourceType.symbol);
  linkTypes(sourceType, targetType, node);
};

const isExported = (node: ts.Node) => {
  const {modifiers} = node as any;
  return _.hasModifier(modifiers, ts.SyntaxKind.ExportKeyword);
};
export const walk = (node?: ts.Node) => {
  if (!node) return;

  const whitelistIdentifiers = whitelistStack.at(-1);
  if (whitelistIdentifiers) {
    const type = checker.getTypeAtLocation(node);
    const actualIdentifiers = extractIdentifiersFromType(checker.getTypeAtLocation(node), node);
    Array.from(actualIdentifiers ?? []).forEach((i) => {
      if (!whitelistIdentifiers.has(i)) {
        usedIdentifiers.add(i);
      }
    });
  }

  if (ignoreExports && isExported(node) && !insideIgnoredExport) {
    setInsideIgnoredExport(true);
    walk(node);
    setInsideIgnoredExport(false);
  }

  if (
    insideIgnoredExport ||
    ts.getJSDocTags(node).some(({tagName}) => tagName.escapedText === 'public')
  ) {
    use(node);
    const type = checker.getTypeAtLocation(node);
    findEachSymbolInType(type, node, use);
  }

  if (_.isObjectLiteralExpression(node)) {
    node.properties.forEach((prop) => {
      see(prop);
      walk(prop);
    });
  } else if (_.isBinaryExpression(node)) {
    walk(node.left);

    if (_.isAssignmentKind(node.operatorToken.kind)) {
      withWhitelistStack(
        extractIdentifiersFromType(checker.getTypeAtLocation(node.right), node),
        () => {
          walk(node.right);
        },
      );
      const sourceType = checker.getTypeAtLocation(node.right);
      const targetType = checker.getTypeAtLocation(node.left);
      use(sourceType.symbol);
      linkTypes(sourceType, targetType, node.left);
    } else {
      walk(node.right);
    }
  } else if (_.isPropertySignature(node)) {
    see(node);
    walk(node.type);
  } else if (_.isIdentifier(node)) {
    const symbol = checker.getSymbolAtLocation(node);
    symbol?.declarations?.filter(({pos}) => pos !== node.pos).forEach(use);
  } else if (_.isClassExpression(node) || _.isClassDeclaration(node)) {
    withWhitelistStack(undefined, () => {
      const sourceType = getClassType(node);
      node.heritageClauses
        ?.flatMap((clause) => clause.types)
        .forEach((n) => {
          use(sourceType.symbol);
          const targetType = checker.getTypeFromTypeNode(n) as ts.InterfaceType;
          linkTypes(sourceType, targetType, node);
        });
      node.forEachChild(walk);
    });
  } else if (_.isReturnStatement(node)) {
    if (node.expression) {
      walk(node.expression);
      handleReturn(node.expression, functionsStack.at(-1));
    }
  } else if (
    _.isSetAccessorDeclaration(node) ||
    _.isGetAccessorDeclaration(node) ||
    _.isArrowFunction(node) ||
    _.isMethodDeclaration(node) ||
    _.isFunctionDeclaration(node) ||
    _.isFunctionExpression(node)
  ) {
    see(node);
    withWhitelistStack(undefined, () => {
      node.parameters.forEach((p) => {
        see(p);
        if (_.isBindingPattern(p.name) && p.type) {
          linkBindingPattern(checker.getTypeFromTypeNode(p.type), p.name);
        }
        walk(p);
      });
      walk(node.type);
      withFunctionsStack(node, () => {
        walk(node.body);
      });
    });

    if (node.type && node.body && node.body.kind !== ts.SyntaxKind.Block) {
      handleReturn(node.body, node);
    }
  } else if (_.isCallExpression(node)) {
    use(checker.getSymbolAtLocation(node.expression));
    node.arguments.forEach(walk);
    walk(node.expression);

    const exprType = checker.getTypeAtLocation(node.expression);

    node.arguments.forEach((argument, i) => {
      const argumentType = checker.getTypeAtLocation(argument);
      const getCallParameterTypeAndSymbol = (type: ts.Type, index: number) => {
        const callSignatures = type.getCallSignatures();
        const paramSymbols = callSignatures.map((sig) => sig.parameters[i]).filter(Boolean);
        return paramSymbols.length ? paramSymbols : undefined;
      };
      const paramSymbols = getCallParameterTypeAndSymbol(exprType, i);
      if (paramSymbols) {
        paramSymbols.forEach((targetPSymbol) => {
          const targetType = checker.getTypeOfSymbolAtLocation(targetPSymbol, argument);
          linkTypes(argumentType, targetType, argument);
        });
      } else {
        findEachSymbolInType(argumentType, argument, use);
      }
    });
  } else if (_.isNewExpression(node)) {
    use(checker.getSymbolAtLocation(node.expression));
    node.forEachChild(walk);
  } else if (_.isVariableDeclaration(node) || _.isPropertyDeclaration(node)) {
    see(node);
    if (node.type) {
      withWhitelistStack(
        extractIdentifiersFromType(checker.getTypeFromTypeNode(node.type), node),
        () => walk(node.type),
      );
    }
    if (node.initializer) {
      withWhitelistStack(
        extractIdentifiersFromType(checker.getTypeAtLocation(node.initializer), node),
        () => walk(node.initializer),
      );
      const sourceType = checker.getTypeAtLocation(node.initializer);
      if (node.type) {
        const targetType = checker.getTypeAtLocation(node.type);
        use(sourceType.symbol);
        linkTypes(sourceType, targetType, node.initializer);
      } else if (_.isBindingPattern(node.name)) {
        linkBindingPattern(sourceType, node.name);
      }
    }
  } else if (_.isEnumMember(node)) {
    see(node);
    walk(node.initializer);
  } else if (_.isShorthandPropertyAssignment(node)) {
    const originalSymbol = checker.getShorthandAssignmentValueSymbol(node);
    use(originalSymbol);
    see(node);
  } else if (_.isPropertyAssignment(node)) {
    node.forEachChild(walk);
  } else {
    node.forEachChild(walk);
  }
};
