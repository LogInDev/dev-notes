import React, { Fragment, createRef } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import * as Socket from '../../../socket';
import DetailTab from './DetailTab';
import ChatInfo from './ChatInfo';
import DetailView from '../../views/DetailView';
import SearchForm from '../details/SearchForm';
import SearchBasePage from '../../views/details/Search_Base_Page';
import { connect } from 'react-redux';
import * as Store from 'GlobalStore';
import { moveToDetail, setPanelLoading, hideDetailArea } from '../../../actions';

// === Daily Hide (localStorage) helpers ===
const HIDE_KEY_PREFIX = 'cube.ai.hideUntil:'; // per-user key

function getUserIdFromStoreOrProp(props) {
  // props.userid가 우선, 없으면 Store에서 보조적으로 가져옴
  try {
    if (props && props.userid) return String(props.userid);
    const state = Store.getStore().getState();
    const uid =
      state &&
      state.profile &&
      state.profile.profile &&
      (state.profile.profile.userId || state.profile.profile.userid);
    return uid ? String(uid) : 'anonymous';
  } catch (e) {
    return 'anonymous';
  }
}

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function storageSet(key, val) {
  try {
    window.localStorage.setItem(key, val);
  } catch (e) {
    // ignore
  }
}
function storageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}

// 오늘(KST) 자정까지의 ISO 문자열
function endOfTodayISO() {
  // 클라이언트 로컬 시간을 그대로 사용 (사내 PC 시간 기준)
  const now = new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23, 59, 59, 999
  );
  return end.toISOString();
}

function isValidFutureISO(iso) {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (isNaN(t)) return false;
  return t > Date.now();
}

function getHideKey(userId) {
  return `${HIDE_KEY_PREFIX}${userId}`;
}

function isHiddenToday(userId) {
  const key = getHideKey(userId);
  const iso = storageGet(key);
  return isValidFutureISO(iso);
}

function setUntilEndOfToday(userId) {
  const key = getHideKey(userId);
  storageSet(key, endOfTodayISO());
}

function clearHide(userId) {
  const key = getHideKey(userId);
  storageRemove(key);
}

