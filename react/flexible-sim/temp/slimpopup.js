import React, { Component, createRef } from 'react';
const slimscroll = require('util/slimscroll-fixed'); // ← 위 파일 경로

export default class PopupContent extends Component {
  constructor(props) {
    super(props);
    this.ref = createRef();
  }
  componentDidMount() {
    this.raf = requestAnimationFrame(() => {
      const el = this.ref.current;
      if (!el) return;

      // 팝업 문서 기준으로 elementsArray 전달 (ownerDocument 자동 인식)
      slimscroll({ idSelector: '', height: '100%', wheelStep: 30 }, [el]);

      // 디버그: 팝업 컨텍스트면 true/true
      // console.log('doc/window in popup?', el.ownerDocument !== document, (el.ownerDocument.defaultView !== window));
    });
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    // destroy는 현재 코드에 옵션으로 처리(기존 패턴 유지): 다시 init 시 options={ destroy:true }로 호출하도록 필요시 확장
  }
  render() {
    return (
      <div style={{ height: '100%' }}>
        <div ref={this.ref} style={{ height: '100%' }}>
          {/* 긴 메시지들 */}
          {this.props.children}
        </div>
      </div>
    );
  }
}