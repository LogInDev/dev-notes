import React, {Component, createRef} from 'react';
import { connect } from 'react-redux';
import slimscroll from 'slimscroll';
import { executeSearch } from '../../../actions'

const defaultProps = {
    isPopup : false,
    setColor : {
      background : '#fff',
      font : '#111'
    },
    height : '95%',
}

class AIView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFile: null,
      query: '',
    }

    this.fileInputRef = createRef();
    this.wrapperRef = createRef();

    // 추가
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

    this.channelid = -1;

    this.preTop = undefined;
    this.preBottom = undefined;
  }

  componentDidMount(){
    var node = this.refs.aiview;
    console.log('node------------', node)
    console.log('node------------', node.scrollTop)
    node.addEventListener('slimscroll', this.onSlimscroll);
  }

  // componentWillUnmount() {
  //   if (this.listEl) {
  //     this.listEl.removeEventListener('slimscroll', this.onSlimscroll);
  //     this.listEl = null;
  //   }
  //   this.destroySlimscroll();
  // }

    componentWillReceiveProps(nextProps) {
    let { queryId } = this.props;
    // this.props.messages.scrollstop = false;
    // let preList = this.props.messages.list;
    // let preTop = this.props.messages.topMessageID;
    // let preBottom = this.props.messages.bottomMessageID;
    // let preFind = this.props.messages.findMessageID;

    this.scrollBottom = -1;
    this.scrollTop = -1;

    // let prevListChannelid = preList.length > 0 ? preList[0].channel_id + '' : '-1';
    // let nextListChannelid = list.length > 0 ? list[0].channel_id + '' : '-1';

    let channelMove = queryId !== nextProps.queryId;
    // let listChange = topMessageID !== preTop || bottomMessageID !== preBottom;

    // if (findMessageID !== '-1' && preFind.replace('!', '') !== findMessageID.replace('!', '')) {
    //   this.props.messages.scrollstop = false;
    //   // FIND
    //   this.preScrollBottom = -1;
    //   this.preScrollTop = -1;
      if (channelMove) {
        this.initScrollParam();
      }
    // } else if (!channelMove && preTop > topMessageID) {
    //   // PREV
    //   this.scrollBottom = this.refs.chatlistin.scrollHeight;
    // } else if (!channelMove && topMessageID === preTop && preBottom < bottomMessageID) {
    //   this.props.messages.scrollstop = false;
    //   // NEXT or Receive Message
    //   if (list.length - preList.length === 1) {
    //     this.scrollBottom = 0;
    //   } else {
    //     this.scrollTop = this.refs.chatlistin.scrollTop;
    //   }
    // } else if (channelMove || listChange || this.isFirst) {
    //   // DIR
    //   this.scrollBottom = 0;
    //   this.initScrollParam();
    // }
  }

