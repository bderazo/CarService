const PROXY_CONFIG = {
  "/api": {
    "target": "https://localhost:44326",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "headers": {
      "Connection": "Keep-Alive"
    }
  },
  "/connect": {
    "target": "https://localhost:44326",
    "secure": false,
    "changeOrigin": true
  },
  "/AbpServiceProxies": {
    "target": "https://localhost:44326",
    "secure": false,
    "changeOrigin": true
  },
  "/AbpApplicationConfiguration": {
    "target": "https://localhost:44326",
    "secure": false,
    "changeOrigin": true
  }
};

module.exports = PROXY_CONFIG;