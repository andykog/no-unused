export {};

abstract class Superclass {
  // static Static = 1;
  abstract supermethod(): void; //<- supermethod
  supermethod2() {} //<- supermethod2
  supermethod3() {}
}

class Class extends Superclass {
  // static Static = 2;
  a = 1;
  b = 2; //<- b
  method1() {}
  method2() {return this.a} //<- method2
  supermethod() {}
  override supermethod2() {}
}

new Class().method1();
new Class().supermethod3();
