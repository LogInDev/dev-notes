import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
// ✅ 프로젝트에서 쓰던 커스텀 유틸 경로 사용
import slimscroll from 'util/slimscroll';
import { executeSearch } from '../../../actions';

const defaultProps = {
  isPopup: false,
  setColor: {
    background: '#fff',
    font: '#111'
  },
  height: '95%',
};

class AIView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFile: null,
      query: '',
    };

    // ✅ 안전한 ref
    this.aiviewRef = createRef();
    this.fileInputRef = createRef();
    this.inputRef = createRef();

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

    this.moveScroll = this.moveScroll.bind(this);
    this.onSlimscroll = this.onSlimscroll.bind(this);
    this.initScrollParam = this.initScrollParam.bind(this);
  }

  componentDidMount() {
    const node = this.aiviewRef.current;
    if (!node) return;

    // ✅ 스크롤 이벤트 바인딩
    node.addEventListener('slimscroll', this.onSlimscroll);

    // ✅ 최초 진입 시 하단 고정
    this.scrollBottom = 0; // 아래로 이동 플래그
    this.moveScroll(0);
  }

  componentWillUnmount() {
    const node = this.aiviewRef.current;
    if (node) {
      node.removeEventListener('slimscroll', this.onSlimscroll);
    }
    // ✅ 플러그인 정리
    if (this.slimscroll && typeof this.slimscroll.destroy === 'function') {
      this.slimscroll.destroy();
    }
  }

  // queryId 변경 시(=다른 질의 스레드) 스크롤 파라미터 초기화
  componentWillReceiveProps(nextProps) {
    const { queryId } = this.props;
    if (queryId !== nextProps.queryId) {
      this.scrollBottom = 0; // 하단으로 붙이기
      this.scrollTop = -1;
      this.initScrollParam();
    }
  }

  componentDidUpdate() {
    const node = this.aiviewRef.current;
    if (!node) return;

    const currentScrollHeight = node.scrollHeight;
    const currentScrollTop = node.scrollTop;

    if (this.isModify) {
      this.isModify = false;
      return;
    }

    // 새 글 왔을 때 사용자가 많이 위로 올려놓은 경우 유지
    if (this.precurrentScrollTop - currentScrollTop > 150) {
      return;
    }

    if (this.scrollBottom > -1 || this.scrollTop > -1) {
      let scrollHeight = 0;

      if (this.scrollBottom > -1) {
        scrollHeight = node.scrollHeight - this.scrollBottom;
        if (scrollHeight > -1) this.preScroll = scrollHeight;
      } else if (this.scrollTop > -1) {
        this.preScroll = this.scrollTop;
      }

      this.preScrollBottom = this.scrollBottom;
      this.preScrollTop = this.scrollTop;

      this.moveScroll(this.preScroll > -1 ? this.preScroll : 0);
    } else if (this.prevScrollHeight + 20 < currentScrollHeight) {
      // 콘텐츠 높이 증가 시 앵커 복원
      let scrollHeight = 0;

      if (this.preScrollBottom > -1) {
        scrollHeight = node.scrollHeight - this.preScrollBottom;
        if (scrollHeight > -1) this.preScroll = scrollHeight;
      } else if (this.preScrollTop > -1) {
        this.preScroll = this.preScrollTop;
      }

      this.moveScroll(this.preScroll > -1 ? this.preScroll : 0);
    }
  }

  initScrollParam() {
    this.preTop = undefined;
    this.preBottom = undefined;
  }

  moveScroll(height) {
    // ✅ idSelector는 실제 DOM id와 일치해야 함
    //   아래 render에서 id="aiviewMsg" 부여함
    this.slimscroll = new slimscroll({
      height: '100%',
      idSelector: '#aiviewMsg',
      scrollTo: height || '100000', // 하단 이동
    });
    this.slimscroll.init();

    const node = this.aiviewRef.current;
    if (!node) return;

    this.prevScrollHeight = node.scrollHeight;
    this.precurrentScrollTop = node.scrollTop;

    if (this.scrollBottom === -1 && this.scrollTop === -1) {
      // FIND 모드: 절대 위치 기억
      this.preScrollTop = height;
    }

    if (this.isFirst) {
      this.isFirst = false;
    }

    // 플래그 리셋
    this.scrollBottom = -1;
    this.scrollTop = -1;
  }

  onSlimscroll(e) {
    const node = this.aiviewRef.current;
    if (!node) return;

    // 상단 도달 → 이전 데이터 로드 트리거 지점
    if (node.scrollTop === 0) {
      // 여기서 prev 로드 action 호출 가능
      // ex) this.props.loadPrev(this.props.queryId)
      // console.log('[AIView] reached TOP');
    }
    // 하단 도달 → 다음/최근 데이터 로드 트리거 지점
    else if (Math.round(node.scrollTop) + node.offsetHeight === node.scrollHeight) {
      // ex) this.props.loadNext(this.props.queryId)
      // console.log('[AIView] reached BOTTOM');
    }
    e.stopPropagation();
  }

  loadMore(listcount) {
    // 필요시 사용
    this.isUpdate = true;
  }

  handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      this.setState({ selectedFile: file });
    }
  };

  searchQuery = () => {
    // ✅ state 기반으로 일원화
    this.props.executeSearch(this.state.query);
    this.setState({ query: '' });
  };

  handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.searchQuery();
    }
  };

  render() {
    const { image } = global.CONFIG.resource;
    const { query, selectedFile } = this.state;
    const { setColor, isPopup, height, queryId, hideDetail } = this.props;
    const { background, font } = setColor;

    return (
      <div
        className={hideDetail ? 'hidden' : 'right'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '15px',
          height: '100%',
          backgroundColor: isPopup ? '#fff' : background,
        }}
      >
        {/* Header */}
        <div style={{ height: '5%' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>✨AI 결과 </span>
          <div
            style={{
              backgroundColor: '#fff',
              borderTop: '1px solid #8c8c8c',
              margin: '20px auto',
            }}
          />
        </div>

        {/* Body */}
        <div
          style={{
            display: 'flex',
            marginTop: '10px',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            height: isPopup ? height - 90 + 'px' : height,
          }}
        >
          {/* ✅ 스크롤 영역: 고정 높이 + overflowY 필요 */}
          <div
            ref={this.aiviewRef}
            id="aiviewMsg"
            className="aiview"
            style={{
              fontSize: '15px',
              lineHeight: '1.5',
              color: isPopup ? '#111' : font,
              flex: 1,
              overflowY: 'auto',
              // height를 명시적으로 주려면 아래 사용
              // height: '100%'
            }}
          >
            <br />
            CurrentID : {queryId} <br />
            안녕하세요 <br />
            Pizza입니다. <br />
            무엇을 도와드릴까요? <br />
            <br />
            현재 테스트 진행중입니다.<br />
            <br />
            {/* ... 더미 텍스트 생략 ... */}
          </div>

          {/* 입력 영역 */}
          <div style={{ display: 'flex' }} className="search_ai">
            <img
              className="app"
              src={image + '/chat/btn-plus.png'}
              onClick={() => this.fileInputRef.current.click()}
              role="presentation"
              alt="파일추가"
            />
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
                ref={this.inputRef}
                type="text"
                style={{ width: '100%' }}
                placeholder="검색어를 입력하세요"
                name="queryInput"
                value={query}
                onChange={(e) => this.setState({ query: e.target.value })}
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

AIView.defaultProps = defaultProps;

const mapStateToProps = (state) => ({
  hideDetail: state.uiSetting.hide_detail,
  setColor: state.aiAssistant.color,
  queryId: state.aiAssistant.queryId,
});

export default connect(mapStateToProps, { executeSearch })(AIView);