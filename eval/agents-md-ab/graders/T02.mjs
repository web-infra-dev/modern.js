// T02 (L0/qa, answer_keywords): answer must contain a usable dev command.
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
  c.add(
    'dev-command',
    /(pnpm\s+(run\s+)?dev|npm\s+run\s+dev|yarn\s+(run\s+)?dev|modern\s+dev)/.test(
      a.text,
    ),
    'expects pnpm dev / npm run dev / yarn dev / modern dev',
  );
}