// =========================================

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
      query: '',
      isChecked: false, // "하루동안 보지 않기" 체크 상태(= 숨김 활성화 여부)
    };

    this.wrapperRef = createRef();

    this.onChangeArea = this.onChangeArea.bind(this);
    this.renderDetail = this.renderDetail.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDownAIThread);
    // 최초 렌더 시 로컬스토리지 상태를 반영해 체크박스 기본값 동기화
    const userId = getUserIdFromStoreOrProp(this.props);
    const hidden = isHiddenToday(userId);
    this.setState({ isChecked: hidden });
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDownAIThread);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.alarm !== nextProps.alarm) {
      this.setState({
        ...this.state,
        alarm: nextProps.alarm,
      });
    }
  }

  onChangeArea(e) {
    this.props.searchArea(e.target.value);
    this.setState(
      {
        ...this.state,
        searchArea: e.target.value,
      },
      () => {
        var param = { ...this.props };
        param.searchArea = this.props.searchArea;
      }
    );
  }

  onClickSearch = () => {
    Socket.getApi().sendFirstQuery(this.state.query);
    this.setState({ query: '', openInfo: false });
  };

  handleSuggest = (label) => {
    switch (label) {
      case 'cube':
        this.setState({ query: '최근 일주일 해당 큐브 채널 대화 내용을 요약해줘' });
        break;
      case 'conf':
        this.setState({ query: '이번주 Confluence에서 내가 작성한 회의록 내용을 요약해줘' });
        break;
      case 'blog':
        this.setState({ query: '올해 DIS 시스템 관련 FAQ 정리해서 요약해줘' });
        break;
      case 'tms':
        this.setState({ query: '혜리야 HR 정보 중 유연근무제 사용가이드를 알려줘' });
        break;
      case 'book':
        this.setState({ query: '피자야 최근 DRAM 수율 데이터 수집해서 불량율에 대한 원인 분석 및 개선 방안을 알려줘' });
        break;
      case 'find':
        this.setState({ query: '에치야 SK 하이닉스 HBM 올해 매출 전망에 대한 자료를 정리해줘' });
        break;
      default:
        this.setState({ query: '' });
    }

    if (this.wrapperRef.current) this.wrapperRef.current.focus();
  };

  // AI 버튼 클릭: 숨김 여부에 따라 info 자동 열림/닫힘
  onClickAIBtn = () => {
    const userId = getUserIdFromStoreOrProp(this.props);
    const hidden = isHiddenToday(userId);
    this.setState({
      openQuery: true,
      openInfo: !hidden, // 숨김이면 info 닫기
      isChecked: hidden, // 체크박스 동기화
    });
  };

  openAssistant = (type) => {
    if (type === 'input') {
      this.setState({ openQuery: true });
    } else if (type === 'info') {
      // 화살표 아이콘으로 info 열기/닫기
      this.setState((prev) => {
        const willOpen = !prev.openInfo;
        if (willOpen) {
          // 열리는 시점에 체크박스 상태(숨김 여부) 동기화
          const userId = getUserIdFromStoreOrProp(this.props);
          const hidden = isHiddenToday(userId);
          return { openInfo: true, isChecked: hidden };
        }
        return { openInfo: false };
      });
    }
  };

  closeAssistant = (type) => {
    if (type === 'input') this.setState({ openQuery: false });
    else if (type === 'info') this.setState({ openInfo: false });
  };

  // 단축키 등록
  handleKeyDownAIThread = (event) => {
    let _KEY = { ESC: 27 };
    let inputKeyCode = event.keyCode;
    let { channelInfo } = this.props;

    let isAnonymousChannel = channelInfo.channel_type === 3 || channelInfo.channel_type === 5;

    if (!isAnonymousChannel) {
      if (event.ctrlKey && (event.key === 'e' || event.key === 'E')) {
        event.preventDefault();
        const { detailSelected } = this.props;
        const { openQuery } = this.state;

        if (detailSelected !== 'hygpt' && detailSelected !== 'assistant') {
          if (openQuery) {
            this.setState({ openQuery: false, openInfo: false });
          } else {
            // 열 때 숨김 여부 반영
            const userId = getUserIdFromStoreOrProp(this.props);
            const hidden = isHiddenToday(userId);
            this.setState({
              openQuery: true,
              openInfo: !hidden,
              isChecked: hidden,
            });
          }
        }
        event.stopPropagation();
      } else if (inputKeyCode === _KEY.ESC) {
        this.setState({
          openQuery: false,
          openInfo: false,
        });
      }
    }
  };

  onKeyDownEvent = (event) => {
    let _KEY = { ENTER: 13 };
    let inputKeyCode = event.keyCode;
    let inputValue = event.target.value;

    if (inputKeyCode === _KEY.ENTER) {
      event.preventDefault();
      if (inputValue.length > 0) {
        this.onClickSearch();
      }
      event.stopPropagation();
    }
  };

  // "하루동안 보지 않기" 체크박스 토글
  handleCheckBox = () => {
    this.setState(
      (prev) => ({ isChecked: !prev.isChecked }),
      () => {
        const userId = getUserIdFromStoreOrProp(this.props);
        if (this.state.isChecked) {
          setUntilEndOfToday(userId);
        } else {
          clearHide(userId);
        }
      }
    );
  };

  renderDetail() {
    let { image } = global.CONFIG.resource;
    const { query, openQuery, openInfo, isChecked } = this.state;

    let { dmchannels, channelInfo, userid, alarm } = this.props;
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
    let noticeShowView = notice;
    let _typeClass = false;
    let isAnonymousChannel = channelInfo.channel_type === 3 || channelInfo.channel_type === 5;
    let isHytubeChannel = channelInfo.sysName === 'HYTUBE' ? true : false;
    let isHiFeedback =
      channelInfo.sysName === undefined
        ? false
        : channelInfo.sysName === 'HYFB1' || channelInfo.sysName === 'HYFB2' || channelInfo.sysName === 'HYFB3'
        ? true
        : false;
    switch (channelInfo.channel_type) {
      case 0:
        _typeClass = <i className="fa fa-hashtag" />;
        break;
      case 1:
        _typeClass = <i className="fa fa-microphone" />;
        break;
      case 2:
        _typeClass = <i className="icon-lock" />;
        break;
      case 3:
        _typeClass = <i className="icon-lock" />;
        break;
      case 5:
        _typeClass = <i className="fa fa-microphone" />;
        break;
    }
    let profile = Store.getStore().getState().profile;
    let hygptYN = false;
    if (profile.profile && profile.profile.securityList !== undefined) {
      hygptYN =
        profile.profile.securityList.findIndex(
          (row) => row.appType.toUpperCase() === 'HYGPT' && row.openYN.toUpperCase() === 'Y'
        ) > -1
          ? true
          : false;
    }

    let queryBtnMap = [
      {
        key: 'cube',
        label: ['Cube', '대화요약'],
        icon: '/aiassistant/icon_2424/icon_cube.png',
      },
      {
        key: 'conf',
        label: ['Confluence', '내용요약'],
        icon: '/aiassistant/icon_2424/icon_confluence.png',
      },
      {
        key: 'blog',
        label: ['지식블로그', '내용요약'],
        icon: '/aiassistant/icon_2424/icon_blog.png',
      },
    ];

    return (
      <div className="topL">
        <h2 className="channel_title">
          {isHiFeedback ? '' : _typeClass}{' '}
          <span className="channelTitle">
            {isHiFeedback ? <img src={image + '/ico/ch-type-meeting_w.png'} alt="if" /> : ''}
            {channelName}
          </span>
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
        {openQuery ? (
          <div className="topR" style={{ width: '555px', paddingRight: '10px' }}>
            {!isAnonymousChannel && !isHytubeChannel && (
              <div className="right-wrap">
                <div className="query-wrap">
                  <div className="search input-wrap">
                    <div className="icon" onClick={() => this.openAssistant('info')}>
                      {openInfo ? (
                        <img src={image + '/aiassistant/icon_1616/icon_guide_close.png'} />
                      ) : (
                        <img src={image + '/aiassistant/icon_1616/icon_guide_open.png'} />
                      )}
                    </div>
                    <div className="seperate-input"></div>
                    <input
                      ref={this.wrapperRef}
                      type="text"
                      className="query-input"
                      placeholder="검색어를 입력하세요"
                      name="queryInput"
                      value={query}
                      onChange={(e) => this.setState({ query: e.target.value })}
                      onKeyDown={this.onKeyDownEvent}
                    />
                    <div className="icon" onClick={this.onClickSearch}>
                      <img src={image + '/aiassistant/icon_1616/icon_send.png'} />
                    </div>
                    <div className="icon" onClick={() => this.closeAssistant('input')}>
                      <img src={image + '/aiassistant/icon_1616/icon_close.png'} />
                    </div>
                  </div>

                  {openInfo && (
                    <Fragment>
                      <div className="search query-btns-wrap" id="keywordHistory">
                        <div className="query-info-wrap">
                          <div
                            className="icon"
                            onClick={this.loadCubeInfo}
                            style={{ textAlign: 'end', width: '100%', position: 'absolute', right: '11px' }}
                          >
                            <img src={image + '/aiassistant/icon_1616/icon_info.png'} />
                          </div>
                          <img src={image + '/aiassistant/icon_main.png'} alt="mydata_bot" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '30px', fontWeight: '600', marginBottom: '12px' }}>CUBE AI</p>
                          <p style={{ fontSize: '15px', fontWeight: '400' }}>대화할수록 구성원을 더 잘 이해하는, CUBE</p>
                        </div>
                        <div className="query-btns">
                          {queryBtnMap.map((btn, i) => (
                            <div className="query-icons-wrap" key={btn.key}>
                              <img src={image + btn.icon} alt={btn.icon} />
                              <button className="query-btn" type="button" onClick={() => this.handleSuggest(btn.key)}>
                                {btn.label.map((label) => (
                                  <div key={label}>{label}</div>
                                ))}
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="service-bottom" onClick={this.handleCheckBox}>
                          하루동안 보지 않기
                          {isChecked ? (
                            <img src={image + '/aiassistant/icon_1212/icon_main_check.png'} />
                          ) : (
                            <img src={image + '/aiassistant/icon_1212/icon_main_check_Normal.png'} />
                          )}
                        </div>
                      </div>
                    </Fragment>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="topR" style={{ width: hygptYN ? '453px' : '423px' }}>
            {!isAnonymousChannel && !isHytubeChannel && (
              <Fragment>
                <div className="search">
                  <select
                    style={{ width: '75px', margin: '0px 0px 0px 0px' }}
                    defaultValue={this.state.searchArea}
                    onChange={this.onChangeArea.bind(this)}
                  >
                    <option value="ALL">All</option>
                    <option value="CUR">Current</option>
                  </select>
                </div>
                <DetailTab hygptYN={hygptYN} openQuery={this.onClickAIBtn} />
              </Fragment>
            )}
          </div>
        )}
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
    detailSelected: state.uiSetting.detail_selected,
  };
};

export default connect(mapStateToProps, { moveToDetail, setPanelLoading, hideDetailArea })(ChatTop);