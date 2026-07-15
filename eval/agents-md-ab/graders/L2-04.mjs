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
    /modern deploy/.test(t),
    'expects `modern deploy` for deployable output',
  );
  c.add(
    'netlify-env',
    /MODERNJS_DEPLOY=netlify/.test(t) && /modern deploy/.test(t),
    'expects MODERNJS_DEPLOY=netlify modern deploy',
  );
  c.add(
    'default-output-dirs',
    /\bdist\b/.test(t) && /static\/js/.test(t),
    'expects default root `dist` and JS under `static/js`',
  );
}
