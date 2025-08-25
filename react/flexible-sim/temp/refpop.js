// AIPopupLauncher.jsx
import React, { Component } from 'react';
import NewWindow from 'react-new-window';
import PopupRefProbe from './PopupRefProbe';

export default class AIPopupLauncher extends Component {
  state = { popupWin: null };

  handleOpen = (win) => {
    // 팝업 window 객체를 보관 (선택)
    this.setState({ popupWin: win });
    // 팝업 창 자체 콘솔을 보고 싶으면, 팝업 활성화 후 그 창에서 DevTools 열기(Cmd/Ctrl+Opt+I)
  };

  render() {
    return (
      <NewWindow
        title="AI 결과"
        copyStyles                             // 부모 스타일 복사
        features={{ width: 960, height: 720 }} // 팝업 크기
        onOpen={this.handleOpen}
        onUnload={() => this.setState({ popupWin: null })}
      >
        {/* 이 children은 '팝업 window의 document'에 포털로 렌더됨 */}
        <PopupRefProbe popupWindow={this.state.popupWin} />
      </NewWindow>
    );
  }
}


// PopupRefProbe.jsx
import React, { Component, createRef } from 'react';

export default class PopupRefProbe extends Component {
  constructor(props) {
    super(props);
    this.boxRef = createRef();
  }

  componentDidMount() {
    const el = this.boxRef.current;
    if (!el) return;

    const doc = el.ownerDocument;          // ✅ 팝업의 document
    const win = doc.defaultView;           // ✅ 팝업의 window

    // 이 콘솔은 부모 창 DevTools에 찍히지만,
    // 값들은 '팝업 문서/윈도우'를 가리킴
    console.log('[POPUP] ref element:', el);
    console.log('[POPUP] is popup document?', doc !== window.document);
    console.log('[POPUP] popup === parent window ?', win === window); // 보통 false

    // 필요 시 팝업 window와도 비교
    if (this.props.popupWindow) {
      console.log(
        '[POPUP] equals props.popupWindow?',
        win === this.props.popupWindow
      );
    }
  }

  render() {
    return (
      <div
        ref={this.boxRef}
        id="popup-aiview"                 // 팝업 전용 id (부모와 겹치지 않게)
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: 16,
          boxSizing: 'border-box',
          background: '#fff'
        }}
      >
        <h3>팝업 안에서 ref 잡기 테스트</h3>
        <p>이 div의 ref는 팝업 문서를 가리켜야 해요.</p>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i}>row {i + 1}</div>
        ))}
      </div>
    );
  }
}



