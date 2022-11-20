export {};

const s = {
  a: {} as {aa: 1; $cc: 1} | {bb: 1}, //<- $cc
};

const x: {
  a: {aa: number; $aa?: number} | {bb: number; $bb?: number}; //<- $aa, $bb
} = s;

if ('aa' in x.a) {
  x.a.aa;
} else {
  x.a.bb;
}
