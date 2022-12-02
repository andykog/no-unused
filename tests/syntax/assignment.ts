export {};

var z: {a: number; [k: string]: number} = {a: 1};

z = {a: 2, $b: 2}; //<- $b

z.a;
z.b;

var u: {a: number; [k: string]: number} = {a: 1}; //<- k

u.a;
