type Sign = { status: number };

const fn = (sign: Sign) => {
  sign.status += 1;
};

export default ({ addMiddleware, afterMatch, afterRender }: any) => {
  addMiddleware(fn);

  afterMatch(fn);

  afterRender(fn);
};
