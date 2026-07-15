// L1-08 (answer_keywords): custom env vars need the MODERN_ prefix.
// Rules: answer must contain MODERN_; wrong prefixes as the only answer fail
// automatically (MODERN_ absent). globalVars/define mentions are fine extras.
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
    'modern-prefix',
    /MODERN_/.test(a.text),
    'expects the MODERN_ prefix (REACT_APP_/VITE_/NEXT_PUBLIC_ are wrong for Modern.js)',
  );
}
