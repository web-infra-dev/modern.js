// share script
export const HEAD_REG_EXP = /<head(.|\n)*>(.|\n)*<\/head>/;
export type BuildTemplateCb = (
  headTemplate: string,
) => string | Promise<string>;
export function buildTemplate(template: string, callbacks: BuildTemplateCb[]) {
  return callbacks.reduce(
    (promise, buildTemplateCb) =>
      promise.then(template => buildTemplateCb(template)),
    Promise.resolve(template),
  );
}
