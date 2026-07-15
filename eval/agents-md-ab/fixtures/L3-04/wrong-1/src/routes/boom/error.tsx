import React from 'react';

class BoomErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  componentDidCatch(error: Error) {
    this.setState({ error });
  }

  render() {
    if (this.state.error) return <div>error: {this.state.error.message}</div>;
    return this.props.children;
  }
}

export default BoomErrorBoundary;
