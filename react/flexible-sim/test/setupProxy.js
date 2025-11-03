// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/selectBizWorksSource', // 프론트에서 직접 이 경로로 요청
    createProxyMiddleware({
      target: 'http://cubestg.skhynix.com:9300', // 실제 API 서버
      changeOrigin: true,
      secure: false,
      logLevel: 'error',

      // 서버가 Access-Control-Allow-Origin 헤더를 안 내려주는 경우 강제 추가
      onProxyRes(proxyRes) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      },
    })
  );
};

$.ajax({
  url: '/selectBizWorksSource?552', // 프록시 경로만!
  type: 'POST',
  contentType: 'application/json; charset=utf-8',
  data: JSON.stringify({ key: 'value' }), // 백엔드에서 요구하는 body 형식
  dataType: 'json', // 응답이 JSON이라면
  success: function (res) {
    console.log('✅ 성공:', res);
  },
  error: function (xhr, status, err) {
    console.error('❌ 에러:', status, err);
    console.log('응답:', xhr.responseText);
  },
});