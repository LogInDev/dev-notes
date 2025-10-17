// PopupPortal.jsx
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

export default class PopupPortal extends Component {
  componentDidMount() {
    const { targetWindow } = this.props; // ← react-new-window가 준 window
    const doc = (targetWindow && targetWindow.document) || document;

    this.container = doc.createElement('div');
    this.container.className = 'react-modal-portal';
    doc.body.appendChild(this.container);

    // 팝업 기본 레이아웃 보강(없으면 모달 레이아웃 깨질 수 있음)
    if (targetWindow) {
      const style = doc.createElement('style');
      style.textContent = `
        html, body { height: 100%; margin: 0; }
        .react-modal-portal { position: relative; z-index: 9999; }
      `;
      doc.head.appendChild(style);
      this._injectedStyle = style;
    }
    this.forceUpdate();
  }

  componentWillUnmount() {
    if (this.container && this.container.parentNode) this.container.parentNode.removeChild(this.container);
    if (this._injectedStyle && this._injectedStyle.parentNode) this._injectedStyle.parentNode.removeChild(this._injectedStyle);
  }

  render() {
    if (!this.container) return null;
    return ReactDOM.createPortal(this.props.children, this.container);
  }
}




import PopupPortal from './PopupPortal';
// popupWindow[id]는 <NewWindow onOpen={(win)=>{ popupWindow[id]=win }} /> 에서 저장한 window

{isShowSource && popupWindow[id] && !popupWindow[id].closed && (
  <PopupPortal targetWindow={popupWindow[id]}>
    <ModalContainer>{/* 이 컴포넌트가 추가 Portal을 만들지 않는다면 그대로 사용 */}
      <ModalDialog
        onClose={this.handleClose}
        eventDocument={popupWindow[id].document}   // ← 3번 패치와 세트
      >
        <SourceList
          closeModal={this.handleClose}
          title={null}
          isLayer
          channelid="200008792"
          inputmessageid="6251013094856143045"
        />
      </ModalDialog>
    </ModalContainer>
  </PopupPortal>
)}

handleOpen = (id, win) => {
  const srcHead = document.head;
  const dstHead = win.document.head;
  Array.from(srcHead.querySelectorAll('link[rel="stylesheet"], style')).forEach(n => {
    dstHead.appendChild(n.cloneNode(true));
  });
  const base = win.document.createElement('style');
  base.textContent = `html,body,#root{height:100%;margin:0}`;
  dstHead.appendChild(base);
  this.popupWindow[id] = win;
};


