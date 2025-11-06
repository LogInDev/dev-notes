import React, { Fragment, createRef } from 'react';
import 'util/dailyHideStore'; // ✅ 전역 DailyHideStore 먼저 로드
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import DetailTab from './DetailTab';
import ChatInfo from './ChatInfo';
import AIPrompt from '../assistant/AIPrompt';
import DetailView from '../../views/DetailView';
import SearchForm from '../details/SearchForm';
import SearchBasePage from '../../views/details/Search_Base_Page';
import { connect } from 'react-redux';
import * as Store from 'GlobalStore';
import { moveToDetail, setPanelLoading, hideDetailArea } from '../../../actions';

const propTypes = {
  title: PropTypes.string,
  member: PropTypes.number,
  query: PropTypes.string.isRequired,
};
const defaultProps = {
  title: '',
  member: 0,
};

class ChatTop extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchArea: 'CUR',
      showContextMenu: false,
      page: 1,
      pageCount: 50,
      sorting: '',
      alarm: false,
      openQuery: false,
      openInfo: false,
      query:'',
      isChecked: false, // ✅ 오늘 안보기 이미지 상태(= shouldShow의 반대)
    };

    this.wrapperRef = createRef();

    this.onChangeArea = this.onChangeArea.bind(this);
    this.renderDetail = this.renderDetail.bind(this);
  }

  componentDidMount(){
    document.addEventListener('keydown', this.handleKeyDownAIThread);
    const shouldShow = window.DailyHideStore.shouldShow(this.props.userId);
    this.setState({ isChecked: !shouldShow }); // 숨김상태면 체크 ON
  }

  componentDidUpdate(prevProps){
    // 로그인 사용자 변경 시 스토리지 기준으로 재평가
    if (prevProps.userId !== this.props.userId) {
      const shouldShow = window.DailyHideStore.shouldShow(this.props.userId);
      this.setState({ isChecked: !shouldShow });
    }

    // 알림 prop 변화 반영
    if (this.props.alarm !== prevProps.alarm) {
      this.setState({ alarm: this.props.alarm });
    }
  }

  componentWillUnmount(){
    document.removeEventListener('keydown', this.handleKeyDownAIThread);
  }

  onChangeArea(e) {
    this.props.searchArea(e.target.value);
    this.setState({ searchArea: e.target.value });
  }

  onClickAIBtn = () =>{
    const shouldShow = window.DailyHideStore.shouldShow(this.props.userId);
    this.setState({
      openQuery: true,
      openInfo: shouldShow,     // 보여야 하면 info 열림
      isChecked: !shouldShow,   // 체크 이미지는 반대
    });
  }

  handleInfoStatus = (infoStatus) =>{
    this.setState({ openInfo: infoStatus });
  }

  // 단축키: Ctrl+E 토글, ESC 닫기
  handleKeyDownAIThread = (event) => {
    const _KEY = { ESC: 27 };
    const inputKeyCode = event.keyCode;
    const { channelInfo, detailSelected } = this.props;
    const shouldShow = window.DailyHideStore.shouldShow(this.props.userId);

    const isAnonymousChannel = channelInfo.channel_type === 3 || channelInfo.channel_type === 5;

    if(!isAnonymousChannel){
      if(event.ctrlKey && event.key === 'e'){
        event.stopPropagation();
        event.preventDefault();

        if(detailSelected !== "hygpt" && detailSelected !== "assistant"){
          if(this.state.openQuery){
            this.setState({ openQuery : false, openInfo : false });
          } else {
            this.setState({
              openQuery : true,
              openInfo : shouldShow,
              isChecked : !shouldShow,
            });
          }
        }
      } else if (inputKeyCode === _KEY.ESC) {
        this.setState({ openQuery: false, openInfo: false });
      }
    }
  }

  // AIPrompt로부터 체크 상태를 통지 받음(Controlled)
  handleCheckStatus = (status) =>{
    this.setState({ isChecked: status });
  }

  renderPrompt = () =>{
    return (
      <AIPrompt 
        channelInfo={this.props.channelInfo}
        handlePrompt={this.handlePrompt}
        openInfo={this.state.openInfo}
        handleInfoStatus={this.handleInfoStatus}
        isChecked={this.state.isChecked}       // ✅ 항상 여기서 전달
        userId={this.props.userId}
        handleCheckStatus={this.handleCheckStatus}
      />
    );
  }

  handlePrompt = (type, isOpen) => {
    if(type === 'input') {
      this.setState({ openQuery : isOpen });
    }else if(type === 'info'){
      this.setState({ openInfo : isOpen });
    }
  }

  renderDetail() {
    let { image } = global.CONFIG.resource;
    const { openQuery } = this.state;
    const { dmchannels, channelInfo, userid } = this.props;

    let channelName =
      channelInfo.aliasChannelName === undefined || channelInfo.aliasChannelName === null
        ? channelInfo.channel_name || ''
        : channelInfo.aliasChannelName || '';
    if (channelName.length > 25) {
      channelName = channelName.substring(0, 25) + '....';
    }

    let notice =
      this.props.channelInfo.channel_notice === undefined ? (
        false
      ) : (
        <div
          className="notice"
          style={{ margin: '4px 0px 20px 0px', fontSize: '12px', color: '#909090', display: 'block' }}
          title={this.props.channelInfo.channel_notice}
        >
          {this.props.channelInfo.channel_notice}
        </div>
      );

    const isAnonymousChannel = channelInfo.channel_type === 3 || channelInfo.channel_type === 5;
    const isHytubeChannel = channelInfo.sysName === 'HYTUBE' ? true : false;

    let profile = Store.getStore().getState().profile;
    let hygptYN = false;
    if (profile.profile.securityList !== undefined) {
      hygptYN =
        profile.profile.securityList.findIndex((row) => row.appType.toUpperCase() === 'HYGPT' && row.openYN.toUpperCase() === 'Y') > -1
          ? true
          : false;
    }

    const promptAI = this.renderPrompt();

    return (
      <div className="topL">
        <h2 className="channel_title">
          <span className="channelTitle">{channelName}</span>
        </h2>

        <ChatInfo
          isOn={this.props.isOn}
          dmchannels={dmchannels}
          alarm={this.state.alarm}
          channelInfo={channelInfo}
          infosummary={this.props.infosummary}
          userid={userid}
          backgroundcolor={this.props.backgorundcolor}
        />

        { openQuery 
          ? promptAI
          : <div className="topR" style={{ width: hygptYN ? '453px' : '423px' }}>
              {!isAnonymousChannel && !isHytubeChannel && (
                <Fragment>
                  <div className="search">
                    <select
                      style={{ width: '75px', margin: '0px 0px 0px 0px' }}
                      defaultValue={this.state.searchArea}
                      onChange={this.onChangeArea}
                    >
                      <option value="ALL">All</option>
                      <option value="CUR">Current</option>
                    </select>
                  </div>
                  <DetailTab hygptYN={hygptYN} openQuery={this.onClickAIBtn} />
                </Fragment>
              )}
            </div>
        }
      </div>
    );
  } 

  render() {
    return <div className="chatTop">{this.renderDetail()}</div>;
  }
}

