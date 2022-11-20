export {};

type I = {c: number}; //<- c

const Class = class implements I {
  a = 1;
  c = 1;
  b = 2; //<- b
  method1() {}
  method2() {return this.a} //<- method2
}

new Class().method1();
