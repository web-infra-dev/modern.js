(()=>{var e={867:e=>{const r={width:"px",height:"px","device-width":"px","device-height":"px","aspect-ratio":"","device-aspect-ratio":"",color:"","color-index":"",monochrome:"",resolution:"dpi"};const t=Object.keys(r);const s=.001;const a={">":1,"<":-1};const n={">":"min","<":"max"};function create_query(e,t,i,o){return o.replace(/([-\d\.]+)(.*)/,(function(o,c,p){const u=parseFloat(c);if(parseFloat(c)||i){if(!i){if(p==="px"&&u===parseInt(c,10)){c=u+a[t]}else{c=Number(Math.round(parseFloat(c)+s*a[t]+"e6")+"e-6")}}}else{c=a[t]+r[e]}return"("+n[t]+"-"+e+": "+c+p+")"}))}function transform(e){if(!e.params.includes("<")&&!e.params.includes(">")){return}e.params=e.params.replace(/\(\s*([a-z-]+?)\s*([<>])(=?)\s*((?:-?\d*\.?(?:\s*\/?\s*)?\d+[a-z]*)?)\s*\)/gi,(function(e,r,s,a,n){if(t.indexOf(r)>-1){return create_query(r,s,a,n)}return e}));e.params=e.params.replace(/\(\s*((?:-?\d*\.?(?:\s*\/?\s*)?\d+[a-z]*)?)\s*(<|>)(=?)\s*([a-z-]+)\s*(<|>)(=?)\s*((?:-?\d*\.?(?:\s*\/?\s*)?\d+[a-z]*)?)\s*\)/gi,(function(e,r,s,a,n,i,o,c){if(t.indexOf(n)>-1){if(s==="<"&&i==="<"||s===">"&&i===">"){const e=s==="<"?r:c;const t=s==="<"?c:r;let i=a;let p=o;if(s===">"){i=o;p=a}return create_query(n,">",i,e)+" and "+create_query(n,"<",p,t)}}return e}))}e.exports=()=>({postcssPlugin:"postcss-media-minmax",AtRule:{media:e=>{transform(e)},"custom-media":e=>{transform(e)}}});e.exports.postcss=true}};var r={};function __nccwpck_require__(t){var s=r[t];if(s!==undefined){return s.exports}var a=r[t]={exports:{}};var n=true;try{e[t](a,a.exports,__nccwpck_require__);n=false}finally{if(n)delete r[t]}return a.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var t=__nccwpck_require__(867);module.exports=t})();