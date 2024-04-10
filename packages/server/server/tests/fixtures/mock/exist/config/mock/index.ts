export default {
  'GET /api/getInfo': { data: [1, 2, 3, 4] },

  '/api/getExample': { id: 1 },

  'GET /api/addInfo': (req: any, res: any) => {
    setTimeout(() => {
      res.end('delay 2000ms');
    }, 2000);
  },
};
