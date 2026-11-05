import type { AppShellRuntimeConfig } from './types';

/**
 * Inline scripts shipped with the shell. They run before the app bundle, so they are
 * plain ES2017 strings rather than compiled modules: no helpers, no optional chaining.
 */

/** Runs in <head> before the stylesheets: decides whether the shell applies to this URL. */
export const createGateScript = (config: AppShellRuntimeConfig): string =>
  `(function(){var c=${serializeConfig(config)};var p=location.pathname,a=!c.routes;` +
  `if(c.routes){var q=p.length>1?p.replace(/\\/+$/,''):p;for(var i=0;i<c.routes.length;i++){var r=c.routes[i];` +
  `if(r.exact!=null?(r.exact.length>1?r.exact.replace(/\\/+$/,''):r.exact)===q:new RegExp(r.pattern,r.flags).test(p)){a=true;break}}}` +
  `window.__MODERN_APP_SHELL__={config:c,active:a,start:Date.now()};` +
  `document.documentElement.setAttribute(a?'data-app-shell':'data-app-shell-off','')})();`;

/**
 * Runs right after the deferred stylesheet links. On pages without a shell the links
 * are switched back immediately; with a shell they apply once loaded.
 */
export const LINK_SCRIPT =
  `(function(){var s=window.__MODERN_APP_SHELL__;` +
  `var ls=document.querySelectorAll('link[data-app-shell-defer]');` +
  `for(var i=0;i<ls.length;i++){(function(l){var on=function(){l.media=l.getAttribute('data-app-shell-defer')||'all';l.removeAttribute('data-app-shell-defer');` +
  `if(s&&s.check)s.check()};` +
  `if(!s||!s.active||l.sheet){on();return}l.addEventListener('load',on);l.addEventListener('error',on)})(ls[i])}})();`;

/** Runs right after the shell markup: early input capture, ready detection, replay, removal. */
export const RUNTIME_SCRIPT = `(function(){
var s=window.__MODERN_APP_SHELL__;if(!s)return;var c=s.config;
var shell=document.getElementById(c.id);if(!shell)return;
var html=document.documentElement;
if(!s.active){shell.parentNode.removeChild(shell);html.removeAttribute('data-app-shell-off');return}
var input=c.input?shell.querySelector(c.input.shell):null;var composing=false,done=false,scheduled=false;
if(input){
input.addEventListener('compositionstart',function(){composing=true});
input.addEventListener('compositionend',function(){composing=false;check()});
input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault()}});
if(c.input.autofocus){try{input.focus({preventScroll:true})}catch(e){}}
}
function visible(el){var r=el.getBoundingClientRect();return r.width>0&&r.height>0}
function find(root,sel){var els=root.querySelectorAll(sel);for(var i=0;i<els.length;i++){if(visible(els[i]))return els[i]}return null}
function stylesReady(){return !document.querySelector('link[data-app-shell-defer]')}
function appReady(root){if(!c.readySelector)return !!root.firstElementChild;return !!find(root,c.readySelector)}
function editable(el){if(el.matches('textarea,input,[contenteditable=""],[contenteditable="true"]'))return el;return el.querySelector('textarea,input,[contenteditable=""],[contenteditable="true"]')}
function textOf(t){return 'value' in t?t.value:(t.innerText||'')}
function insert(t,v){
try{t.focus({preventScroll:true})}catch(e){t.focus()}
if(!v)return;
if(t.setSelectionRange){var n=t.value.length;try{t.setSelectionRange(n,n)}catch(e){}}
else{var r=document.createRange();r.selectNodeContents(t);r.collapse(false);var g=window.getSelection();g.removeAllRanges();g.addRange(r)}
var ok=false;try{ok=document.execCommand('insertText',false,v)}catch(e){}
if(!ok&&'value' in t){var d=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(t),'value');if(d&&d.set){d.set.call(t,t.value+v)}else{t.value+=v}t.dispatchEvent(new Event('input',{bubbles:true}))}}
function target(root){var sel=c.input.target||c.readySelector;var t=sel?find(root,sel):null;return t&&editable(t)}
function replay(root){
if(!input)return;var v=input.value;var focused=document.activeElement===input;if(!v&&!focused)return;
var t=target(root);if(!t)return;insert(t,v);s.replayed=v.length;if(v)settle(root,v)}
/* Apps often re-mount or reset their input right after the first render; re-apply the
   replayed text while it is missing, until the user interacts or the window ends.
   A controlled input can be reset through its value property, which no observer sees,
   so the text is also checked once per frame. */
function settle(root,v){
var stop=false,until=Date.now()+c.input.settle;var end=function(){stop=true;document.removeEventListener('keydown',end,true);document.removeEventListener('pointerdown',end,true);document.removeEventListener('compositionstart',end,true);if(mo)mo.disconnect()};
document.addEventListener('keydown',end,true);document.addEventListener('pointerdown',end,true);document.addEventListener('compositionstart',end,true);
var pending=false;var fix=function(){pending=false;if(stop)return;if(Date.now()>until){end();return}var t=target(root);if(t&&textOf(t).indexOf(v)===-1){insert(t,v);s.reapplied=(s.reapplied||0)+1}};
var mo=window.MutationObserver?new MutationObserver(function(){if(!pending){pending=true;requestAnimationFrame(fix)}}):null;
if(mo)mo.observe(root,{childList:true,subtree:true,characterData:true,attributes:true});
var poll=function(){if(stop)return;fix();if(!stop)requestAnimationFrame(poll)};requestAnimationFrame(poll)}
function remove(reason){
if(done)return;done=true;if(observer)observer.disconnect();
var root=document.getElementById(c.mountId);if(root&&reason==='ready')replay(root);
if(shell.parentNode)shell.parentNode.removeChild(shell);html.removeAttribute('data-app-shell');s.removed=reason;
try{performance.mark('app-shell-removed')}catch(e){}
try{window.dispatchEvent(new CustomEvent('modern-app-shell:removed',{detail:{reason:reason}}))}catch(e){}}
/* Apps often reset their input once more while mounting (e.g. a controlled value set in an
   effect). Remove the shell only after the app has stayed ready for readyHold ms, so the
   replay lands after that reset; until then the user keeps typing into the shell. */
var readySince=0;
function run(){scheduled=false;if(done||composing)return;var root=document.getElementById(c.mountId);if(!(root&&stylesReady()&&appReady(root))){readySince=0;return}var now=Date.now();if(!readySince)readySince=now;var left=c.readyHold-(now-readySince);if(left<=0){remove('ready');return}setTimeout(check,left)}
function check(){if(done||scheduled)return;scheduled=true;requestAnimationFrame(run)}
s.check=check;s.remove=remove;
var observer=null;var root=document.getElementById(c.mountId);
if(root&&window.MutationObserver){observer=new MutationObserver(check);observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden']})}
var wait=c.timeout-(Date.now()-s.start);setTimeout(function(){remove('timeout')},wait>0?wait:0);
check();
})();`.replace(/\n/g, '');

export const serializeConfig = (config: AppShellRuntimeConfig): string =>
  JSON.stringify(config)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
