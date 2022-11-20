export {};

declare const s: [{
  aa: 1,
  $bb: 1, //<- $bb
}];

const x: [{
  aa: number; //<- aa
  cc?: number;
}] = s;

x[0].cc;
