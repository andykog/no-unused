export {};

const s = {
  a: {
    aa: {} as Recursive,
    $bb: 1, //<- $bb
  },
};

type Recursive = {
  a: {
    aa: Recursive;
    $cc?: number; //<- $cc
  };
  $u?: number; //<- $u
}

const x: Recursive = s;

x.a.aa;
