import { get } from 'lodash';
import './override';

class Person {
  // eslint-disable-next-line @typescript-eslint/no-parameter-properties
  constructor(public name: string, public age: number) {}
}

class Student extends Person {
  school: string;

  id: number = 1;

  constructor(name: string, age: number, school: string) {
    super(name, age);
    this.school = school;
  }
}

const student = new Student('xxx', 10, 'yyy');

(window as any).student = student;

console.log(get);
console.log(student.id);
