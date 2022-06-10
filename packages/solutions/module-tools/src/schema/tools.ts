export const toolsSchema = [
  {
    target: 'tools.speedy',
    schema: {
      if: {
        instanceof: 'Function'
      },
      else: {
        type: 'object',
      },
    },
  },
];
