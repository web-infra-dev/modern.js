/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import {useState, useTransition} from 'react';
import {useRouter} from './framework/router';

import Spinner from './Spinner';

export default function SearchField() {
  const [text, setText] = useState('');
  const [isSearching, startSearching] = useTransition();
  const {navigate} = useRouter();
  return (
    <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
      <label className="offscreen" htmlFor="sidebar-search-input">
        Search for a note by title
      </label>
      <input
        id="sidebar-search-input"
        placeholder="Search"
        value={text}
        onChange={(e) => {
          const newText = e.target.value;
          setText(newText);
          startSearching(() => {
            navigate({
              searchText: newText,
            });
          });
        }}
      />
      <Spinner active={isSearching} />
    </form>
  );
}
