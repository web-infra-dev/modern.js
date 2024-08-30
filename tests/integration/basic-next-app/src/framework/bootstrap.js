/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// ---------------------------------------------------------
// Note: this code would usually be provided by a framework.
// ---------------------------------------------------------

import {createRoot} from 'react-dom/client';
import {ErrorBoundary} from 'react-error-boundary';
import {Router} from './router'

const root = createRoot(document.getElementById('root'));
root.render(<Root />);

function Root() {
  return (
    <ErrorBoundary FallbackComponent={Error}>
      <Router />
    </ErrorBoundary>
  );
}

function Error({error}) {
  return (
    <div>
      <h1>Application Error</h1>
      <pre style={{whiteSpace: 'pre-wrap'}}>{error.stack}</pre>
    </div>
  );
}
