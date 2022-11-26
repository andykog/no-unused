export const c = {a: 1};

export const a = (_props: {a: number}) => ({b: 1});

export interface I {
  a: number;
}

export type T = {a: number};

const local = () => ({a: 1}); //<- a
local;

export function f(_props: {a: number}) {
  return {b: 1};
}

export class C {
  a = 1;
}
