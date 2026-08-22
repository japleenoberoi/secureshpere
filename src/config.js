const apiBaseMeta = document.querySelector('meta[name="orbitjobs-api-base"]');

export const APP_CONFIG = Object.freeze({
  apiBaseUrl: (apiBaseMeta?.content || '/api').replace(/\/$/, ''),
});
