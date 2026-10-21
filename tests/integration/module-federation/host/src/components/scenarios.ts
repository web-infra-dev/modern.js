export const scenarios = {
  static: {
    title: 'Across the boundary.',
    description:
      'A component built by another Modern application, rendered on the server and ready to interact.',
    kind: 'Server rendering',
    path: 'Modern provider',
  },
  dynamic: {
    title: 'Connect on demand.',
    description:
      'A remote registered at runtime. A library build joins the same server-rendered experience.',
    kind: 'Dynamic remote',
    path: 'Rslib provider',
  },
  nested: {
    title: 'One more connection.',
    description:
      'The host loads a remote that loads another remote. Every boundary remains a real, independent build.',
    kind: 'Nested rendering',
    path: 'Nested → Modern',
  },
  'dynamic-nested': {
    title: 'Follow the signal.',
    description:
      'A dynamically loaded relay connects to a dynamically registered library remote.',
    kind: 'Dynamic nesting',
    path: 'Nested → Rslib',
  },
  data: {
    title: 'Data makes the journey.',
    description:
      'The remote weather station fetches its data on the server. The first HTML response already carries the forecast.',
    kind: 'Server data',
    path: 'Modern provider → Data',
  },
  csr: {
    title: 'Arrive, then fetch.',
    description:
      'The component renders in the browser while the host retrieves its data from the library’s server bundle.',
    kind: 'Client rendering',
    path: 'Rslib provider → Host server',
  },
  recovery: {
    title: 'Keep the connection.',
    description:
      'Intentional server failures exercise both recovery paths: a client data loader and a retry through the host.',
    kind: 'Data recovery',
    path: 'Server → Recovery',
  },
  lifecycle: {
    title: 'Render. Repeat. Remount.',
    description:
      'Compare a parent rerender with a fresh remote mount. Watch the actual data-loader request count.',
    kind: 'Data lifecycle',
    path: 'Rslib provider → Data',
  },
  replace: {
    title: 'A change in the forecast.',
    description:
      'The same weather station, a new remote build. Switch from clear skies at 24° to rain at 16° without reloading the page.',
    kind: 'Remote replacement',
    path: 'Version one → Version two',
  },
} as const;
export type ScenarioName = keyof typeof scenarios;
