(()=>{var t={939:(t,e,r)=>{const n=r(83);const i=r(28);const o=r(729);const a={rootValue:16,unitPrecision:5,selectorBlackList:[],propList:["font","font-size","line-height","letter-spacing"],replace:true,mediaQuery:false,minPixelValue:0,exclude:null};const s={root_value:"rootValue",unit_precision:"unitPrecision",selector_black_list:"selectorBlackList",prop_white_list:"propList",media_query:"mediaQuery",propWhiteList:"propList"};function convertLegacyOptions(t){if(typeof t!=="object")return;if((typeof t["prop_white_list"]!=="undefined"&&t["prop_white_list"].length===0||typeof t.propWhiteList!=="undefined"&&t.propWhiteList.length===0)&&typeof t.propList==="undefined"){t.propList=["*"];delete t["prop_white_list"];delete t.propWhiteList}Object.keys(s).forEach((e=>{if(Reflect.has(t,e)){t[s[e]]=t[e];delete t[e]}}))}function createPxReplace(t,e,r){return(n,i)=>{if(!i)return n;const o=parseFloat(i);if(o<r)return n;const a=toFixed(o/t,e);return a===0?"0":a+"rem"}}function toFixed(t,e){const r=Math.pow(10,e+1),n=Math.floor(t*r);return Math.round(n/10)*10/r}function declarationExists(t,e,r){return t.some((t=>t.prop===e&&t.value===r))}function blacklistedSelector(t,e){if(typeof e!=="string")return;return t.some((t=>{if(typeof t==="string"){return e.indexOf(t)!==-1}return e.match(t)}))}function createPropListMatcher(t){const e=t.indexOf("*")>-1;const r=e&&t.length===1;const n={exact:i.exact(t),contain:i.contain(t),startWith:i.startWith(t),endWith:i.endWith(t),notExact:i.notExact(t),notContain:i.notContain(t),notStartWith:i.notStartWith(t),notEndWith:i.notEndWith(t)};return t=>{if(r)return true;return(e||n.exact.indexOf(t)>-1||n.contain.some((function(e){return t.indexOf(e)>-1}))||n.startWith.some((function(e){return t.indexOf(e)===0}))||n.endWith.some((function(e){return t.indexOf(e)===t.length-e.length})))&&!(n.notExact.indexOf(t)>-1||n.notContain.some((function(e){return t.indexOf(e)>-1}))||n.notStartWith.some((function(e){return t.indexOf(e)===0}))||n.notEndWith.some((function(e){return t.indexOf(e)===t.length-e.length})))}}t.exports=(t={})=>{convertLegacyOptions(t);const e=Object.assign({},a,t);const r=createPropListMatcher(e.propList);const i=e.exclude;let s=false;let c;return{postcssPlugin:"postcss-pxtorem",Once(t){const r=t.source.input.file;if(i&&(o.isFunction(i)&&i(r)||o.isString(i)&&r.indexOf(i)!==-1||r.match(i)!==null)){s=true}else{s=false}const n=typeof e.rootValue==="function"?e.rootValue(t.source.input):e.rootValue;c=createPxReplace(n,e.unitPrecision,e.minPixelValue)},Declaration(t){if(s)return;if(t.value.indexOf("px")===-1||!r(t.prop)||blacklistedSelector(e.selectorBlackList,t.parent.selector))return;const i=t.value.replace(n,c);if(declarationExists(t.parent,t.prop,i))return;if(e.replace){t.value=i}else{t.cloneAfter({value:i})}},AtRule(t){if(s)return;if(e.mediaQuery&&t.name==="media"){if(t.params.indexOf("px")===-1)return;t.params=t.params.replace(n,c)}}}};t.exports.postcss=true},28:t=>{t.exports={exact:t=>t.filter((t=>t.match(/^[^*!]+$/))),contain:t=>t.filter((t=>t.match(/^\*.+\*$/))).map((t=>t.substr(1,t.length-2))),endWith:t=>t.filter((t=>t.match(/^\*[^*]+$/))).map((t=>t.substr(1))),startWith:t=>t.filter((t=>t.match(/^[^*!]+\*$/))).map((t=>t.substr(0,t.length-1))),notExact:t=>t.filter((t=>t.match(/^![^*].*$/))).map((t=>t.substr(1))),notContain:t=>t.filter((t=>t.match(/^!\*.+\*$/))).map((t=>t.substr(2,t.length-3))),notEndWith:t=>t.filter((t=>t.match(/^!\*[^*]+$/))).map((t=>t.substr(2))),notStartWith:t=>t.filter((t=>t.match(/^![^*]+\*$/))).map((t=>t.substr(1,t.length-2)))}},83:t=>{t.exports=/"[^"]+"|'[^']+'|url\([^)]+\)|var\([^)]+\)|(\d*\.?\d+)px/g},729:t=>{const type=t=>Object.prototype.toString.call(t).slice(8,-1).toLowerCase();const e=["String","Array","Undefined","Boolean","Number","Function","Symbol","Object"];t.exports=e.reduce(((t,e)=>{t["is"+e]=t=>type(t)===e.toLowerCase();return t}),{})}};var e={};function __nccwpck_require__(r){var n=e[r];if(n!==undefined){return n.exports}var i=e[r]={exports:{}};var o=true;try{t[r](i,i.exports,__nccwpck_require__);o=false}finally{if(o)delete e[r]}return i.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var r=__nccwpck_require__(939);module.exports=r})();