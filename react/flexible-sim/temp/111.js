// SourceListModal.jsx
import React, { Component, createRef } from 'react';
import ReactDOM from 'react-dom';

class SourceListModal extends Component {
  constructor(props) {
    super(props);
    this.bodyRef = createRef();
    this.modalRoot = document.getElementById('modal-root') || document.body; // modal-root 없으면 body 사용
    this.el = document.createElement('div');
  }

  componentDidMount() {
    this.modalRoot.appendChild(this.el);

    // 백그라운드 스크롤 방지
    this._prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // ESC 닫기
    document.addEventListener('keydown', this.handleKeyDown, false);
  }

  componentWillUnmount() {
    // 복구
    document.body.style.overflow = this._prevOverflow || '';
    document.removeEventListener('keydown', this.handleKeyDown, false);
    try { this.modalRoot.removeChild(this.el); } catch (e) {}
  }

  handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      this.props.onClose && this.props.onClose();
    }
  };

  // 바깥 클릭으로 닫기
  onBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      this.props.onClose && this.props.onClose();
    }
  };

  renderHeader = () => {
    const { title = '출처' } = this.props;
    return (
      <div className="sourceHeader">
        <div className="sourceTitle">
          <div className="title">{title}</div>
          <a onClick={this.props.onClose} href="#" className="closeBtn" aria-label="Close">
            <i className="icon-close" />
          </a>
        </div>
        <div className="sourceHr" />
      </div>
    );
  };

  renderItem = (idx) => (
    <div className="sourceWrap" key={idx}>
      <div className="sourceTop">
        <button className="sourceNum">{idx}</button>
        <div className="sourceTopRight">
          <i className="icon-docs" />
          <span>cube</span>
        </div>
      </div>
      <div className="sourceName">
        중국 Controller 업체 4Q&apos;25 NAND QTR meeting (11/14~17)
      </div>
      <div className="sourceHr" />
    </div>
  );

  renderModal() {
    const { open = false } = this.props;
    if (!open) return null;

    return (
      <div className="sourceBackdrop" onClick={this.onBackdropClick}>
        <div className="sourceContent" role="dialog" aria-modal="true">
          {this.renderHeader()}
          <div className="sourceBody" ref={this.bodyRef}>
            {Array.from({ length: 30 }, (_, i) => this.renderItem(i + 1))}
          </div>
          <div className="sourceFooter">
            <button className="btn btn-primary" onClick={this.props.onClose}>확인</button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return ReactDOM.createPortal(this.renderModal(), this.el);
  }
}

export default SourceListModal;


/* 배경(백드롭) */
.sourceBackdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: center;     /* 수직 중앙 */
  justify-content: center; /* 수평 중앙 */
  padding: 24px;           /* 좁은 화면 여백 */
}

/* 모달 컨테이너 (flex column) */
.sourceContent{
  width: 650px;
  max-width: calc(100vw - 48px); /* 모바일 대응 */
  height: 80vh;                  /* ★ 스크롤 기준 높이 */
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(0,0,0,0.24);
  display: flex;
  flex-direction: column;
  overflow: hidden;              /* 내부 라운드 유지 */
}

/* Header */
.sourceHeader{
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  padding: 10px 16px 0 16px;
}

.sourceHeader .sourceTitle{
  display: flex;
  align-items: center;
  height: 46px;
  width: 100%;
  margin-top: 4px;
  position: relative;
}

.sourceHeader .sourceTitle .title{
  width: 100%;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
}

.sourceHeader .sourceTitle .closeBtn{
  position: absolute;
  right: 15px;
  font-size: 20px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.sourceHr{
  display: block;
  border: 1px solid #dddddd;
  margin: 6px 0 5px 0;
}

/* Body (스크롤 영역) */
.sourceBody{
  flex: 1 1 auto;    /* ★ 남은 공간 채움 */
  min-height: 0;     /* ★ flex 컨텍스트에서 overflow 작동용 */
  overflow: auto;    /* ★ 네이티브 스크롤 */
  padding: 8px 12px;
}

/* 항목 */
.sourceBody .sourceWrap{
  min-height: 70px;
  padding: 12px;
  gap: 14px;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
}

.sourceBody .sourceWrap:hover{
  background: #fafafa;
}

.sourceBody .sourceWrap .sourceTop{
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  align-items: center;
}

.sourceTop .sourceNum{
  background-color: #ddd;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  line-height: 24px;
  text-align: center;
  font-size: 12px;
}

.sourceTop .sourceTopRight{
  display: flex;
  gap: 6px;
  font-size: 16px;
  align-items: center;
}

.sourceBody .sourceWrap .sourceName{
  font-size: 16px;
}

.sourceFooter{
  flex: 0 0 auto;
  padding: 12px 16px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
}

.btn{
  appearance: none;
  border: 1px solid #d9d9d9;
  background: #fff;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary{
  border-color: #1677ff;
  background: #1677ff;
  color: #fff;
}

/* (선택) 스크롤바 미세 스타일 */
.sourceBody::-webkit-scrollbar{ width: 8px; height: 8px; }
.sourceBody::-webkit-scrollbar-thumb{ background: rgba(0,0,0,.25); border-radius: 4px; }
.sourceBody{ scrollbar-width: thin; scrollbar-color: rgba(0,0,0,.25) transparent; }