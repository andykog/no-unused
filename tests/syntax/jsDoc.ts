export {};

const fun = ({a}: {a: number}) => ({a});

/** @public */
const e = () => ({a: 1, fun})

const data = {
  /** @public */
  a: 1,
  b: 2, //<- b
};

data;
