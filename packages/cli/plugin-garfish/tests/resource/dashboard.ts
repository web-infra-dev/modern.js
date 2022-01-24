export const vueAppRootNode = 'app';
export const DashBoardRootNode = {
  text: 'dashboard content',
  id: 'dashboard-id',
};
export const DashBoardEscapeNode = {
  text: 'escape text',
  id: 'escape-id',
};
export const DashBoardHTML = `
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
                newContent.innerHTML = "${DashBoardRootNode.text}";
                newContent.setAttribute('id','${DashBoardRootNode.id}')
                dom.querySelector('#root').appendChild(newContent);

                let escapeNode = document.createElement('div');
                escapeNode.innerHTML = "${DashBoardEscapeNode.text}";
                escapeNode.setAttribute('id',"${DashBoardEscapeNode.id}")
                document.body.appendChild(escapeNode);
              },
              destroy ({ dom , basename }){
                document.body.removeChild(document.querySelector("#${DashBoardEscapeNode.id}"));
                dom.querySelector('#root').removeChild(dom.querySelector("${DashBoardRootNode.id}"));
              }
            }
          }
        }
      </script>
    </body>
  </html>
`;
