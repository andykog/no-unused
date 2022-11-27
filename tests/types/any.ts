export {};

const x: any = {a: 1};

const s: {b: any; c: any} = {b: {bb: 1}, c: [{cc: 2}]};

const data = {a: 1};

console.log(data);

s.b;
s.c;
x;

declare const anyFunction: any;

anyFunction({a: 1});
