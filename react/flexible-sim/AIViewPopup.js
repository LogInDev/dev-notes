import React, {Component, createRef} from 'react';
import { connect } from 'react-redux';
import slimscroll from 'slimscroll';
import { executeSearch } from '../../actions'

const defaultProps = {
    isPopup : false,
    setColor : {
      background : '#fff',
      font : '#111'
    },
    height : '95%',
}

class AIViewPopup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFile: null,
      query: '',
      scrollY: 0,
    }

    this.fileInputRef = createRef();
    this.wrapperRef = createRef();
    this.aiviewRef = createRef();

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
    this.handleInputChange = this.handleInputChange.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this._bootstrapFromClick = this._bootstrapFromClick.bind(this);
  }

  componentDidMount(){
    this.attachScrollFromPopupWindow();

    // 2) 레이스 상황 대비 rAF 재시도 1~2회
    if (!this._scrollEl) {
      this._retryTimer = requestAnimationFrame(() => {
        this.attachScrollFromPopupWindow();
        if (!this._scrollEl) {
          this._retryTimer2 = requestAnimationFrame(() => {
            this.attachScrollFromPopupWindow();
          });
        }
      });
    }

    // 3) 첫 클릭으로 팝업 문서를 부트스트랩 (최종 안전망)
    // window.addEventListener('click', this._bootstrapFromClick, true);


    // const node = this.aiviewRef.current;
    // if (!node) return;

    // const doc = node.ownerDocument;        
    // const win = doc.defaultView;          

    // // 이 콘솔은 부모 창 DevTools에 찍히지만,
    // // 값들은 '팝업 문서/윈도우'를 가리킴
    // console.log('[POPUP] ref element:', node);
    // console.log('[POPUP] is popup document?', doc !== window.document);
    // console.log('[POPUP] popup === parent window ?', win === window); 
    // if (!node) return;

    // node.addEventListener('slimscroll', this.onSlimscroll);
    // console.log('didMount.scrollTop-------', node.scrollTop)
    // console.log('didMount.scrollHeight-------', node.scrollHeight)

    // this.scrollBottom = 0; // 아래로 이동 플래그
    // this.moveScroll(0);
    // window.addEventListener('scroll', this.handleScroll);
    // console.log('window는----',window)
  }

  componentWillUnmount() {
    this.attachScrollFromPopupWindow();
    const node = this.aiviewRef.current;
    if (node) {
      node.removeEventListener('slimscroll', this.onSlimscroll);
    }

    if (this.slimscroll && typeof this.slimscroll.destroy === 'function') {
      this.slimscroll.destroy();
    }
    window.removeEventListener('scroll', this.handleScroll);
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
    console.log('popupWIndow????????', this.props.popupWindow)
    const node = this.aiviewRef.current;
    if (!node) return;

    const currentScrollHeight = node.scrollHeight;
    const currentScrollTop = node.scrollTop;
    console.log('didMount.currentScrollHeight-------', node.currentScrollHeight)
    console.log('didMount.currentScrollTop-------', node.currentScrollTop)

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

  attachScrollFromPopupWindow() {
    const popupWin = this.props.popupWindow;
    const refEl = this.aiviewRef.current;
    if (!popupWin || popupWin.closed) return;

    const doc = popupWin.document;
    const el = doc.getElementById('aiviewMsg') || refEl;

    if (!el) return;

    this._doc = doc;
    this._win = doc.defaultView;
    this._scrollEl = el;

    console.log('[AIView] bind target in popup?', this._doc !== window.document, this._scrollEl);

    // 문서 전체 캡처는 환경 따라 잡음 발생 → 우선 대상 엘리먼트에만 바인딩
    this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });

    // 최초 하단 고정
    this._scrollEl.scrollTop = this._scrollEl.scrollHeight;
  }

    // 첫 클릭으로 팝업 문서 확보 (fallback)
  _bootstrapFromClick(e) {
    if (this._doc && this._scrollEl) {
        window.removeEventListener('click', this._bootstrapFromClick, true);
        return;
    }
    const doc = e.target && e.target.ownerDocument;
    if (!doc || doc === window.document) return;

    const el = doc.getElementById('aiviewMsg');
    if (!el) return;

    this._doc = doc;
    this._win = doc.defaultView;
    this._scrollEl = el;

    this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
    this._scrollEl.scrollTop = this._scrollEl.scrollHeight;

    console.log('[AIView] bootstrapped via click. popup?', this._doc !== window.document);
    window.removeEventListener('click', this._bootstrapFromClick, true);
  }

  _onScroll(e) {
    const target = this.getScrollEl() || e.currentTarget || e.target;

    console.log('this.getScrollEl()=====', this.getScrollEl());
    console.log('e.currentTarget=====',e.currentTarget)
    console.log('e.target=====', e.target)

    const top = target.scrollTop || 0;
    const view = target.clientHeight || target.offsetHeight || 0;
    const height = target.scrollHeight || 0;

    console.log('[AIView][popup]', this.props.queryId, 'scroll =', { top, view, height });
    console.log(target.id)
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

  moveScroll(height) {
    const {queryId, isPopup} = this.props;
    this.slimscroll = new slimscroll({
      height: '100%',
      idSelector: '#aiviewMsg' + queryId,
      scrollTo: height || '100000', // 하단 이동
      doc: this.aiviewRef.current && this.aiviewRef.current.ownerDocument,
      win: this.aiviewRef.current && (this.aiviewRef.current.ownerDocument && this.aiviewRef.current.ownerDocument.defaultView),
    });
    this.slimscroll.init();
    
    console.log('isPopup????????', this.props.isPopup)
    console.log('new slimscroll=======', this.slimscroll)
    console.log('new height=======', height)

    const node = this.aiviewRef.current;
    if (!node) return;

    this.prevScrollHeight = node.scrollHeight;
    this.precurrentScrollTop = node.scrollTop;

    console.log('node=========', node)

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
    console.log('--------AI THREAD 리스트 업데이트------------')
    this.isUpdate = true;
  }

  handleFileChange = (event) =>{
    const file = event.target.files[0]; // 선택된 파일 가져오기
    if (file) {
      this.setState({ selectedFile: file });
      console.log('선택된 파일:', file);
    }
  }

  searchQuery = () =>{
    this.props.executeSearch(this.wrapperRef.current.value);
    this.setState({query:''})
  }

  handleKeyDown = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        this.searchQuery(event.target.value); 
      }
  }
   handleInputChange(event) {
    console.log('새로운 값========', event.target.value)
    this.setState({
      query: event.target.value, // input의 현재 value 값을 state에 저장
    });
  }
  handleScroll() {
    console.log('스크롤값-----------', window.scrollY)
    this.setState({
      scrollY: window.scrollY,
    });
  }


  render(){
    const { image } = global.CONFIG.resource;
    const { query, selectedFile } = this.state;
    const { setColor, isPopup, height, queryId, hideDetail } = this.props;
    const { background, font } = setColor;
    return(
        <div className={isPopup ? 'right' : hideDetail ? 'hidden' :'right' }
          style={{
            display : 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '15px',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: isPopup ? '#fff' : background  // 설정으로 변경가능(팝업제외)
          }}
        >
          {/* Header */}
          <div style={{height:'5%'}}>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 'bold'
              }}
            >✨AI 결과 </span>
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
                  flex: '1',
                  height: isPopup ? height - 90 + 'px' : height
                }}
            >
              {/* 검색 결과 */}
              <div
                ref={this.aiviewRef}
                id={isPopup ? 'aiviewMsg'+queryId : 'aiviewMsg'}
                className="aiview"
                style={{
                  fontSize:'15px',
                  lineHeight: '1.5',
                  color: isPopup ? '#111' : font, // 설정으로 변경가능(팝업제외)
                  height : isPopup ? '95%' : '',
                  overflowY: isPopup ? 'auto' : ''
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
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  <br />
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.<br />
                  <br />
                  

              </div>
              {/* 질의문 입력 및 파일 추가 */}
              <div style={{display:'flex' }} className="search_ai">
                <img
                  className="app"
                  src={image + '/chat/btn-plus.png'}
                  onClick={() => this.fileInputRef.current.click()}
                  role="presentation"
                />
                <input
                  type="file"
                  accept="pdf"
                  onChange={this.handleFileChange}
                  ref={this.fileInputRef} 
                  style={{display:"none"}}
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {selectedFile && <p>선택된 파일: {selectedFile.name}</p>}
                  <input ref={this.wrapperRef} type="text" style={{width:'100%'}} 
                    placeholder='검색어를 입력하세요' 
                    name="queryInput"
                    value={query}
                    // onChange={(e) => this.setState({ query: e.target.value })}
                    onChange={this.handleInputChange}
                    onClick={(e) => e.preventDefault()}
                    onKeyDown={this.handleKeyDown}
                  />
                </div>
                <button onClick={this.searchQuery}>🔎</button>
            </div>
            </div>
        </div>              
    )
  }
}

AIViewPopup.defaultProps = defaultProps;

const mapStateToProps = (state) => {
  return {
    hideDetail: state.uiSetting.hide_detail,
    setColor: state.aiAssistant.color,
    queryId: state.aiAssistant.queryId,
  };
};

export default  connect(mapStateToProps, {executeSearch})(AIViewPopup);
