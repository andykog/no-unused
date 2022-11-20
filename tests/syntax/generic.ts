export {};

const data = {a: 1, $a: 2}; //<- $a

const g = <T extends {a: number}>(t: T) => t.a;

g(data)
