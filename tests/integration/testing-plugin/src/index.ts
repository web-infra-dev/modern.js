function seal(constructor: unknown) {
  Object.seal(constructor);
}

@seal
export class DummyClass {
  public method() {
    // Method implementation
  }
}
