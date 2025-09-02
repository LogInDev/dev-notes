import React, { Component, createRef } from 'react';

// 공통 "우클릭→복사→토스트" 처리기
// - 우클릭 contextmenu 이벤트만 수신
// - 전파 완전 차단 (전역 토스트/다른 화면 간섭 방지)
// - ownerDocument 기반으로 popup window도 정상 복사
// 사용처는 children으로 메시지 DOM만 넣어주면 됨.
export default class CopyableMessagePane extends Component {
  constructor(props) {
    super(props);
    this.toastRef = createRef();
    this.onContextMenuCopy = this.onContextMenuCopy.bind(this);
  }

  async copyTextFromEvent(e) {
    const doc = (e && e.target && e.target.ownerDocument) || document;
    const win = doc.defaultView || window;
    try {
      const nav = win.navigator;
      const isSecure = (typeof win.isSecureContext === 'boolean') ? win.isSecureContext : true;
      const text = e.target && e.target.innerText ? e.target.innerText : '';
      if (!text) return false;
      if (nav && nav.clipboard && isSecure) {
        await nav.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    return false;
  }

  async onContextMenuCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
      e.nativeEvent.stopImmediatePropagation();
    }

    const ok = await this.copyTextFromEvent(e);
    if (!ok) return;

    const layer = this.toastRef.current;
    if (!layer) return;

    // 토스트 노출
    layer.className = `${this.props.toastClassName || 'termcopylayer2'} active`;
    setTimeout(() => {
      if (this.toastRef.current) {
        this.toastRef.current.className = `${this.props.toastClassName || 'termcopylayer2'} active fadeout`;
      }
    }, 1000);
  }

  render() {
    const {
      id,
      className,
      style,
      children,
      allowToastAttr = true, // whitelist 모드 대비 마커 옵션
      copiedText = '클립보드에 복사되었습니다.',
      toastClassName = 'termcopylayer2',
      toastStyle,
    } = this.props;

    return (
      <div
        id={id}
        className={className}
        style={style}
        onContextMenu={this.onContextMenuCopy}
        {...(allowToastAttr ? { 'data-allow-copy-toast': '' } : {})}
      >
        {children}
        <div className={`${toastClassName} active fadeout`} ref={this.toastRef} style={toastStyle}>
          <span className="termcopymsg">{copiedText}</span>
        </div>
      </div>
    );
  }
}