// This will be injected by Vite/Rollup
declare let API_URL: string;

/**
 * On Codesphere the frontend and the WebSocket backend are served from the same
 * origin and port, so the URL can be derived at runtime. `API_URL` still
 * overrides this at build time (e.g. when running the frontend separately).
 */
const sameOriginWebSocketUrl = () =>
  typeof location === 'undefined'
    ? ''
    : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;

export const WEBSOCKET_URL = API_URL || sameOriginWebSocketUrl();
