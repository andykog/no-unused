export {};

type Obj = {
  a: {
    aa: number;
    $cc?: number; //<- $cc
  };
  $u?: number; //<- $u
};

declare const s: Obj;

const x: Obj = s;

x.a.aa;
