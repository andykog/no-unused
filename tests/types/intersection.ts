export {};

const s = {
  a: {} as {aa: 1} & {bb: 1, $cc: 1}, //<- $cc
};

const x: {
  a: { aa: number; $aa?: number; } & { bb: number; $bb?: number; }; //<- $aa, $bb
} = s;

x.a.aa;
x.a.bb;
