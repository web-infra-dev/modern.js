// NodeNext-style `.js` specifier backed by `user.ts`.
import { getUser } from '../service/user.js';

enum Color {
  Red,
  Blue,
}

class Service {
  constructor(private name: string) {}
  get() {
    return this.name;
  }
}

export const get = async () => ({
  result: `${Color.Blue}-${new Service('svc').get()}-${getUser().name}`,
});
