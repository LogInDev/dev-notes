// src/util/detectEnv.js
export function detectSource() {
  const ua = (navigator.userAgent || '').toLowerCase();

  const isCefSharp = typeof window.cefSharp !== 'undefined' || ua.includes('cefsharp');
  const isElectron = ua.includes('electron');
  const isAndroidWebView = ua.includes('wv') || ua.includes('version/') && ua.includes('android');
  const isIOSWebView =
    !!(window.webkit && window.webkit.messageHandlers) || // WKWebView bridge
    /\(ip.+; cpu (?:iphone )?os \d+_\d+/i.test(navigator.userAgent) && !/safari/i.test(navigator.userAgent);
  const isRNWebView = typeof window.ReactNativeWebView !== 'undefined';
  const isEdgeWebView2 = !!(window.chrome && window.chrome.webview);

  const isAnyWebView =
    isCefSharp || isElectron || isAndroidWebView || isIOSWebView || isRNWebView || isEdgeWebView2;

  return {
    isAnyWebView,
    vendor: isCefSharp ? 'cefsharp'
      : isEdgeWebView2 ? 'webview2'
      : isRNWebView ? 'react-native'
      : isAndroidWebView ? 'android-webview'
      : isIOSWebView ? 'ios-webview'
      : isElectron ? 'electron'
      : 'browser'
  };
}