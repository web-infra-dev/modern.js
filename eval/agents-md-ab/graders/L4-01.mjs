// L4-01 (answer_keywords, gap/stress task): CLI plugin custom command —
// accuracy=1 only with api.addCommand AND the commander `program` object
// (example with program.command). abstained reported independently.
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
  c.abstained = detectAbstention(t, ['addCommand']);
  c.add(
    'api-addCommand',
    ctx.positively(t, /api\.addCommand/),
    'expects api.addCommand in setup(api), asserted positively (quoting it only to deny it does not count)',
  );
  c.add(
    'commander-program',
    ctx.positively(t, /\bprogram\b/),
    'expects the commander `program` object (program.command example)',
  );
}
