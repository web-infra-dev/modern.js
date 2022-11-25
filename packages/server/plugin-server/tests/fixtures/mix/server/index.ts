type Sign = { status: number };

const fn = (sign: Sign) => {
  sign.status += 1;
};

const newfn = (sign: Sign) => {
  sign.status += 2;
};

export const afterMatch = newfn;

export const afterRender = newfn;

export const middleware = [newfn, newfn];

export default ({ addMiddleware, afterMatch, afterRender }: any) => {
  addMiddleware(fn);

  afterMatch(fn);

  afterRender(fn);
};
