/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import {useState, useTransition} from 'react';
import {useRouter, useMutation} from './framework/router';

import NotePreview from './NotePreview';

export default function NoteEditor({noteId, initialTitle, initialBody}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const {location} = useRouter();
  const [isNavigating, startNavigating] = useTransition();
  const [isSaving, saveNote] = useMutation({
    endpoint: noteId !== null ? `/notes/${noteId}` : `/notes`,
    method: noteId !== null ? 'PUT' : 'POST',
  });
  const [isDeleting, deleteNote] = useMutation({
    endpoint: `/notes/${noteId}`,
    method: 'DELETE',
  });

  async function handleSave() {
    const payload = {title, body};
    const requestedLocation = {
      selectedId: noteId,
      isEditing: false,
      searchText: location.searchText,
    };
    await saveNote(payload, requestedLocation);
  }

  async function handleDelete() {
    const payload = {};
    const requestedLocation = {
      selectedId: null,
      isEditing: false,
      searchText: location.searchText,
    };
    await deleteNote(payload, requestedLocation);
  }

  const isDraft = noteId === null;
  return (
    <div className="note-editor">
      <form
        className="note-editor-form"
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}>
        <label className="offscreen" htmlFor="note-title-input">
          Enter a title for your note
        </label>
        <input
          id="note-title-input"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
        />
        <label className="offscreen" htmlFor="note-body-input">
          Enter the body for your note
        </label>
        <textarea
          id="note-body-input"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
          }}
        />
      </form>
      <div className="note-editor-preview">
        <div className="note-editor-menu" role="menubar">
          <button
            className="note-editor-done"
            disabled={isSaving || isNavigating}
            onClick={() => handleSave()}
            role="menuitem">
            <img
              src="checkmark.svg"
              width="14px"
              height="10px"
              alt=""
              role="presentation"
            />
            Done
          </button>
          {!isDraft && (
            <button
              className="note-editor-delete"
              disabled={isDeleting || isNavigating}
              onClick={() => handleDelete()}
              role="menuitem">
              <img
                src="cross.svg"
                width="10px"
                height="10px"
                alt=""
                role="presentation"
              />
              Delete
            </button>
          )}
        </div>
        <div className="label label--preview" role="status">
          Preview
        </div>
        <h1 className="note-title">{title}</h1>
        <NotePreview title={title} body={body} />
      </div>
    </div>
  );
}
