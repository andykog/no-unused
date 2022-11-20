export {};

const s: {
  aa: number;
  $bb?: number; //<- $bb
  $xx?: number; //<- $xx
}[] = [{
  aa: 1,
  $bb: 1,
}, {
  aa: 2,
  $bb: 2,
}];

const x: {
  aa: number; //<- aa
  cc?: number;
}[] = s;

x[0].cc;

