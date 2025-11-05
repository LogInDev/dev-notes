// src/components/modals/CopyRichMessageModal.js (Class)
import React, { Component } from 'react';
import { detectSource } from 'util/detectEnv';

class CopyRichMessageModal extends Component {
  constructor(props){
    super(props);
    const params = new URLSearchParams(window.location.search);
    const explicitOrigin = params.get('origin');     // 'webview' | 'react' | null
    const explicitVendor = params.get('vendor');     // 'cefsharp' 등

    const auto = detectSource();

    const resolved = {
      origin: explicitOrigin || (auto.isAnyWebView ? 'webview' : 'react'),
      vendor: explicitVendor || auto.vendor
    };

    this.state = { originInfo: resolved };
  }

  componentDidMount(){
    const { origin, vendor } = this.state.originInfo;

    // 예: 웹뷰일 때 포커스/ESC/백드롭/포스트메시지 처리 분기
    if (origin === 'webview') {
      // ESC 끄기, 백드롭 커스터마이즈 등
      // window.cefSharp 사용 가능 여부
      if (vendor === 'cefsharp' && window.cefSharp && window.cefSharp.postMessage) {
        // 예: 네이티브로 로깅/상태 전달
        window.cefSharp.postMessage(JSON.stringify({ type: 'modal_opened', modal: 'CopyRichMessage' }));
      }
    } else {
      // 일반 브라우저(React 클릭 진입) 처리
    }
  }

  render(){
    const { origin, vendor } = this.state.originInfo;
    return (
      <div className="modal">
        <div className="modal__header">
          <span>Copy Rich Message</span>
          <small style={{marginLeft:8, opacity:.6}}>
            ({origin}{vendor ? ` / ${vendor}` : ''})
          </small>
        </div>
        {/* ... 나머지 실내용 UI ... */}
      </div>
    );
  }
}

export default CopyRichMessageModal;