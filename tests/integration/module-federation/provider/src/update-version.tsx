// A real producer source edit drives the development refresh tests.
const developmentRevision = 'initial';

export function UpdateVersion() {
  return (
    <small data-testid="update-version">
      {`${process.env.MF_LAB_VERSION || 'v1'}:${developmentRevision}`}
    </small>
  );
}
