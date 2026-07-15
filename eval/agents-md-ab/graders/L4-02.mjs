// L4-02 (answer_keywords, gap/stress task): runtime plugin global Provider —
// accuracy=1 only with api.wrapRoot AND the props pass-through caveat.
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
  c.abstained = detectAbstention(t, ['wrapRoot']);
  c.add(
    'api-wrapRoot',
    ctx.positively(t, /api\.wrapRoot/),
    'expects api.wrapRoot asserted positively',
  );
  c.add(
    'props-passthrough-caveat',
    /props/.test(t) &&
      /(透传|传递|传给|pass(ing|ed)?( through| along| down)?|spread|\.\.\.\s*props)/i.test(
        t,
      ),
    'expects the caveat: the wrapper MUST pass props through to the original component',
  );
}
