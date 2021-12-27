import { render } from '@modern-js/runtime/testing';
import { Foo } from '.';

describe('test comp', () => {
  it('should get text', () => {
    const results = render(<Foo />);
    expect(results.getByText('foo')).toBeInTheDocument();
  });
});
