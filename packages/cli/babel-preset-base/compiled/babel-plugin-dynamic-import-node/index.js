(()=>{"use strict";var e={314:(e,r,t)=>{Object.defineProperty(r,"__esModule",{value:true});r["default"]=function(e){var r=(0,n.createDynamicImportTransform)(e);return{manipulateOptions:function(){function manipulateOptions(e,r){r.plugins.push("dynamicImport")}return manipulateOptions}(),visitor:{Import:function(){function Import(e){r(this,e)}return Import}()}}};var n=t(925);e.exports=r["default"]},925:(e,r)=>{Object.defineProperty(r,"__esModule",{value:true});var t=function(){function sliceIterator(e,r){var t=[];var n=true;var a=false;var i=undefined;try{for(var o=e[Symbol.iterator](),u;!(n=(u=o.next()).done);n=true){t.push(u.value);if(r&&t.length===r)break}}catch(e){a=true;i=e}finally{try{if(!n&&o["return"])o["return"]()}finally{if(a)throw i}}return t}return function(e,r){if(Array.isArray(e)){return e}else if(Symbol.iterator in Object(e)){return sliceIterator(e,r)}else{throw new TypeError("Invalid attempt to destructure non-iterable instance")}}}();r.getImportSource=getImportSource;r.createDynamicImportTransform=createDynamicImportTransform;function getImportSource(e,r){var n=r.arguments;var a=t(n,1),i=a[0];var o=e.isStringLiteral(i)||e.isTemplateLiteral(i);if(o){e.removeComments(i);return i}return e.templateLiteral([e.templateElement({raw:"",cooked:""}),e.templateElement({raw:"",cooked:""},true)],n)}function createDynamicImportTransform(e){var r=e.template,t=e.types;var n={static:{interop:r("Promise.resolve().then(() => INTEROP(require(SOURCE)))"),noInterop:r("Promise.resolve().then(() => require(SOURCE))")},dynamic:{interop:r("Promise.resolve(SOURCE).then(s => INTEROP(require(s)))"),noInterop:r("Promise.resolve(SOURCE).then(s => require(s))")}};var a=typeof WeakSet==="function"&&new WeakSet;var i=function isString(e){return t.isStringLiteral(e)||t.isTemplateLiteral(e)&&e.expressions.length===0};return function(e,r){if(a){if(a.has(r)){return}a.add(r)}var o=getImportSource(t,r.parent);var u=i(o)?n["static"]:n.dynamic;var p=e.opts.noInterop?u.noInterop({SOURCE:o}):u.interop({SOURCE:o,INTEROP:e.addHelper("interopRequireWildcard")});r.parentPath.replaceWith(p)}}}};var r={};function __nccwpck_require__(t){var n=r[t];if(n!==undefined){return n.exports}var a=r[t]={exports:{}};var i=true;try{e[t](a,a.exports,__nccwpck_require__);i=false}finally{if(i)delete r[t]}return a.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var t=__nccwpck_require__(314);module.exports=t})();