export {};

const f = <T>(t: T) => {
  const x: {} extends T ? {a?: string; $u?: string} : {} = {}; //<- $u
  const s: {} extends T ? {a?: string} : {b?: string} = x; //<- a

  if ('b' in s) {
    return s.b;
  } else {
    return t;
  }
};

console.log(f);
