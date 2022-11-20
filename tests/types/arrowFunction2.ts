export {};

type F = (p: {a: number}) => ({a: number, b: number, c?: number}); //<- c

const x: F = ({a}) => ({a: a, b: 1})

x({a: 1}).a;
x({a: 1}).b;
