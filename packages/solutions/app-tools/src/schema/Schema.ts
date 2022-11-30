import { merge } from '@modern-js/utils/lodash';

export type ValidateSchema = {
  target: string;
  schema: any;
};

export class Schema extends Map<string, any> {
  private schema: Record<string, any>;

  constructor(baseSchema: Record<string, any> = {}) {
    super();
    this.schema = baseSchema;
  }

  setSchema(key: string, object: Record<string, any>): this {
    Object.entries(object).forEach(([k, v]) => {
      const target = `${key}.${k}`;
      this.set(target, v);
    });
    return this;
  }

  set(key: string, value: any): this {
    if (this.has(key)) {
      merge(this.schema[key], value);
    } else {
      this.schema[key] = value;
    }
    return this;
  }

  has(key: string): boolean {
    return key in this.schema;
  }

  get(key: string) {
    return this.schema[key];
  }

  delete(key: string): boolean {
    return delete this.schema[key];
  }

  generate(): ValidateSchema[] {
    return Object.entries(this.schema).map(([target, schema]) => ({
      target,
      schema,
    }));
  }
}
