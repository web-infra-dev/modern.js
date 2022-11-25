type Sign = { status: number };

const newfn = (sign: Sign) => {
  sign.status += 2;
};

export const afterMatch = newfn;

export const afterRender = newfn;
