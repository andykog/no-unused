export {};

const A = <T>(a: T, b: T):T => a || b;

const x = A(
  {a: 1, b: 3}, //<- b
  {a: 2, b: 3}
);

x.a;
