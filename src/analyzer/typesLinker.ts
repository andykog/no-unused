import ts from 'typescript';
import * as _ from 'tsutils';
import {checker, use, see} from './state';

const getTypeId = (type?: ts.Type) => type?.symbol?.declarations?.[0] ?? type;

const forEachConditionalBranch = (type: ts.ConditionalType, cb: (t: ts.Type) => void) => {
  // make sure truetype is resolved https://github.com/microsoft/TypeScript/issues/45537
  if (!type.resolvedTrueType) {
    checker.typeToTypeNode(type, undefined, undefined);
  }
  cb(type.resolvedTrueType!);
  cb(type.resolvedFalseType!);
};

const forEachTypeConstituent = (type: ts.Type, cb: (t: ts.Type) => void) => {
  if (!type) return;
  if (_.isConditionalType(type)) {
    forEachConditionalBranch(type, (t) => forEachTypeConstituent(t, cb));
  } else if (_.isUnionOrIntersectionType(type)) {
    type.types.forEach((t) => forEachTypeConstituent(t, cb));
  } else {
    cb(type);
  }
};

const forEachTypeArgument = (type: ts.Type, cb: (t: ts.Type, i: number) => void) => {
  if (_.isTypeReference(type)) {
    checker.getTypeArguments(type).forEach(cb);
  }
};

const forEachPropertyInType = (
  type: ts.Type,
  location: ts.Node,
  cb: (t: ts.Type, s: ts.Symbol) => void,
) => {
  type.getProperties().forEach((s) => {
    const t = checker.getTypeOfSymbolAtLocation(s, location);
    cb(t, s);
  });
};

const forEachReturnType = (type: ts.Type, cb: (t: ts.Type) => void) => {
  type.getCallSignatures().forEach((sig) => {
    const returnType = checker.getReturnTypeOfSignature(sig);
    if (returnType) cb(returnType);
  });
};

const forEachTypeParameters = (type: ts.Type, location: ts.Node, cb: (t: ts.Type[]) => void) => {
  type.getCallSignatures().forEach((sig) => {
    const parametersTypes = sig.parameters.map((s) =>
      checker.getTypeOfSymbolAtLocation(s, location),
    );
    cb(parametersTypes);
  });
};

const findEachNestedType = (
  type: ts.Type,
  location: ts.Node,
  cb: (t: ts.Type, s?: ts.Symbol) => void,
  seen = new Set<any>(),
) => {
  if (!type) return;
  if (seen.has(getTypeId(type))) return;
  seen.add(getTypeId(type));
  forEachTypeConstituent(type, (type) => {
    forEachTypeArgument(type, (t) => findEachNestedType(t, location, cb, seen));
    forEachPropertyInType(type, location, (t, s) => {
      cb(t, s);
      findEachNestedType(t, location, cb, seen);
    });
    forEachReturnType(type, (t) => findEachNestedType(t, location, cb, seen));
    forEachTypeParameters(type, location, (paramsTypes) => {
      paramsTypes.forEach((t) => findEachNestedType(t, location, cb, seen));
    });
  });
};

export const findEachSymbolInType = (
  type: ts.Type,
  location: ts.Node,
  cb: (s: ts.Symbol) => void,
) => {
  findEachNestedType(type, location, (t, s) => {
    const symbol = s ?? t.symbol;
    if (symbol) cb(symbol);
  });
};

const _extractIdentifiersFromTypeCache = new WeakMap<ts.Type, Set<ts.Identifier>>();

export const extractIdentifiersFromType = (type: ts.Type, location: ts.Node) => {
  if (_extractIdentifiersFromTypeCache.has(type)) return _extractIdentifiersFromTypeCache.get(type);
  const extracted = new Set<ts.Identifier>();
  findEachSymbolInType(type, location, (s) =>
    s?.declarations?.forEach((d: any) => d.name && extracted.add(d.name)),
  );
  _extractIdentifiersFromTypeCache.set(type, extracted);
  return extracted;
};

export const linkTypes = (
  sourceType: ts.Type,
  targetType: ts.Type,
  location: ts.Node,
  seen = new WeakMap<any, WeakSet<any>>(),
) => {
  if (!sourceType) return;
  if (sourceType === targetType) return;
  if (seen.get(getTypeId(sourceType))?.has(getTypeId(targetType))) return;
  if (!seen.has(getTypeId(sourceType))) seen.set(getTypeId(sourceType), new WeakSet());
  seen.get(getTypeId(sourceType))!.add(getTypeId(targetType));

  if (targetType.flags & ts.TypeFlags.Any) {
    findEachSymbolInType(sourceType, location, use);
    return;
  }

  forEachTypeConstituent(sourceType, (sourceType) => {
    forEachTypeConstituent(targetType, (targetType) => {
      forEachTypeArgument(sourceType, (sourcePType, i) => {
        const targetPType = _.isTypeReference(targetType)
          ? targetType.typeArguments?.[i]
          : undefined;
        if (targetPType) {
          use(sourcePType.symbol);
          linkTypes(sourcePType, targetPType, location, seen);
        }
      });

      forEachPropertyInType(sourceType, location, (sourcePType, sourcePSymbol) => {
        const targetPSymbol = targetType.getProperty(sourcePSymbol.name);
        if (sourcePSymbol?.declarations?.[0] === targetPSymbol?.declarations?.[0]) {
          // May be inherited property, ignore it
          return;
        }
        const targetPType = targetPSymbol
          ? checker.getTypeOfSymbolAtLocation(targetPSymbol, location)
          : undefined;
        if (targetPType) {
          use(sourcePSymbol);
          linkTypes(sourcePType, targetPType, location, seen);
        }
      });

      forEachReturnType(sourceType, (sourceReturnType) => {
        forEachReturnType(targetType, (targetReturnType) => {
          linkTypes(sourceReturnType, targetReturnType, location, seen);
        });
      });

      forEachTypeParameters(sourceType, location, (souceParams) => {
        forEachTypeParameters(targetType, location, (targetParams) => {
          souceParams.forEach((sourcePType, i) => {
            const targetPType = targetParams[i];
            if (targetPType === sourcePType) {
              findEachSymbolInType(targetPType, location, use);
              return;
            }
            // Parameters are in contravariant position, so source & target are flipped
            linkTypes(targetPType, sourcePType, location, seen);
          });
        });
      });
    });
  });
};
