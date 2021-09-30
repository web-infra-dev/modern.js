export const mergeExtension = (users: any[], plugins: any[]) => {
  const output: any[] = [];
  return { middleware: output.concat(users).concat(plugins) };
};

export const toMessage = (dig: string, e: Error | string): string => {
  const message = e instanceof Error ? e.message : e;
  if (message) {
    return `${dig}: ${message}`;
  } else {
    return dig;
  }
};

export const noop = () => {
  // noop
};

export const createErrorDocument = (status: number, text: string) => {
  const title = `${status}: ${text}`;
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>${title}</title>
    <style>
      html,body {
        margin: 0;
      }

      .page-container {
        color: #000;
        background: #fff;
        height: 100vh;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="page-container">
    <h1>${status}</h1>
    <div>${text}</div>
  </body>
  </html>
  `;
};
