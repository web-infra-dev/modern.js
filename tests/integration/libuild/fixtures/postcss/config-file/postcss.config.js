module.exports = {
  plugins: [
    {
      // Modified from: https://github.com/talgautb/postcss-currency/blob/master/index.js
      postcssPlugin: 'postcss-currency',
      Declaration(decl) {
        const currencyDB = {
          USD: '$',
          KZT: '₸',
          JPY: '¥',
        };
        let quote = decl.value.match(/'|"/);
        const value = decl.value.replace(/["']+/g, '').toUpperCase();

        quote = quote ? quote[0] : '';

        if (Object.prototype.hasOwnProperty.call(currencyDB, value)) {
          decl.value = quote + currencyDB[value] + quote;
        }
      },
    },
  ],
};
