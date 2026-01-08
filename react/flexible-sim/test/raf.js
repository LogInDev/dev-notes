// AIMessageItem.js
import React, { Component } from 'react';

class AIMessageItem extends Component {
  constructor(props) {
    super(props);
    this.showCopyToast = this.showCopyToast.bind(this);
  }

  // 부모가 호출할 공개 메서드
  showCopyToast(duration = 1000) {
    const isPopup = !!this.props.popupDocument;
    const toastEl = isPopup ? this.refs.termcopylayer4 : this.refs.termcopylayer3;
    const raf = (isPopup ? this.props.popupDocument : window).requestAnimationFrame;

    if (!toastEl || !raf) return;

    // 초기화 후 다음 프레임에 show
    toastEl.classList.remove('termcopylayer--show');
    raf(() => {
      toastEl.classList.add('termcopylayer--show');
      setTimeout(() => {
        // 사라지게
        toastEl.classList.remove('termcopylayer--show');
      }, duration);
    });
  }

  onMouseDownTerm = (e) => {
    // ...여기엔 기존 우클릭 복사 + showCopyToast() 호출 로직 유지
    // 복사 끝난 뒤:
    this.showCopyToast(1000);
  }

  render() {
    const { isAiPopup } = this.props;

    return (
      <div className="ai-message-item" /* ... */>
        {/* 본문 */}
        {/* ... */}

        {/* 토스트: 초기에는 숨김 상태 (termcopylayer만) */}
        {isAiPopup ? (
          <div className="termcopylayer termcopylayer4" ref="termcopylayer4">
            <span className="termcopymsg">{this.language.copied}</span>
          </div>
        ) : (
          <div className="termcopylayer termcopylayer3" ref="termcopylayer3">
            <span className="termcopymsg">{this.language.copied}</span>
          </div>
        )}
      </div>
    );
  }
}

export default AIMessageItem;

// AIMessageList.js
import React, { Component } from 'react';
import AIMessageItem from './AIMessageItem';

class AIMessageList extends Component {
  constructor(props) {
    super(props);
    this.itemRefs = {}; // { [messageId]: componentInstance }
    this.handleShowToastFor = this.handleShowToastFor.bind(this);
  }

  // 부모에서 호출: 특정 메시지의 토스트를 띄움
  handleShowToastFor(messageId, duration = 1000) {
    const item = this.itemRefs[messageId];
    if (item && typeof item.showCopyToast === 'function') {
      item.showCopyToast(duration);
    }
  }

  // 예: 부모의 아무 클릭/버튼으로 특정 항목 토스트 띄우기
  onParentButtonClick = () => {
    const targetId = this.props.focusedMessageId; // 혹은 임의 id
    this.handleShowToastFor(targetId, 1200);
  }

  render() {
    const { messages } = this.props;

    return (
      <div className="aipopup-message-list">
        <button onClick={this.onParentButtonClick}>
          부모에서 토스트 띄우기
        </button>

        {messages.map(msg => (
          <AIMessageItem
            key={msg.id}
            ref={(inst) => {
              if (inst) this.itemRefs[msg.id] = inst;
              else delete this.itemRefs[msg.id]; // 언마운트 시 정리
            }}
            message={msg}
            // ...기존 props들
            popupDocument={this.props.popupDocument}
            isAiPopup={this.props.isPopup}
          />
        ))}
      </div>
    );
  }
}

export default AIMessageList;