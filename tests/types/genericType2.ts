export {};

type X = {a?: number, b?: number}; //<- b

const f = <T extends X>(t: T) => {
  return t.a;
}

f({});
