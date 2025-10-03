# React New Window + Slimscroll 적용 문제 해결 가이드

## 문제 원인
`react-new-window`로 띄운 팝업은 **부모 DOM과 완전히 분리된 별도 window/document** 컨텍스트입니다.  
따라서:

1. 부모 창의 CSS가 팝업으로 전파되지 않음  
2. slimscroll 유틸/플러그인이 전역 `window`/`document`를 고정 참조하면 팝업 DOM에 적용 안 됨  
3. jQuery 플러그인일 경우 팝업 window에도 별도로 jQuery가 있어야 동작  

---

## 1. slimscroll 유틸을 `ownerDocument` 기준으로 수정

```js
// util/slimscroll.js
export default function slimscroll(targetEl, options = {}, injectedWin) {
  if (!targetEl) return;

  const doc = targetEl.ownerDocument || document;
  const win = injectedWin || doc.defaultView || window;

  const style = win.getComputedStyle(targetEl);
  if (style.height === 'auto' || parseInt(style.height, 10) === 0) {
    targetEl.style.height = targetEl.style.height || '100%';
  }
  targetEl.style.overflow = 'hidden';

  // 기존 slimscroll 로직...
}

export function destroySlimscroll(targetEl) {
  if (!targetEl) return;
  const doc = targetEl.ownerDocument || document;
  const win = doc.defaultView || window;
  // 이벤트 해제 로직...
}
```

---

## 2. 새창에 CSS 복사 또는 주입하기

```jsx
import NewWindow from 'react-new-window';

class AIThreadPopup extends React.Component {
  handleOpen = (popupWin) => {
    const srcHead = document.head;
    const dstHead = popupWin.document.head;

    Array.from(srcHead.querySelectorAll('link[rel="stylesheet"], style')).forEach(node => {
      dstHead.appendChild(node.cloneNode(true));
    });

    const base = popupWin.document.createElement('style');
    base.textContent = `
      html, body, #root { height: 100%; margin: 0; }
      .slim-container { height: 100%; }
    `;
    dstHead.appendChild(base);
  };

  render() {
    return (
      <NewWindow
        title="AI Thread"
        onOpen={this.handleOpen}
        features={{ width: 900, height: 700 }}
      >
        <PopupContent />
      </NewWindow>
    );
  }
}
```

---

## 3. 팝업 내부 컴포넌트 초기화 타이밍 보장

```jsx
import React, { Component, createRef } from 'react';
import slimscroll, { destroySlimscroll } from 'util/slimscroll';

class PopupContent extends Component {
  constructor(props) {
    super(props);
    this.scrollRef = createRef();
  }

  componentDidMount() {
    this.raf = requestAnimationFrame(() => {
      const el = this.scrollRef.current;
      if (el) {
        const doc = el.ownerDocument;
        const win = doc.defaultView;
        slimscroll(el, { wheelStep: 30 }, win);
      }
    });
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    destroySlimscroll(this.scrollRef.current);
  }

  render() {
    return (
      <div className="slim-container" style={{ height: '100%' }}>
        <div ref={this.scrollRef} style={{ height: '100%' }}>
          {/* 긴 리스트 */}
        </div>
      </div>
    );
  }
}
```

---

## 4. jQuery 플러그인일 경우

```js
handleOpen = (popupWin) => {
  const doc = popupWin.document;

  const addScript = (src) => new Promise((ok, no) => {
    const s = doc.createElement('script');
    s.src = src;
    s.onload = ok; s.onerror = no;
    doc.head.appendChild(s);
  });

  addScript('/static/jquery.min.js')
    .then(() => addScript('/static/jquery.slimscroll.min.js'))
    .then(() => {
      const $ = popupWin.jQuery;
      setTimeout(() => {
        $('.scroll-target', doc).slimScroll({ height: '100%', wheelStep: 30 });
      }, 0);
    });
};
```

---

## 5. 체크리스트

- [ ] 팝업 스크롤 컨테이너에 `height`가 잡혀 있는가  
- [ ] CSS가 팝업에 주입되었는가  
- [ ] slimscroll 유틸이 전역 `window/document` 직접 참조하지 않는가  
- [ ] 초기화 타이밍이 너무 빠르지 않은가  
- [ ] (jQuery 버전일 경우) 팝업 window에 jQuery + slimscroll 플러그인이 로드되었는가  

---

## 요약
- **팝업은 독립된 window/document**라 부모의 CSS, JS, jQuery가 그대로 안 통합니다.  
- slimscroll 같은 DOM 직접 조작 라이브러리는 반드시 `ownerDocument`/`defaultView` 기준으로 동작시켜야 합니다.  
- CSS/스크립트는 **팝업 head에 직접 복사/주입**해야 합니다.  
