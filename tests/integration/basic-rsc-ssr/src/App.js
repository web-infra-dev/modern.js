/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Suspense } from 'react';

import Show from './components/server/Show';
import Footer from './components/server/Footer';
import Header from './components/server/Header';

export default function App({ selectedId, isEditing, searchText }) {
  return (
    <div className="main">
      <Header />
      <Suspense fallback={<div>Loading...</div>}>
        <Show />
      </Suspense>
      <Footer />
    </div>
  );
}
