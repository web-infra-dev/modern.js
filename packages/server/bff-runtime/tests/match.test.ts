import assert from 'assert';
import { baseMatch } from '../src/match';
import { match, isHandler, isSchemaHandler, Any } from '../src/index';

describe('match', () => {
  it('should work well', async () => {
    const foo = baseMatch(
      {
        request: { data: { foo: Number } },
        response: { foo: String },
      },
      input => ({ foo: String(input.data.foo) }),
    );

    const result = await foo({ data: { foo: 0 } });

    expect(result.type).toBe('HandleSuccess');
    assert(result.type === 'HandleSuccess');
    expect(result.value.foo).toBe('0');
  });

  it('should support all file in request', async () => {
    const foo = baseMatch(
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

    expect(result.type).toBe('HandleSuccess');
    assert(result.type === 'HandleSuccess');
    expect(result.value.foo).toBe('0');
  });

  it('should support body,formData,formUrlencoded when data is not exist', () => {
    const foo = baseMatch(
      {
        request: {},
        response: Any,
      },
      input => input,
    );
    foo({ body: 'test' });
    foo({ formData: { foo: 'test' } as any });
    foo({ formUrlencoded: { foo: 'test' } });
  });

  it('should fail when input does not match schema', async () => {
    const foo = baseMatch(
      {
        request: { data: { foo: Number } },
        response: { foo: String },
      },
      input => ({ foo: String(input.data.foo) }),
    );

    const result = await foo({ data: { foo: true as any } });

    expect(result.type).toBe('InputValidationError');
    assert(result.type === 'InputValidationError');
    expect(result.message).toBe('path: ["data","foo"]\ntrue is not a number');
  });

  it('should fail when output does not match schema', async () => {
    const foo = baseMatch(
      {
        request: { data: { foo: Number } },
        response: { foo: String },
      },
      input => ({ foo: input.data.foo } as any),
    );

    const result = await foo({ data: { foo: 0 } });

    expect(result.type).toBe('OutputValidationError');
    assert(result.type === 'OutputValidationError');
    expect(result.message).toBe('path: ["foo"]\n0 is not a string');
  });

  it('should type nest', async () => {
    const getFoo = (input: { foo: string }) => input;

    const foo = match(
      {
        request: { data: { foo: Number } },
        response: { foo: String },
      },
      input => ({ foo: input.data.foo } as any),
    );

    const result = await foo({ data: { foo: 0 } });

    getFoo(result);
  });

  it('isSchemaHandler', () => {
    const foo = baseMatch(
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(isHandler(() => {})).toBeTruthy();
    expect(isHandler({})).toBeFalsy();
    expect(isHandler('test')).toBeFalsy();
    expect(isHandler(null)).toBeFalsy();
  });
});