ChatTop.propTypes = propTypes;
ChatTop.defaultProps = defaultProps;

const mapStateToProps = (state) => {
  return {
    isOn: state.uiSetting.isOn,
    query: state.assistant.query,
    detailSelected : state.uiSetting.detail_selected,
    userId : state.profile.profile.userID
  };
};

export default connect(mapStateToProps, { moveToDetail, setPanelLoading, hideDetailArea })(ChatTop);



import React, { Component, Fragment, createRef } from 'react';
import * as Socket from 'socket';

// ✅ 완전 controlled 컴포넌트: 체크 이미지는 항상 props.isChecked만 봄
class AIPrompt extends Component{
  constructor(props) {
    super(props);
    this.wrapperRef = createRef();
    this.state = { query: '' };
  }

  handleSuggest = (label) => {
    switch(label){
      case 'cube':
        this.wrapperRef.current.value = '최근 일주일 해당 큐브 채널 대화 내용을 요약해줘';
        break;
      case 'conf':
        this.wrapperRef.current.value = '이번주 Confluence에서 내가 작성한 회의록 내용을 요약해줘';
        break;
      case 'blog':
        this.wrapperRef.current.value = '올해 DIS 시스템 관련 FAQ 정리해서 요약해줘';
        break;
      case 'tms':
        this.wrapperRef.current.value = '혜리야 HR 정보 중 유연근무제 사용가이드를 알려줘';
        break;
      case 'book':
        this.wrapperRef.current.value = '피자야 최근 DRAM 수율 데이터 수집해서 불량율에 대한 원인 분석 및 개선 방안을 알려줘';
        break;
      case 'find':
        this.wrapperRef.current.value = '에치야 SK 하이닉스 HBM 올해 매출 전망에 대한 자료를 정리해줘';
        break;
      default :
        this.setState({query: '' })
    }
    this.wrapperRef.current.focus();
  };

  onClickSearch = () =>{
    Socket.getApi().sendFirstQuery(this.wrapperRef.current.value);
    this.props.handleInfoStatus(false);
  }

  onKeyDownEvent = (event) => {
    const _KEY = { ENTER: 13 };
    const inputKeyCode = event.keyCode;
    const inputValue = event.target.value;

    if (inputKeyCode === _KEY.ENTER) {
      event.preventDefault();
      if (inputValue.length > 0) {
        this.onClickSearch();
      }
      event.stopPropagation();
    } 
  }

