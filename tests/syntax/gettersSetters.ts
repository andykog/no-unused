export {};

const x = {
  a: 1,
  b: 2,
  c: 3, //<- c
  get aGetter() { return x.a; },
  set bSetter(val: number) { x.b = val; }, //<- bSetter
};

console.log(x.aGetter);
