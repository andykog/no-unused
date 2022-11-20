export{};

interface X {
  a: number,
  b: number, //<- b
}

declare const x: X

x.a;
