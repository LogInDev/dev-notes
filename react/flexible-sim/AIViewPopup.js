import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
// import slimscroll from 'slimscroll'; // ← 필요 없으면 제거
import { executeSearch } from '../../actions';

const defaultProps = {
  isPopup: false,
  setColor: { background: '#fff', font: '#111' },
  height: '95%',
};

class AIViewPopup extends Component {
  constructor(props) {
    super(props);
    this.state = { selectedFile: null, query: '' };

    this.aiviewRef = createRef();
    this.fileInputRef = createRef();
    this.wrapperRef = createRef();

    // 스크롤 상태
    this.isFirst = true;
    this.scrollBottom = -1;
    this.scrollTop = -1;
    this.preScroll = -1;
    this.preScrollBottom = -1;
    this.preScrollTop = -1;
    this.prevScrollHeight = -1;
    this.precurrentScrollTop = -1;
    this.isModify = false;

    // 바인딩
    this._onScroll = this._onScroll.bind(this);
    this._bootstrapFromClick = this._bootstrapFromClick.bind(this);
    this.moveScroll = this.moveScroll.bind(this);
    this.initScrollParam = this.initScrollParam.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    // 팝업 window 기준으로 스크롤 대상 바인딩
    this.attachScrollFromPopupWindow();

    // 타이밍 레이스 보정 rAF 재시도
    if (!this._scrollEl) {
      this._retry1 = requestAnimationFrame(() => {
        this.attachScrollFromPopupWindow();
        if (!this._scrollEl) this._retry2 = requestAnimationFrame(() => this.attachScrollFromPopupWindow());
      });
    }

    // (옵션) 첫 클릭으로 팝업 문서를 부트스트랩
    // window.addEventListener('click', this._bootstrapFromClick, true);
  }

  componentWillUnmount() {
    if (this._scrollEl) this._scrollEl.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('click', this._bootstrapFromClick, true);
    cancelAnimationFrame?.(this._retry1);
    cancelAnimationFrame?.(this._retry2);
  }

