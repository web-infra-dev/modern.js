const navConfig = {
  type: 'array',
  items: {
    anyOf: [
      {
        type: 'object',
        properties: {
          text: {
            type: 'string',
          },
          link: {
            type: 'string',
          },
        },
        required: ['text', 'link'],
      },
      {
        type: 'object',
        properties: {
          text: {
            type: 'string',
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                },
                link: {
                  type: 'string',
                },
              },
              required: ['text', 'link'],
            },
          },
        },
        required: ['text', 'items'],
      },
    ],
  },
};

const sidebarConfig = {
  type: 'object',
  patternProperties: {
    '.*': {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                },
                link: {
                  type: 'string',
                },
              },
              required: ['text', 'link'],
            },
          },
        },
        required: ['text', 'items'],
      },
    },
  },
};

const themeConfig = {
  type: 'object',
  properties: {
    darkMode: {
      type: 'boolean',
    },
    outlineTitle: {
      type: 'string',
    },
    outline: {
      type: 'boolean',
    },
    nav: navConfig,
    sidebar: sidebarConfig,
    lastUpdatedText: {
      type: 'string',
    },
    search: {
      type: 'boolean',
    },
    backTop: {
      type: 'boolean',
    },
    prevPageText: {
      type: 'string',
    },
    nextPageText: {
      type: 'string',
    },
    socialLinks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          icon: {
            type: 'string',
          },
          link: {
            type: 'string',
          },
        },
      },
    },
    editLink: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
        },
        pattern: {
          type: 'string',
        },
      },
    },
    footer: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
      },
    },
    locales: {
      type: 'array',
    },
  },
};

export const schema = [
  {
    target: 'doc',
    schema: {
      type: 'object',
      properties: {
        base: {
          type: 'string',
        },
        icon: {
          type: 'string',
        },
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        head: {
          type: 'array',
        },
        themeConfig,
        markdown: {
          type: 'object',
        },
        route: {
          type: 'object',
        },
        plugins: {
          type: 'array',
          items: [
            {
              type: 'object',
            },
          ],
        },
      },
    },
  },
];
