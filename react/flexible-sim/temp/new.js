// AIPopup.jsx
import React from 'react';
import NewWindow from 'react-new-window';
import AIView from './AIView';

export default function AIPopup({ onClose }) {
  return (
    <NewWindow
      title="AI 결과"
      copyStyles    // ⭐️ 부모 <head>의 <link>/<style>을 팝업에 복사
      features={{ width: 960, height: 720, menubar: 'no', toolbar: 'no' }}
      onUnload={onClose}
    >
      {/* 여기 안에서 렌더되는 모든 엘리먼트(ref 포함)는 팝업 window/document 소속 */}
      <AIView isPopup />
    </NewWindow>
  );
}


// AIView.moveScroll 안
this.slimscroll = new slimscroll({
  height: '100%',
  idSelector: '#aiviewMsg',
  scrollTo: height || '100000',
  // ⭐️ 팝업 문서/윈도우 주입 (유틸이 지원한다면)
  doc: this.aiviewRef.current?.ownerDocument,
  win: this.aiviewRef.current?.ownerDocument?.defaultView,
});
this.slimscroll.init();



// util/slimscroll.js (예시)
export default class slimscroll {
  constructor({ idSelector, height, scrollTo, doc = document /* ⭐️ 기본값 부모 문서 */ }) {
    this.doc = doc;
    this.root = this.doc.querySelector(idSelector);
    this.height = height;
    this.scrollTo = scrollTo;
  }
  init() {
    if (!this.root) return;
    this.root.style.height = this.height;
    this.root.scrollTop = typeof this.scrollTo === 'number'
      ? this.scrollTo
      : this.root.scrollHeight;
    // 스크롤 끝/처음 도달 시 커스텀 이벤트 발행
    this.root.addEventListener('scroll', () => {
      const evt = new this.doc.defaultView.CustomEvent('slimscroll');
      this.root.dispatchEvent(evt);
    });
  }
  destroy() { /* 필요 시 정리 */ }
}


