import React from 'react';
import { Button } from 'antd';

function classDecorator<T extends {new(...args:any[]):{}}>(constructor:T) {
  return class extends constructor {
      newProperty = "new property";
      hello = "override";
  }
}

@classDecorator
export class Greeter {
  property = "property";
  hello: string;
  constructor(m: string) {
      this.hello = m;
  }
}

export const value = <h1><Button></Button></h1>;

