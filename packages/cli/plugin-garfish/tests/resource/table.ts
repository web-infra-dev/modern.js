export const TABLE_LIST_ROOT_NODE = {
  text: 'table-list content',
  id: 'table-list-id',
};
export const TABLE_LIST_ESCAPE_NODE = {
  text: 'table-list escape text',
  id: 'table-list-escape-id',
};
export const TABLE_LIST_HTML = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>table-list app</title>
    </head>
    <body>
      <h1>table-list</h1>
      <div id="root"></div>
      <script>
        if (typeof __GARFISH_EXPORTS__ !=='undefined') {
          __GARFISH_EXPORTS__.provider = ()=>{
            return {
              render ({ dom , basename }) {
                let newContent = document.createElement('div');
                newContent.innerHTML = "${TABLE_LIST_ROOT_NODE.text}";
                newContent.setAttribute('id','${TABLE_LIST_ROOT_NODE.id}')
                dom.querySelector('#root').appendChild(newContent);

                let escapeNode = document.createElement('div');
                escapeNode.innerHTML = "${TABLE_LIST_ESCAPE_NODE.text}";
                escapeNode.setAttribute('id',"${TABLE_LIST_ESCAPE_NODE.id}")
                document.body.appendChild(escapeNode);
              },
              destroy ({ dom , basename }){
                document.body.removeChild(document.querySelector("#${TABLE_LIST_ESCAPE_NODE.id}"));
                dom.querySelector('#root').removeChild(dom.querySelector("#${TABLE_LIST_ROOT_NODE.id}"));
              }
            }
          }
        }
      </script>
    </body>
  </html>
`;
