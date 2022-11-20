import * as ts from 'typescript';
import * as _ from 'tsutils';
import {logDebug} from '../utils/debugLog';
import {
  tc,
  usedIdentifiers,
  functionsStack,
  whitelistStack,
  withFunctionsStack,
  withWhitelistStack,
  use,
  see,
} from './state';
import {extractIdentifiersFromType, linkTypes} from './typesLinker';

const getClassType = (node: ts.ClassLikeDeclaration) => {
  const type = tc().getTypeAtLocation(node);
  if (_.isClassExpression(node)) {
    const signature = tc().getSignaturesOfType(type, ts.SignatureKind.Construct)[0];
    return signature && tc().getReturnTypeOfSignature(signature);
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
        const type = symbol && tc().getTypeOfSymbolAtLocation(symbol, node);
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
  const sourceType = tc().getTypeAtLocation(node);
  const targetType = tc().getTypeAtLocation(parentFunction.type);
  use(sourceType.symbol);
  linkTypes(sourceType, targetType, node);
};

export const walk = (node?: ts.Node) => {
  if (!node) return;

  const whitelistIdentifiers = whitelistStack.at(-1);
  if (whitelistIdentifiers) {
    const type = tc().getTypeAtLocation(node);
    const actualIdentifiers = extractIdentifiersFromType(tc().getTypeAtLocation(node), node);
    Array.from(actualIdentifiers ?? []).forEach((i) => {
      if (!whitelistIdentifiers.has(i)) {
        usedIdentifiers.add(i);
      }
    });
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
        extractIdentifiersFromType(tc().getTypeAtLocation(node.right), node),
        () => {
          walk(node.right);
        },
      );
      const sourceType = tc().getTypeAtLocation(node.right);
      const targetType = tc().getTypeAtLocation(node.left);
      use(sourceType.symbol);
      linkTypes(sourceType, targetType, node.left);
    } else {
      walk(node.right);
    }
  } else if (_.isPropertySignature(node)) {
    see(node);
    walk(node.type);
  } else if (_.isIdentifier(node)) {
    const symbol = tc().getSymbolAtLocation(node);
    symbol?.declarations?.filter(({pos}) => pos !== node.pos).forEach(use);
  } else if (_.isClassExpression(node) || _.isClassDeclaration(node)) {
    withWhitelistStack(undefined, () => {
      const sourceType = getClassType(node);
      node.heritageClauses
        ?.flatMap((clause) => clause.types)
        .forEach((n) => {
          use(sourceType.symbol);
          const targetType = tc().getTypeFromTypeNode(n) as ts.InterfaceType;
          linkTypes(sourceType, targetType, node);
        });
      node.forEachChild((child) => walk(child));
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
          linkBindingPattern(tc().getTypeFromTypeNode(p.type), p.name);
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
    use(tc().getSymbolAtLocation(node.expression));
    node.arguments.forEach((a) => walk(a));
    walk(node.expression);

    const exprType = tc().getTypeAtLocation(node.expression);

    node.arguments.forEach((argument, i) => {
      const argumentType = tc().getTypeAtLocation(argument);
      exprType.getCallSignatures().forEach((sig) => {
        use(argumentType.symbol);
        const targetPSymbol = sig.parameters[i];
        if (!targetPSymbol) return;
        const targetType = tc().getTypeOfSymbolAtLocation(targetPSymbol, argument);
        linkTypes(argumentType, targetType, argument);
      });
    });
  } else if (_.isNewExpression(node)) {
    use(tc().getSymbolAtLocation(node.expression));
    node.forEachChild((child) => walk(child));
  } else if (_.isVariableDeclaration(node) || _.isPropertyDeclaration(node)) {
    see(node);
    if (node.type) {
      withWhitelistStack(
        extractIdentifiersFromType(tc().getTypeFromTypeNode(node.type), node),
        () => walk(node.type),
      );
    }
    if (node.initializer) {
      withWhitelistStack(
        extractIdentifiersFromType(tc().getTypeAtLocation(node.initializer), node),
        () => walk(node.initializer),
      );
      const sourceType = tc().getTypeAtLocation(node.initializer);
      if (node.type) {
        const targetType = tc().getTypeAtLocation(node.type);
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
    const originalSymbol = tc().getShorthandAssignmentValueSymbol(node);
    use(originalSymbol);
    see(node);
  } else if (_.isPropertyAssignment(node)) {
    node.forEachChild((child) => walk(child));
  } else {
    node.forEachChild((child) => walk(child));
  }
};
