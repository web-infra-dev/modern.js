import { withViewProps } from '../src/server';

describe('withViewProps', () => {
  it('reuses business data while preserving the MCP result without mutation', () => {
    const data = { message: 'Hello' };
    const original = {
      content: [{ type: 'text' as const, text: 'Hello' }],
      structuredContent: data,
      _meta: { source: 'test' },
      isError: false,
    };
    const result = withViewProps(original);
    expect(result).toEqual({ ...original, viewProps: data });
    expect(result).not.toBe(original);
    expect(result.viewProps).toBe(data);
    expect(original).not.toHaveProperty('viewProps');
  });

  it('maps props without modifying business data', () => {
    const data = { orders: [{ id: '1' }], total: 1 };
    const result = withViewProps({ structuredContent: data }, value => ({
      items: value.orders,
      totalCount: value.total,
    }));
    expect(result.structuredContent).toBe(data);
    expect(result.viewProps).toEqual({ items: data.orders, totalCount: 1 });
  });

  it('propagates mapping failures', () => {
    const error = new Error('Mapping failed');
    expect(() =>
      withViewProps({ structuredContent: {} }, () => {
        throw error;
      }),
    ).toThrow(error);
  });
});
