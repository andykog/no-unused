export {};

const data = () => ({
  a: {aa: 1, $bb: 2}, //<- $bb
  $b: 2, //<- $b
});

type SelectorParams = {
  a: {aa: number; $cc?: 2}; //<- $cc
  $c?: 2; //<- $c
};
type Return = {
  aa: number;
  $r?: number; //<- $r
};
function selector(props: SelectorParams): Return {
  return false || props.a
};

selector(data()).aa;
