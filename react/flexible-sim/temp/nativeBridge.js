// src/util/nativeBridge.js
const hasCef = () =>
  typeof window !== 'undefined' &&
  window.CefSharp &&
  typeof window.CefSharp.BindObjectAsync === 'function';

const hasExternalCallback = () =>
  typeof window !== 'undefined' &&
  window.external &&
  'CallbackWindow' in window.external;

/**
 * 네이티브(CEF/IE ActiveX)로 문자열 커맨드 전달
 * - CefSharp(우선) → window.external(대체) → 없으면 noop
 */
export async function sendNativeCommand(commandString) {
  // 1) CefSharp
  if (hasCef()) {
    try {
      if (!window.cefSharpAPI) {
        await window.CefSharp.BindObjectAsync('cefSharpAPI');
      }
      if (window.cefSharpAPI && typeof window.cefSharpAPI.callbackWindow === 'function') {
        return await window.cefSharpAPI.callbackWindow(commandString);
      }
      console.warn('cefSharpAPI.callbackWindow is not a function');
    } catch (e) {
      console.warn('CefSharp bridge call failed:', e);
    }
  }

  // 2) window.external (레거시)
  if (hasExternalCallback()) {
    try {
      return window.external.CallbackWindow(commandString);
    } catch (e) {
      console.warn('external.CallbackWindow call failed:', e);
    }
  }

  // 3) 웹 환경: 조용히 패스
  console.info('[nativeBridge] No native bridge found. (web mode) ->', commandString);
  return null;
}