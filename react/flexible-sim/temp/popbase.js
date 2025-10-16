// PopupBase.js (핵심 부분만 발췌/치환)
import React, { Component } from 'react';
import { sendNativeCommand } from 'util/nativeBridge';

class PopupBase extends Component {
  constructor(props) {
    super(props);
    this.onClickCancel = this.onClickCancel.bind(this);
    this.onClickSave = this.onClickSave.bind(this);
  }

  /** 실무용: 프로젝트 공통 close 로직로 대체 */
  closeModal() {
    // 우선순위: 전달된 onClose → Redux 액션 → history back 등
    if (typeof this.props.onClose === 'function') {
      this.props.onClose();
      return;
    }
    if (this.props.dispatch && this.props.popupId) {
      this.props.dispatch({ type: 'assistant/CLOSE_POPUP', payload: { popupId: this.props.popupId } });
      return;
    }
    // Fallback
    if (window && window.history && window.history.length > 0) {
      window.history.back();
    }
  }

  /** 공통 취소: 네이티브에 닫기 신호 + 모달 닫기 */
  async onClickCancel(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    // 네이티브(있으면) 닫기 시그널
    await sendNativeCommand('PopupBrowserClose');
    // 웹/CEF 공통 닫기
    this.closeModal();
  }

  /**
   * 공통 저장
   * - 베이스에서는 “닫고 끝”만 처리 (실 저장 로직은 자식 컴포넌트에서 오버라이드)
   * - 필요 시 자식에서 super.onClickSave() 호출 뒤 추가 처리 가능
   */
  async onClickSave(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    await sendNativeCommand('PopupBrowserClose');
    this.closeModal();
  }
}

export default PopupBase;