componentDidUpdate() {
    let currentScrollHeight = this.refs.aiview.scrollHeight;
    let currentScrollTop = this.refs.aiview.scrollTop;

    if (this.isModify) {
      this.isModify = false;
    } else if (this.precurrentScrollTop - currentScrollTop > 150) { // 새글왔을때 유지
      return false;
    } else if (this.scrollBottom > -1 || this.scrollTop > -1) {
      let node = this.refs.aiview; //ReactDOM.findDOMNode(this);
      let scrollHeight = 0;

      if (this.scrollBottom > -1) {
        scrollHeight = node.scrollHeight - this.scrollBottom;
        if (scrollHeight > -1) {
          this.preScroll = scrollHeight;
        }
      } else if (this.scrollTop > -1) {
        this.preScroll = this.scrollTop;
      }

      this.preScrollBottom = this.scrollBottom;
      this.preScrollTop = this.scrollTop;

      if (this.preScroll > -1) {
        this.moveScroll(this.preScroll);
      } else {
        this.moveScroll(0);
      }
    } else if (this.prevScrollHeight + 20 < currentScrollHeight) {
      if (this.preScrollBottom > -1 || this.preScrollTop > -1) {
        let node = this.refs.aiview;
        let scrollHeight = 0;

        if (this.preScrollBottom > -1) {
          scrollHeight = node.scrollHeight - this.preScrollBottom;
          if (scrollHeight > -1) {
            this.preScroll = scrollHeight;
          }
        } else if (this.preScrollTop > -1) {
          this.preScroll = this.preScrollTop;
        }

        if (this.preScroll > -1) {
          this.moveScroll(this.preScroll);
        } else {
          this.moveScroll(0);
        }
      }
    }
  }

  initScrollParam() {
    this.preTop = undefined;
    this.preBottom = undefined;
  }

  moveScroll(height) {
    this.slimscroll = new slimscroll({
      height: '100%',
      idSelector: '#aiviewMsg',
      scrollTo: height || '100000'
    });
    this.slimscroll.init();

    this.prevScrollHeight = this.refs.aiview.scrollHeight;
    this.precurrentScrollTop = this.refs.aiview.scrollTop;
    if (this.scrollBottom === -1 && this.scrollTop === -1) {
      // IS FIND
      this.preScrollTop = height;
      // this.preScrollBottom = this.scrollBottom
    }

    if (this.isFirst) {
      this.isFirst = false;
    }
  }

  onSlimscroll(e) {
    let { queryId } = this.props;
    
    // if (queryId) {
    //   return;
    // } 

    let node = this.refs.aiview;
    // let api = Socket.getApi();
    // console.debug('bottomMessageID = ', bottomMessageID);
    // console.debug('node.scrollTop = ', Math.round(node.scrollTop));
    // console.debug('node.offsetHeight = ', node.offsetHeight);
    // console.debug('node.scrollHeight = ',node.scrollHeight);
    if (node.scrollTop === 0) {
      // if (topMessageID > 0) {
      //   if (this.preTop !== topMessageID) {
      //     this.props.messages.scrollstop = false;
      //     this.preTop = topMessageID;
      //     api.selectMessageList('PREV');
      //     if (list.length > 45) {
      //       this.props.messages.hasNext = 1; // Go to Recent 표시 처리
      //     } else {
      //       this.props.messages.hasNext = 0;
      //     }
      //   }
      // }
      console.log('scrollTop이 0이면----->>> ', node.scrollTop)
    } else if (Math.round(node.scrollTop) + node.offsetHeight === node.scrollHeight 
                  // && bottomMessageID > 0
    ) {
      // if (this.preBottom !== bottomMessageID && hasNext) {
      //   this.props.messages.scrollstop = false;
      //   this.preBottom = bottomMessageID;
      //   api.selectMessageList('NEXT');
      // }else{
      // }
      console.log('scroll  scrollTop이 >>>>', node.scrollTop)
      console.log('scroll  offsetHeight >>>>', node.offsetHeight)
      console.log('scroll  scrollHeight >>>>', node.scrollHeight)
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

  render(){
    let { image } = global.CONFIG.resource;
    const { query } = this.state;
    const { setColor, isPopup, height, queryId } = this.props;
    const { background, font } = setColor;

    return(
        <div className={this.props.hideDetail ? 'hidden' :'right' }
          style={{
            display : 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '15px',
            height: '100%',
            backgroundColor: isPopup ? '#fff' : background  // 설정으로 변경가능(팝업제외)
          }}
        >
          {/* AI Panel 상단 */}
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
          {/* 검색 결과 및 질의 입력*/}
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
                ref='aiview'
                id='aiviewMsg'
                className='aiview'
                style={{
                  fontSize:'15px',
                  lineHeight: '1.5',
                  color: isPopup ? '#111' : font, // 설정으로 변경가능(팝업제외)
                  // height : isPopup ? '95%' : '',
                  // overflowY: isPopup ? 'auto' : ''
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
                <div
                  style={{
                    display:'flex',
                    flexDirection: 'column',
                    flex: 1 ,
                  }}
                >
                  {this.state.selectedFile && (
                    <p>선택된 파일: {this.state.selectedFile && this.state.selectedFile.name}</p> 
                  )}
                  <input ref={this.wrapperRef} type="text" style={{width:'100%'}} 
                    placeholder='검색어를 입력하세요' 
                    name="queryInput"
                    value={query}
                    onChange={(e) => this.setState({ query: e.target.value })}
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

AIView.defaultProps = defaultProps;

const mapStateToProps = (state) => {
  return {
    hideDetail: state.uiSetting.hide_detail,
    setColor: state.aiAssistant.color,
    queryId: state.aiAssistant.queryId,
  };
};

export default  connect(mapStateToProps, {executeSearch})(AIView);
