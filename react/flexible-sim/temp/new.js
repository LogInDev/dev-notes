// PopupLauncher.jsx
import NewWindow from 'react-new-window';
import AIView from './AIView';

export default function AIPopup({ onClose }) {
  const handleOpen = (win) => {
    // win === 새 창의 window
    // 필요하면 상태/컨텍스트에 보관
  };

  return (
    <NewWindow
      title="AI 결과"
      copyStyles                 // 팝업에도 스타일 복사
      features={{ width: 960, height: 720 }}
      onOpen={handleOpen}
      onUnload={onClose}
    >
      {/* children은 '팝업 window의 document'에 렌더됨 */}
      <AIView isPopup />
    </NewWindow>
  );
}


// AIView.jsx (핵심만)
moveScroll(height) {
  const rootEl = this.aiviewRef.current;
  const doc = rootEl?.ownerDocument;              // 🔴 팝업의 document
  const win = doc?.defaultView;                   // 🔴 팝업의 window

  this.slimscroll = new slimscroll({
    // idSelector: '#aiviewMsg',  // 굳이 selector 쓸 필요 없이,
    root: rootEl,                 // ✅ DOM 노드 직접 전달을 권장
    height: '100%',
    scrollTo: height || '100000',
    doc,                          // ✅ 유틸이 받도록 패치
    win,
  });
  this.slimscroll.init();
}





// util/slimscroll.js (예시 구현)
export default class slimscroll {
  constructor({ root, idSelector, height, scrollTo, doc = document, win = window }) {
    this.doc = doc;
    this.win = win;
    // root가 오면 그걸 쓰고, 없으면 주입된 doc에서 selector로 찾기
    this.root = root || this.doc.querySelector(idSelector);
    this.height = height;
    this.scrollTo = scrollTo;
  }

  init() {
    if (!this.root) return;
    if (this.height) this.root.style.height = this.height;

    // 스크롤 이동
    this.root.scrollTop =
      typeof this.scrollTo === 'number' ? this.scrollTo : this.root.scrollHeight;

    // 커스텀 이벤트도 '팝업 문서' 기준으로 발행
    const emit = () => {
      const evt = new this.win.CustomEvent('slimscroll');
      this.root.dispatchEvent(evt);
    };
    this.root.addEventListener('scroll', emit);
    this._cleanup = () => this.root.removeEventListener('scroll', emit);
  }

  destroy() {
    this._cleanup && this._cleanup();
  }
}



