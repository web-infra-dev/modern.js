// L4-03 (answer_keywords, gap/stress task): server plugin api.onReset
// event.type values — accuracy=1 only when both 'repack' and 'file-change'
// are named.
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
  c.abstained = detectAbstention(t, ['onReset']);
  c.add(
    'repack',
    ctx.positively(t, /\brepack\b/),
    "expects the 'repack' event type asserted positively",
  );
  c.add(
    'file-change',
    ctx.positively(t, /file-change/),
    "expects the 'file-change' event type asserted positively",
  );
}
