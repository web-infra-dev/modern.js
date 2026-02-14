'use client';

import 'client-only';
import './initRemoteServerCallback';
import { useState } from 'react';

export default function RemoteClientBadge({
  initialLabel,
}: {
  initialLabel: string;
}) {
  const [label, setLabel] = useState(initialLabel);

  return (
    <div className="remote-client-badge">
      <p className="remote-client-badge-value">{label}</p>
      <button
        className="remote-client-badge-toggle"
        onClick={() => setLabel('remote-client-badge-toggled')}
      >
        Toggle Badge
      </button>
    </div>
  );
}
