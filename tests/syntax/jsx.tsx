export {};

const Component = (props: {a: 1, b: 2}) => <div>{props.a}</div>; //<- b

<Component a={1} b={2} />;
