export {};

const Class = class {
  a = 1;
  b = 2; //<- b
  method1() {}
  method2() {return this.a} //<- method2
}

new Class().method1();
