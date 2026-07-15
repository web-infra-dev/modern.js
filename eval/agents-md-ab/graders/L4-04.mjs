// L4-04 (answer_keywords, gap/stress task): plugin object fields — all four
// required: required / registryHooks / pre / post. registryHooks' unusual
// spelling separates doc-readers from fabricators (registerHooks = 0).
import { detectAbstention } from './_l4-abstain.mjs';

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
  c.abstained = detectAbstention(t, []);
  c.add(
    'required-field',
    /\brequired\b/.test(t),
    "expects the 'required' field for mandatory dependency plugins",
  );
  c.add(
    'registryHooks-field',
    /registryHooks/.test(t),
    "expects 'registryHooks' (exact spelling; 'registerHooks' is a fabrication tell)",
  );
  c.add('pre-field', /\bpre\b/.test(t), "expects the 'pre' ordering field");
  c.add('post-field', /\bpost\b/.test(t), "expects the 'post' ordering field");
}
