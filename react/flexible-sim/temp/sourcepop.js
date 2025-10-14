import React from 'react';
import PopupBase from './PopupBase.js';
import slimscroll from 'util/slimscroll';
import { connect } from 'react-redux';

class SourceList extends PopupBase {
  constructor(props) {
    super(props);
    this.bodyRef = React.createRef();
    this.slim = null;
  }

  componentDidMount() {
    // 레이아웃이 잡힌 뒤 초기화 (한 프레임 지연)
    this.raf = requestAnimationFrame(() => {
      const el = this.bodyRef.current;
      if (!el) return;

      // 부모 체인이 높이를 갖고 있어야 height:'100%'가 먹습니다.
      // 위 CSS 적용이 전제.
      this.slim = new slimscroll({
        height: '100%',       // 이제 실제 픽셀 값으로 계산 가능
        wheelStep: 20,
      }, [el]);               // ★ elementsArray로 정확히 지정
      this.slim.init();
    });
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    // destroy 옵션을 지원하면 호출
    try {
      new slimscroll({ destroy: true }, [this.bodyRef.current]).init();
    } catch (e) {}
  }

  renderHeader = () => (
    <div className='sourceHeader'>
      <div className='sourceTitle'>
        <div className='title'>출처</div>
        <a onClick={this.onClickCancel} href="#" type="text" className="closeBtn">
          <i className="icon-close" />
        </a>
      </div>
      <div className='sourceHr' />
    </div>
  );

  renderBody = (idx) => (
    <div className="sourceWrap" key={idx}>
      <div className="sourceTop">
        <button className="sourceNum">{idx}</button>
        <div className="sourceTopRight">
          <i className="icon-docs" />
          <span>cube</span>
        </div>
      </div>
      <div className="sourceName">
        중국 Controller 업체 4Q'25 NAND QTR meeting (11/14~17)
      </div>
      <div className="sourceHr" />
    </div>
  );

  renderContent() {
    const header = this.params.inputmessageid ? this.renderHeader() : null;
    return (
      <div className="sourceContent">
        {header}
        <div className="sourceBody" ref={this.bodyRef}>
          {Array.from({ length: 30 }, (_, i) => this.renderBody(i + 1))}
        </div>
      </div>
    );
  }
}

export default connect(state => ({
  messageList: state.messages.list
}))(SourceList);