// L0-03 (answer_keywords, strict instruction following): the WHOLE answer,
// trimmed, must JSON.parse to exactly {"scripts":["build","dev","lint","serve"]}.
// Markdown fences or extra prose → parse failure → 0.
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
  let obj;
  try {
    obj = JSON.parse(a.text.trim());
  } catch {
    c.add(
      'parses-as-json',
      false,
      `answer is not a bare JSON object (fences/extra text?): ${a.text.trim().slice(0, 80)}`,
    );
    return;
  }
  c.add('parses-as-json', true);
  const want = ['build', 'dev', 'lint', 'serve'];
  const got = obj && Array.isArray(obj.scripts) ? obj.scripts : null;
  c.add(
    'scripts-exact',
    got &&
      Object.keys(obj).length === 1 &&
      got.length === 4 &&
      want.every((k, i) => got[i] === k),
    `expected {"scripts":${JSON.stringify(want)}}, got ${JSON.stringify(obj).slice(0, 120)}`,
  );
}
