/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import {useTransition} from 'react';
import {useRouter} from './framework/router';

export default function EditButton({noteId, children}) {
  const [isPending, startTransition] = useTransition();
  const {navigate} = useRouter();
  const isDraft = noteId == null;
  return (
    <button
      className={[
        'edit-button',
        isDraft ? 'edit-button--solid' : 'edit-button--outline',
      ].join(' ')}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          navigate({
            selectedId: noteId,
            isEditing: true,
          });
        });
      }}
      role="menuitem">
      {children}
    </button>
  );
}
