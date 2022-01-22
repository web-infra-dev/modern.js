export const vueAppRootNode = 'app';
export const vueAppRenderNode = 'hello-world';
export const TableListHTML = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>vue sub app</title>
    </head>
    <body>
      <div id="app"></div>
      <script>
        if (__GARFISH_EXPORTS__) {
          __GARFISH_EXPORTS__.provider = ()=>{
            return {
              render ({ dom , basename }) {
                let newContent = document.createElement('div');
                newContent.setAttribute('id','${vueAppRenderNode}')
                dom.querySelector('#app').appendChild(newContent);
              },
              destroy ({ dom , basename }){
                dom.querySelector('#app').removeChild(dom.querySelector('#hello-world'));
              }
            }
          }
        }
      </script>
    </body>
  </html>
`;
