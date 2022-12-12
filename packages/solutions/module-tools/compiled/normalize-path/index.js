(()=>{var e={498:e=>{
/*!
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
e.exports=function(e,r){if(typeof e!=="string"){throw new TypeError("expected path to be a string")}if(e==="\\"||e==="/")return"/";var t=e.length;if(t<=1)return e;var _="";if(t>4&&e[3]==="\\"){var i=e[2];if((i==="?"||i===".")&&e.slice(0,2)==="\\\\"){e=e.slice(2);_="//"}}var a=e.split(/[/\\]+/);if(r!==false&&a[a.length-1]===""){a.pop()}return _+a.join("/")}}};var r={};function __nccwpck_require__(t){var _=r[t];if(_!==undefined){return _.exports}var i=r[t]={exports:{}};var a=true;try{e[t](i,i.exports,__nccwpck_require__);a=false}finally{if(a)delete r[t]}return i.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var t=__nccwpck_require__(498);module.exports=t})();