  openAssistant = (type) => {    
    if (type === 'input') {
      this.props.handlePrompt(type, true)
    } else if (type === 'info') {
      // 열기 직전에 스토리지 기준으로 체크 상태 재평가 (shouldShow만 사용)
      const shouldShow = window.DailyHideStore.shouldShow(this.props.userId);
      this.props.handleCheckStatus(!shouldShow); // 체크 = !shouldShow
      const prevOpen = this.props.openInfo;
      this.props.handleInfoStatus(!prevOpen);
    } 
  }

  closeAssistant = (type) =>{
    if (type === 'input') {
      this.props.handlePrompt(type, false)
    } else if (type === 'info') {
      this.props.handleInfoStatus(false);
    }
  }

  loadCubeInfo = () =>{
    const loadUrl = 'http://iflow.skhynix.com/group/article/3872035'
    window.open(loadUrl, '_blank', 'noopener,noreferrer');
  }

  handleCheckBox = () =>{
    const prev = this.props.isChecked;
    const next = !prev;
    this.props.handleCheckStatus(next);

    if (next) {
      window.DailyHideStore.setUntilEndOfToday(this.props.userId); // 체크 → 자정까지 숨김
    } else {
      window.DailyHideStore.clear(this.props.userId);              // 해제 → 보이기
    }
  }

  render(){
    const { image } = global.CONFIG.resource;
    const { channelInfo, openInfo, isChecked } = this.props;

    const imageSrcUrl = isChecked
      ? `${image}/aiassistant/icon_1212/icon_main_check.png`
      : `${image}/aiassistant/icon_1212/icon_main_check_Normal.png`;

    const isAnonymousChannel = channelInfo.channel_type === 3 || channelInfo.channel_type === 5;
    const isHytubeChannel = channelInfo.sysName === 'HYTUBE';

    const queryBtnMap = [
      { key : "cube", label : ["Cube", "대화요약"], icon : "/aiassistant/icon_2424/icon_cube.png" },
      { key : "conf", label : ["Confluence", "내용요약"], icon : "/aiassistant/icon_2424/icon_confluence.png" },
      { key : "blog", label : ["지식블로그", "내용요약"], icon : "/aiassistant/icon_2424/icon_blog.png" },
    ];

    return(
      <div className="topR" style={{width:'555px',paddingRight:'10px'}}>
      {!isAnonymousChannel && !isHytubeChannel && (
        <div className="right-wrap" >
          <div className="query-wrap">
            <div className="search input-wrap" >
              <div className='icon' onClick={()=>this.openAssistant('info')}>
                {openInfo ? 
                  <img src={image + '/aiassistant/icon_1616/icon_guide_close.png'} /> :
                  <img src={image + '/aiassistant/icon_1616/icon_guide_open.png'} />
                }
              </div>
              <div className="seperate-input"></div>

              <input
                ref={this.wrapperRef}
                type="text"  
                className="query-input"
                placeholder='"Ctrl+E"로 저를 부를 수 있어요.' 
                name="queryInput"
                onChange={(e) => this.setState({ query: e.target.value })}
                onKeyDown={this.onKeyDownEvent}
              />
              <div className='icon' onClick={this.onClickSearch}>
                <img src={image + '/aiassistant/icon_1616/icon_send.png'} />
              </div>
              <div className='icon' onClick={()=>this.closeAssistant('input')}>
                <img src={image + '/aiassistant/icon_1616/icon_close.png'} />
              </div>
            </div>

            {openInfo && (
              <Fragment>
                <div className="search query-btns-wrap" id="keywordHistory">
                  <div className="query-info-wrap">
                    <div
                      className="icon" onClick={this.loadCubeInfo}
                      style={{textAlign: 'end', width: '100%', position: 'absolute', right: '11px'}}
                    >
                      <img src={image + '/aiassistant/icon_1616/icon_info.png'} />
                    </div>
                    <img src={image + '/aiassistant/icon_main.png'} alt="mydata_bot" />
                  </div>

                  <div style={{textAlign: 'center'}}>
                    <p style={{fontSize: '30px',fontWeight: '600', marginBottom: '12px'}}>CUBE AI</p>
                    <p style={{fontSize: '15px',fontWeight: '400'}}>대화할수록 구성원을 더 잘 이해하는, CUBE</p>
                  </div>

                  <div className="query-btns">
                    {queryBtnMap.map((btn) => (
                      <div className="query-icons-wrap" key={btn.key}>
                        <img src={image + btn.icon} alt={btn.icon} />
                        <button
                          className="query-btn"
                          type='button'
                          onClick={()=>this.handleSuggest(btn.key)}
                        >
                          {btn.label.map(label => <div key={label}>{label}</div>)}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="service-bottom" onClick={this.handleCheckBox}>
                    하루동안 보지 않기
                    <img src={imageSrcUrl} /> 
                  </div>
                </div>
              </Fragment>
            )}
          </div>
        </div> 
      )}
      </div>
    )
  }
}

export default AIPrompt;