const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para evitar CORS en desarrollo
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://api-financial-news.onrender.com',
      changeOrigin: true,
      secure: false,
      headers: {
        'Origin': 'https://app-financial-news.onrender.com'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying request to:', proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
      }
    })
  );
};