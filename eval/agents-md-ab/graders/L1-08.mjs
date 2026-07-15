// L1-08 (answer_keywords): custom env vars need the MODERN_ prefix.
// Rules: the answer must assert MODERN_ positively (quoting it only inside a
// negation — "不要用 MODERN_，应该用 REACT_APP_" — fails); recommending a
// wrong prefix (REACT_APP_/VITE_/NEXT_PUBLIC_) as the one to use fails.
// globalVars/define mentions are fine extras.
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
    ctx.positively(a.text, /MODERN_/),
    'expects the MODERN_ prefix asserted positively (mentioning it only to negate it does not count)',
  );
  c.add(
    'no-wrong-prefix-recommended',
    !ctx.recommendsWithoutNegation(
      a.text,
      /(应该?用|应使用|要用|请用|改用|换成|使用|\buse\b)[^\n]{0,12}(REACT_APP_|VITE_|NEXT_PUBLIC_)/i,
      /(不要|不能|别用|错误|而不是|不适用|不是|wrong|not|don'?t)/i,
    ),
    'recommends a wrong prefix (REACT_APP_/VITE_/NEXT_PUBLIC_) as the one to use',
  );
}
