export const DASHBOARD_ROOT_NODE = {
  text: 'dashboard content',
  id: 'dashboard-id',
};
export const DASHBOARD_ESCAPE_NODE = {
  text: 'dashboard-escape text',
  id: 'dashboard-escape-id',
};

export const DASHBOARD_HTML = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>dashboard app</title>
    </head>
    <body>
      <h1>dashboard</h1>
      <div id="root"></div>
      <script>
        if (typeof __GARFISH_EXPORTS__ !=='undefined') {
          __GARFISH_EXPORTS__.provider = ()=>{
            return {
              render ({ dom , basename }) {
                let newContent = document.createElement('div');
                newContent.innerHTML = "${DASHBOARD_ROOT_NODE.text}";
                newContent.setAttribute('id','${DASHBOARD_ROOT_NODE.id}')
                dom.querySelector('#root').appendChild(newContent);

                let escapeNode = document.createElement('div');
                escapeNode.innerHTML = "${DASHBOARD_ESCAPE_NODE.text}";
                escapeNode.setAttribute('id',"${DASHBOARD_ESCAPE_NODE.id}")
                document.body.appendChild(escapeNode);
              },
              destroy ({ dom , basename }){
                document.body.removeChild(document.querySelector("#${DASHBOARD_ESCAPE_NODE.id}"));
                dom.querySelector('#root').removeChild(dom.querySelector("#${DASHBOARD_ROOT_NODE.id}"));
              }
            }
          }
        }
      </script>
    </body>
  </html>
`;
