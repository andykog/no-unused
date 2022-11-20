export {};

const s = [{
  aa: 1,
  $bb: 1, //<- $bb
}, {
  aa: 2,
  $bb: 2,
}];

const x: {
  aa: number;
  $cc?: number; //<- $cc
}[] = s;

x[0].aa;
