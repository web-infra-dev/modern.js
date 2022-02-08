export const USER_INFO_ROOT_NODE = {
  text: 'userInfo content',
  id: 'userInfo-id',
};
export const USER_INFO_ESCAPE_NODE = {
  text: 'userInfo-escape text',
  id: 'userInfo-escape-id',
};

export const USER_INFO_HTML = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>userInfo app</title>
    </head>
    <body>
      <h1>userInfo</h1>
      <div id="root"></div>
      <script>
        if (typeof __GARFISH_EXPORTS__ !=='undefined') {
          __GARFISH_EXPORTS__.provider = ()=>{
            return {
              render ({ dom , basename }) {
                let newContent = document.createElement('div');
                newContent.innerHTML = "${USER_INFO_ROOT_NODE.text}";
                newContent.setAttribute('id','${USER_INFO_ROOT_NODE.id}')
                dom.querySelector('#root').appendChild(newContent);

                let escapeNode = document.createElement('div');
                escapeNode.innerHTML = "${USER_INFO_ESCAPE_NODE.text}";
                escapeNode.setAttribute('id',"${USER_INFO_ESCAPE_NODE.id}")
                document.body.appendChild(escapeNode);
              },
              destroy ({ dom , basename }){
                document.body.removeChild(document.querySelector("#${USER_INFO_ESCAPE_NODE.id}"));
                dom.querySelector('#root').removeChild(dom.querySelector("#${USER_INFO_ROOT_NODE.id}"));
              }
            }
          }
        }
      </script>
    </body>
  </html>
`;
