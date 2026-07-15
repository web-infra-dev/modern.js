// L2-04 (answer_keywords): three deploy questions, all must hit:
// (1) modern deploy; (2) MODERNJS_DEPLOY=netlify with modern deploy;
// (3) default root dist + JS under static/js.
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
    'modern-deploy',
    ctx.positively(t, /modern deploy/),
    'expects `modern deploy` for deployable output (asserted positively)',
  );
  c.add(
    'netlify-env',
    ctx.positively(t, /MODERNJS_DEPLOY=netlify/) &&
      ctx.positively(t, /modern deploy/),
    'expects MODERNJS_DEPLOY=netlify modern deploy',
  );
  c.add(
    'default-output-dirs',
    ctx.positively(t, /\bdist\b/) && ctx.positively(t, /static\/js/),
    'expects default root `dist` and JS under `static/js`',
  );
}
