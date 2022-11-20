export {};

const x = {a: {aa: [{aaa: 1, bbb: 2}]}, b: 2, c: 3}; //<- bbb, c

const {a: {aa: [{aaa}]}} = x; //<- aaa

const func = ({b}: {b: number}) => b;

func(x);