  // 전역 queryId 사용 금지! (여러 팝업이 덮어씀)
  // 필요하면 부모가 내려준 popupId 변화에만 반응
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.popupId !== nextProps.popupId) {
      this.scrollBottom = 0;
      this.scrollTop = -1;
      this.initScrollParam();
      // id가 바뀌면 스크롤 타깃도 바꿔야 하니 재바인딩
      this.detachScroll();
      this.attachScrollFromPopupWindow(nextProps);
    }
  }

  detachScroll() {
    if (this._scrollEl) this._scrollEl.removeEventListener('scroll', this._onScroll);
    this._scrollEl = null;
  }

  attachScrollFromPopupWindow(p = this.props) {
    const { popupWindow, popupId } = p;
    const refEl = this.aiviewRef.current;
    if (!popupWindow || popupWindow.closed) return;

    const doc = popupWindow.document;
    // ⭐️ 팝업별 고유 id로 타깃을 찾는다
    const el = doc.getElementById('aiviewMsg-' + popupId) || refEl;
    if (!el) return;

    this._doc = doc;
    this._win = doc.defaultView;
    this._scrollEl = el;

    // 디버그
    console.log('[AIViewPopup] bind in popup?', this._doc !== window.document, 'id=', 'aiviewMsg-' + popupId);

    this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
    // 최초 하단 고정
    this._scrollEl.scrollTop = this._scrollEl.scrollHeight;
  }

  _bootstrapFromClick(e) {
    if (this._doc && this._scrollEl) {
      window.removeEventListener('click', this._bootstrapFromClick, true);
      return;
    }
    const doc = e.target?.ownerDocument;
    if (!doc || doc === window.document) return;

    const el = doc.getElementById('aiviewMsg-' + this.props.popupId);
    if (!el) return;

    this._doc = doc;
    this._win = doc.defaultView;
    this._scrollEl = el;
    this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
    this._scrollEl.scrollTop = this._scrollEl.scrollHeight;

    console.log('[AIViewPopup] bootstrapped via click. popup?', this._doc !== window.document);
    window.removeEventListener('click', this._bootstrapFromClick, true);
  }

  _onScroll(e) {
    const target = this._scrollEl || e.currentTarget || e.target;
    const top = target.scrollTop || 0;
    const view = target.clientHeight || target.offsetHeight || 0;
    const height = target.scrollHeight || 0;

    // ⭐️ 각 팝업마다 자신만의 popupId로 로그가 찍힌다
    console.log('[AIViewPopup]', this.props.popupId, 'scroll =', { top, view, height });

    if (top === 0) {
      // loadPrev()
    } else if (Math.round(top + view) >= height) {
      // loadNext()
    }
  }

  getScrollEl() {
    return this._scrollEl || this.aiviewRef.current || null;
  }

  initScrollParam() {
    this.preTop = undefined;
    this.preBottom = undefined;
  }

  // slimscroll 대신 네이티브로 유지(원하면 여기서도 _scrollEl 사용)
  moveScroll(height) {
    const node = this.getScrollEl();
    if (!node) return;
    node.scrollTop = typeof height === 'number' ? height : node.scrollHeight;
    this.prevScrollHeight = node.scrollHeight;
    this.precurrentScrollTop = node.scrollTop;
    if (this.isFirst) this.isFirst = false;
    this.scrollBottom = -1;
    this.scrollTop = -1;
  }

  handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) this.setState({ selectedFile: file });
  };

  searchQuery = () => {
    const v = (this.state.query || '').trim();
    if (!v) return;
    this.props.executeSearch(v);
    this.setState({ query: '' });
  };

  handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.searchQuery();
    }
  };

  handleInputChange(e) {
    this.setState({ query: e.target.value });
  }

  render() {
    const { query, selectedFile } = this.state;
    const { setColor, isPopup, height, popupId, hideDetail } = this.props;
    const { background, font } = setColor;

    return (
      <div
        className={isPopup ? 'right' : hideDetail ? 'hidden' : 'right'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '15px',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: isPopup ? '#fff' : background,
        }}
      >
        {/* Header */}
        <div style={{ height: '5%' }}>
          <span style={{ fontSize: 15, fontWeight: 'bold' }}>✨AI 결과</span>
          <div style={{ backgroundColor: '#fff', borderTop: '1px solid #8c8c8c', margin: '20px auto' }} />
        </div>

        {/* Body */}
        <div
          style={{
            display: 'flex',
            marginTop: 10,
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            height: isPopup ? height - 90 + 'px' : height,
          }}
        >
          {/* 스크롤 영역 */}
          <div
            ref={this.aiviewRef}
            id={`aiviewMsg-${popupId}`}          // ⭐️ 팝업별 고유 id
            className="aiview"
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: isPopup ? '#111' : font,
              height: isPopup ? '95%' : '100%',
              overflowY: 'auto',
            }}
          >
            <br />
            PopupID : {popupId} <br />
            안녕하세요 <br />
            Pizza입니다. <br />
            무엇을 도와드릴까요? <br />
            <br />
            현재 테스트 진행중입니다.<br />
            <br />
            {Array.from({ length: 80 }).map((_, i) => <div key={i}>row {i + 1}</div>)}
          </div>

          {/* 입력 영역 */}
          <div style={{ display: 'flex' }} className="search_ai">
            <button type="button" onClick={() => this.fileInputRef.current.click()}>파일</button>
            <input
              type="file"
              accept="application/pdf"
              onChange={this.handleFileChange}
              ref={this.fileInputRef}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {selectedFile && <p>선택된 파일: {selectedFile.name}</p>}
              <input
                ref={this.wrapperRef}
                type="text"
                style={{ width: '100%' }}
                placeholder="검색어를 입력하세요"
                name="queryInput"
                value={query}
                onChange={this.handleInputChange}
                onKeyDown={this.handleKeyDown}
              />
            </div>
            <button onClick={this.searchQuery}>🔎</button>
          </div>
        </div>
      </div>
    );
  }
}

AIViewPopup.defaultProps = defaultProps;

// ⭐️ 전역 queryId를 가져오지 않도록 변경 – 팝업 분리 유지
const mapStateToProps = (state, ownProps) => ({
  hideDetail: state.uiSetting.hide_detail,
  setColor: state.aiAssistant.color,
  // queryId: state.aiAssistant.queryId,  ← 제거!
});
export default connect(mapStateToProps, { executeSearch })(AIViewPopup);