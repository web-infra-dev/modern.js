import { Any, isHandler, isSchemaHandler, match } from '../src';

describe('match', () => {
  it('should work well', async () => {
    const foo = match(
      {
        request: { data: { foo: Number } },
        response: { foo: String },
      },
      input => ({ foo: String(input.data.foo) }),
    );

    const result = await foo({ data: { foo: 0 } });

    expect(result).toEqual({ type: 'HandleSuccess', value: { foo: '0' } });
  });

  it('should support all file in request', async () => {
    const foo = match(
      {
        request: {
          data: { foo: Number },
          params: { id: String },
          query: { key: String },
          headers: { 'Context-Length': String },
          cookies: { sid: String },
        },
        response: { foo: String },
      },
      input => ({ foo: String(input.data.foo) }),
    );

    const result = await foo({
      data: { foo: 0 },
      params: { id: 'foo' },
      query: { key: 'foo' },
      headers: { 'Context-Length': '100' },
      cookies: { sid: 'sid0' },
    });

    expect(result).toEqual({ type: 'HandleSuccess', value: { foo: '0' } });
  });

  it('should support body,formData,formUrlencoded when data is not exist', async () => {
    const foo = match(
      {
        request: {},
        response: Any,
      },
      input => input,
    );
    for (const input of [
      { body: 'test' },
      { formData: { foo: 'test' } as any },
      { formUrlencoded: { foo: 'test' } },
    ]) {
      expect(await foo(input)).toEqual({ type: 'HandleSuccess', value: input });
    }
  });

  it('should fail when input does not match schema', async () => {
    const foo = match(
      {
        request: { data: { foo: Number } },
        response: { foo: String },
      },
      input => ({ foo: String(input.data.foo) }),
    );

    const result = await foo({ data: { foo: true as any } });

    expect(result).toEqual({
      type: 'InputValidationError',
      message: 'path: ["data","foo"]\ntrue is not a number',
    });
  });

  it('should fail when output does not match schema', async () => {
    const foo = match(
      {
        request: { data: { foo: Number } },
        response: { foo: String },
      },
      input => ({ foo: input.data.foo }) as any,
    );

    const result = await foo({ data: { foo: 0 } });

    expect(result).toEqual({
      type: 'OutputValidationError',
      message: 'path: ["foo"]\n0 is not a string',
    });
  });

  it('should type nest', async () => {
    const getFoo = (input: { foo: string }) => input;

    const foo = match(
      {
        request: { data: { foo: Number } },
        response: { foo: String },
      },
      input => ({ foo: input.data.foo }) as any,
    );

    const result = await foo({ data: { foo: 0 } });

    getFoo(result);
  });

  it('isSchemaHandler', () => {
    const foo = match(
      {
        request: { data: { foo: Number } },
        response: { foo: String },
      },
      input => ({ foo: String(input.data.foo) }),
    );

    expect(isSchemaHandler(foo)).toBeTruthy();
    expect(isSchemaHandler({})).toBeFalsy();
    expect(isSchemaHandler('test')).toBeFalsy();
    expect(isSchemaHandler(null)).toBeFalsy();
  });

  it('isHandler', () => {
    expect(isHandler(() => {})).toBeTruthy();
    expect(isHandler({})).toBeFalsy();
    expect(isHandler('test')).toBeFalsy();
    expect(isHandler(null)).toBeFalsy();
  });
});
