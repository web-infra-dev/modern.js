// T05 (L1/qa, answer_keywords): Data Loader convention — same-named .data
// file, in the routes directory next to the route component, exporting loader.
export default async function grade(ctx, c) {
  const a = ctx.answer();
  if (
    !c.add(
      'answer-present',
      !!a,
      a ? `source=${a.source}` : 'no ANSWER.md nor .final-answer.txt',
    )
  )
    return;
  const t = a.text;
  c.add(
    'data-file-naming',
    /page\.data|\.data\.(ts|tsx|js)/.test(t),
    'expects same-named .data file (e.g. page.data.ts)',
  );
  c.add(
    'location-routes-dir',
    /routes/.test(t),
    'expects location: routes directory, next to the route component',
  );
  c.add(
    'exports-loader',
    /loader/i.test(t),
    'expects: export a loader function',
  );
}
