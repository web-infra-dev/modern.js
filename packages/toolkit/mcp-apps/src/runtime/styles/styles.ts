export function injectGlobalStyles() {
  const globalStyle = document.createElement('style');
  globalStyle.textContent = `
    body, html {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto;
      overflow: visible !important;
    }
    * {
      box-sizing: border-box;
    }

    /* Main container */
    .mf-main {
      position: relative;
      width: 100%;
    }

    /* Fullscreen mode */
    .mf-main.fullscreen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #fff;
      overflow-y: auto;
      overflow-x: hidden;
      /* Gentle bloom-in: content scales up from 98% and fades in */
      animation: mf-fullscreen-enter 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }

    @keyframes mf-fullscreen-enter {
      from {
        opacity: 0.5;
        transform: scale(0.98);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* In fullscreen, prevent body from adding scroll space */
    body.mf-fullscreen {
      overflow: hidden;
    }

    /* Toolbar - visible on hover only, positioned relative to .mf-main */
    .mf-toolbar {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 100;
      opacity: 0;
      transition: opacity 0.35s ease;
      display: flex;
      gap: 8px;
      pointer-events: none;
    }

    .mf-main:hover .mf-toolbar {
      opacity: 1;
    }

    /* Auto-flash toolbar when entering fullscreen so user sees the collapse button */
    .mf-main.fullscreen .mf-toolbar {
      animation: mf-toolbar-flash 1.8s ease forwards;
    }

    @keyframes mf-toolbar-flash {
      0%   { opacity: 1; }
      60%  { opacity: 1; }
      100% { opacity: 0; }
    }

    /* Keep it visible again on hover even after flash fades */
    .mf-main.fullscreen:hover .mf-toolbar {
      opacity: 1;
      animation: none;
    }

    /* Tool button — matches excalidraw-mcp-vecel .app-button exactly */
    .mf-tool-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      width: 28px;
      padding: 0;
      color: rgba(0, 0, 0, 0.45);
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      pointer-events: auto;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .mf-tool-btn:hover {
      color: rgba(0, 0, 0, 0.65);
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }

    /* Loading spinner animation */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `;
  document.head.appendChild(globalStyle);
}
