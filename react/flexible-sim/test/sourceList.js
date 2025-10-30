// utils/openExternal.js
// 모든 환경(브라우저, CEFSharp, Electron, Edge WebView2 등)에서 "외부 브라우저" 열기 시도
export function openExternalLink(rawUrl) {
  if (!rawUrl) return;

  const url = /^(https?:)?\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  try {
    // 1) CEFSharp에 바인딩된 비동기 함수 (예: RegisterAsyncJsObject("cefsharp", ...))
    //    C# 쪽에서 openExternal(url) 구현해두면 호출됨
    if (window.cefsharp?.openExternal) {
      window.cefsharp.openExternal(url);
      return;
    }

    // 2) CEFSharp PostMessage 패턴 (호스트에서 메시지 구독)
    if (window.CefSharp?.PostMessage) {
      window.CefSharp.PostMessage({ type: 'OPEN_EXTERNAL', url });
      return;
    }

    // 3) Electron (preload에서 window.electron.openExternal 노출)
    if (window.electron?.openExternal) {
      window.electron.openExternal(url);
      return;
    }

    // 4) Edge WebView2(WinForms/WPF) - chrome.webview.postMessage 브리지
    if (window.chrome?.webview?.postMessage) {
      window.chrome.webview.postMessage({ type: 'OPEN_EXTERNAL', url });
      return;
    }

    // 5) 일반 웹(브라우저) 기본 동작
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) w.opener = null; // 보안
  } catch (e) {
    // 최후 fallback
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) w.opener = null;
  }
}

// components/LinkText.jsx
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { openExternalLink } from '../utils/openExternal';

export default class LinkText extends Component {
  static propTypes = {
    href: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string
  };

  handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    openExternalLink(this.props.href);
  };

  render() {
    const { href, children, className } = this.props;
    return (
      <a
        href={/^(https?:)?\/\//i.test(href) ? href : `https://${href}`}
        onClick={this.handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={{ cursor: 'pointer', textDecoration: 'underline' }}
      >
        {children}
      </a>
    );
  }
}
