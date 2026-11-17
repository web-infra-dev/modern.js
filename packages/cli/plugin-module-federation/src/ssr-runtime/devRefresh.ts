/** Private same-document transport. Remotes never replace the page owner's endpoint. */
export const DEV_SSR_CHECK_PATH = '/__modern_mf_dev/ssr/check';
export const DEV_SSR_REFRESH_KEY = '__MODERN_MF_DEV_SSR_REFRESH__';

export function devSSRRefreshScript(paths = [DEV_SSR_CHECK_PATH]) {
  const endpoints = JSON.stringify(
    [...paths].sort((a, b) => b.length - a.length),
  ).replace(/</g, '\\u003c');
  const key = JSON.stringify(DEV_SSR_REFRESH_KEY);
  return `<script>window[${key}]=function(){var paths=${endpoints};var endpoint=paths.find(function(p){var base=p.slice(0,-${DEV_SSR_CHECK_PATH.length});return !base||location.pathname===base||location.pathname.indexOf(base+"/")===0})||paths[0];return fetch(endpoint,{method:"POST",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("MF SSR update failed: "+r.status)})};if(!window[${key}+"Listening"]){window[${key}+"Listening"]=true;window.addEventListener("mf:hmr-check",function(){window[${key}]().catch(function(e){console.error("[MF SSR]",e)})})}</script>`;
}
