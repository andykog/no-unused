export {};

const s = {
  a: {
    aa: 1,
    $bb: 1, //<- $bb
  },
};

const x: {
  a: {
    aa: number;
    $cc?: number; //<- $cc
  };
  $u?: number; //<- $u
} = s;

x.a.aa;
