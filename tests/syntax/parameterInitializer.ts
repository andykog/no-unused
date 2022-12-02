export {};

const f = (
  {a, b}: {a: number; b: number} = { //<- b
    a: 1,
    b: 1,
  },
) => ({a});

console.log(f().a);
