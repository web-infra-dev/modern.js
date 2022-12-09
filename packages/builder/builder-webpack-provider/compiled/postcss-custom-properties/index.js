(()=>{var e={549:e=>{function webpackEmptyContext(e){var t=new Error("Cannot find module '"+e+"'");t.code="MODULE_NOT_FOUND";throw t}webpackEmptyContext.keys=()=>[];webpackEmptyContext.resolve=webpackEmptyContext;webpackEmptyContext.id=549;e.exports=webpackEmptyContext},36:e=>{"use strict";e.exports=require("../postcss-value-parser")},147:e=>{"use strict";e.exports=require("fs")},17:e=>{"use strict";e.exports=require("path")},977:e=>{"use strict";e.exports=require("postcss")},310:e=>{"use strict";e.exports=require("url")},480:(e,t,r)=>{"use strict";var o=r(36),s=r(17),a=r(310),c=r(977),p=r(147);function n(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}function i(e){if(e&&e.__esModule)return e;var t=Object.create(null);return e&&Object.keys(e).forEach((function(r){if("default"!==r){var o=Object.getOwnPropertyDescriptor(e,r);Object.defineProperty(t,r,o.get?o:{enumerable:!0,get:function(){return e[r]}})}})),t.default=e,Object.freeze(t)}var f=n(o),b=n(s);function u(e){const t=e.selector?e:e.parent;return/(!\s*)?postcss-custom-properties:\s*off\b/i.test(t.toString())}function l(e,t){const r=new Map,o=new Map,s=new Map;e.nodes.slice().forEach((e=>{const s=m(e)?r:w(e)?o:null;s&&(e.nodes.slice().forEach((e=>{if(e.variable&&!u(e)){const{prop:r}=e;s.set(r,f.default(e.value)),t.preserve||e.remove()}})),t.preserve||!d(e)||u(e)||e.remove())}));for(const[e,t]of r.entries())s.set(e,t);for(const[e,t]of o.entries())s.set(e,t);return s}const _=/^html$/i,x=/^:root$/i,m=e=>"rule"===e.type&&e.selector.split(",").some((e=>_.test(e)))&&Object(e.nodes).length,w=e=>"rule"===e.type&&e.selector.split(",").some((e=>x.test(e)))&&Object(e.nodes).length,d=e=>0===Object(e.nodes).length;function v(e){const t=new Map;if("customProperties"in e)for(const[r,o]of Object.entries(e.customProperties))t.set(r,f.default(o.toString()));if("custom-properties"in e)for(const[r,o]of Object.entries(e["custom-properties"]))t.set(r,f.default(o.toString()));return t}async function y(e){let t;try{t=await(o=e,Promise.resolve().then((function(){return i(r(549)(o))})))}catch(o){t=await function(e){return Promise.resolve().then((function(){return i(r(549)(e))}))}(a.pathToFileURL(e).href)}var o;return v("default"in t?t.default:t)}async function h(e){const t=(await Promise.all(e.map((async e=>{if(e instanceof Promise?e=await e:e instanceof Function&&(e=await e()),"string"==typeof e){const t=b.default.resolve(e);return{type:b.default.extname(t).slice(1).toLowerCase(),from:t}}if("customProperties"in e&&Object(e.customProperties)===e.customProperties)return e;if("custom-properties"in e&&Object(e["custom-properties"])===e["custom-properties"])return e;if("from"in e){const t=b.default.resolve(e.from);let r=e.type;return r||(r=b.default.extname(t).slice(1).toLowerCase()),{type:r,from:t}}return Object.keys(e).length,null})))).filter((e=>!!e)),r=await Promise.all(t.map((async e=>{if("type"in e&&"from"in e){if("css"===e.type||"pcss"===e.type)return await async function(e){const t=await p.promises.readFile(e);return l(c.parse(t,{from:e.toString()}),{preserve:!0})}(e.from);if("js"===e.type||"cjs"===e.type)return await y(e.from);if("mjs"===e.type)return await y(e.from);if("json"===e.type)return await async function(e){return v(await g(e))}(e.from);throw new Error("Invalid source type: "+e.type)}return v(e)}))),o=new Map;return r.forEach((e=>{for(const[t,r]of e.entries())o.set(t,r)})),o}const g=async e=>JSON.parse((await p.promises.readFile(e)).toString());function j(e,t){return e.nodes&&e.nodes.length&&e.nodes.slice().forEach((r=>{if(O(r)){const[o,...s]=r.nodes.filter((e=>"div"!==e.type)),{value:a}=o,c=e.nodes.indexOf(r);if(t.has(a)){const r=t.get(a).nodes;!function(e,t,r){const o=new Map(t);o.delete(r),j(e,o)}({nodes:r},t,a),c>-1&&e.nodes.splice(c,1,...r)}else s.length&&(c>-1&&e.nodes.splice(c,1,...r.nodes.slice(r.nodes.indexOf(s[0]))),j(e,t))}else j(r,t)})),e.toString()}const k=/^var$/i,O=e=>"function"===e.type&&k.test(e.value)&&Object(e.nodes).length>0;var $=(e,t,r)=>{if(F(e)&&!function(e){const t=e.prev();return Boolean(u(e)||t&&"comment"===t.type&&/(!\s*)?postcss-custom-properties:\s*ignore\s+next\b/i.test(t.text))}(e)){const o=e.value;let s=j(f.default(o),t);const a=new Set;for(;C.test(s)&&!a.has(s);){a.add(s);s=j(f.default(s),t)}if(s!==o)if(r.preserve){const t=e.cloneBefore({value:s});S(t)&&(t.raws.value.value=t.value.replace(D,"$1"),t.raws.value.raw=t.raws.value.value+t.raws.value.raw.replace(D,"$2"))}else e.value=s,S(e)&&(e.raws.value.value=e.value.replace(D,"$1"),e.raws.value.raw=e.raws.value.value+e.raws.value.raw.replace(D,"$2"))}};const P=/^--[A-z][\w-]*$/,C=/(^|[^\w-])var\([\W\w]+\)/,F=e=>!P.test(e.prop)&&C.test(e.value),S=e=>"value"in Object(Object(e.raws).value)&&"raw"in e.raws.value&&D.test(e.raws.value.raw),D=/^([\W\w]+)(\s*\/\*[\W\w]+?\*\/)$/;async function E(e,t,r){"css"===t&&await async function(e,t){const r=`:root {\n${Object.keys(t).reduce(((e,r)=>(e.push(`\t${r}: ${t[r]};`),e)),[]).join("\n")}\n}\n`;await p.promises.writeFile(e,r)}(e,r),"scss"===t&&await async function(e,t){const r=`${Object.keys(t).reduce(((e,r)=>{const o=r.replace("--","$");return e.push(`${o}: ${t[r]};`),e}),[]).join("\n")}\n`;await p.promises.writeFile(e,r)}(e,r),"js"===t&&await async function(e,t){const r=`module.exports = {\n\tcustomProperties: {\n${Object.keys(t).reduce(((e,r)=>(e.push(`\t\t'${q(r)}': '${q(t[r])}'`),e)),[]).join(",\n")}\n\t}\n};\n`;await p.promises.writeFile(e,r)}(e,r),"json"===t&&await async function(e,t){const r=`${JSON.stringify({"custom-properties":t},null,"  ")}\n`;await p.promises.writeFile(e,r)}(e,r),"mjs"===t&&await async function(e,t){const r=`export const customProperties = {\n${Object.keys(t).reduce(((e,r)=>(e.push(`\t'${q(r)}': '${q(t[r])}'`),e)),[]).join(",\n")}\n};\n`;await p.promises.writeFile(e,r)}(e,r)}function M(e){const t={};for(const[r,o]of e.entries())t[r]=o.toString();return t}const q=e=>e.replace(/\\([\s\S])|(')/g,"\\$1$2").replace(/\n/g,"\\n").replace(/\r/g,"\\r"),N=e=>{const t=!("preserve"in Object(e))||Boolean(e.preserve),r="overrideImportFromWithRoot"in Object(e)&&Boolean(e.overrideImportFromWithRoot),o="disableDeprecationNotice"in Object(e)&&Boolean(e.disableDeprecationNotice);let s=[];Array.isArray(null==e?void 0:e.importFrom)?s=e.importFrom:null!=e&&e.importFrom&&(s=[e.importFrom]);let a=[];Array.isArray(null==e?void 0:e.exportTo)?a=e.exportTo:null!=e&&e.exportTo&&(a=[e.exportTo]);const c=h(s),p=0===s.length&&0===a.length;return{postcssPlugin:"postcss-custom-properties",prepare(){let e=new Map;return p?{Once:r=>{e=l(r,{preserve:t})},Declaration:r=>{$(r,e,{preserve:t})},OnceExit:()=>{e.clear()}}:{Once:async o=>{const s=(await c).entries(),p=l(o,{preserve:t}).entries();if(r)for(const[t,r]of[...s,...p])e.set(t,r);else for(const[t,r]of[...p,...s])e.set(t,r);await function(e,t){return Promise.all(t.map((async t=>{if(t instanceof Function)return void await t(M(e));if("string"==typeof t){const r=b.default.resolve(t),o=b.default.extname(r).slice(1).toLowerCase();return void await E(r,o,M(e))}let r={};if(r="toJSON"in t?t.toJSON(M(e)):M(e),"to"in t){const e=b.default.resolve(t.to);let o=t.type;return o||(o=b.default.extname(e).slice(1).toLowerCase()),void await E(e,o,r)}"customProperties"in t?t.customProperties=r:"custom-properties"in t&&(t["custom-properties"]=r)})))}(e,a)},Declaration:r=>{$(r,e,{preserve:t})},OnceExit:(t,{result:r})=>{!o&&(s.length>0||a.length>0)&&t.warn(r,'"importFrom" and "exportTo" will be removed in a future version of postcss-custom-properties.\nWe are looking for insights and anecdotes on how these features are used so that we can design the best alternative.\nPlease let us know if our proposal will work for you.\nVisit the discussion on github for more details. https://github.com/csstools/postcss-plugins/discussions/192'),e.clear()}}}}};N.postcss=!0,e.exports=N}};var t={};function __nccwpck_require__(r){var o=t[r];if(o!==undefined){return o.exports}var s=t[r]={exports:{}};var a=true;try{e[r](s,s.exports,__nccwpck_require__);a=false}finally{if(a)delete t[r]}return s.exports}(()=>{__nccwpck_require__.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t)})();if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var r=__nccwpck_require__(480);module.exports=r})();