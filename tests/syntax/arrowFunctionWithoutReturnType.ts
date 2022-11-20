export {};

const data = () => ({
  a: {aa: 1, $bb: 2}, //<- $bb
  $b: 2, //<- $b
});

type SelectorParams = {
  a: {aa: number; $cc?: 2}; //<- $cc
  $c?: 2; //<- $c
};
const selector = (props: SelectorParams) => false || props.a;

selector(data()).aa;
