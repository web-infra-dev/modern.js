export const BASENAME_ROOT_NODE = {
  id: 'basename-test-root-id',
};

export const BASENAME_HTML = `
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
                newContent.innerHTML = "sub-app basename: " + basename;
                newContent.setAttribute('id','${BASENAME_ROOT_NODE.id}')
                dom.querySelector('#root').appendChild(newContent);
              },
              destroy ({ dom , basename }){
                dom.querySelector('#root').removeChild(dom.querySelector("#${BASENAME_ROOT_NODE.id}"));
              }
            }
          }
        }
      </script>
    </body>
  </html>
`;
