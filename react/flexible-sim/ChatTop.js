import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import DetailTab from './DetailTab';
import ChatInfo from './ChatInfo';
import DetailView from '../../views/DetailView';
import SearchForm from '../details/SearchForm';
import SearchBasePage from '../../views/details/Search_Base_Page';
import { connect } from 'react-redux';
import * as Store from 'GlobalStore';

const propTypes = {
  title: PropTypes.string,
  member: PropTypes.number,
};
const defaultProps = {
  title: '',
  member: 0,
};

class ChatTop extends React.Component {
  constructor(props) {
    super(props);
    this.wrapperRef = createRef();

    this.state = {
      searchArea: 'CUR',
      showContextMenu: false,
      page: 1,
      pageCount: 50,
      sorting: '',
      alarm: false,
      openSearchHistory: false,
      isOpenDropdown: false,
    };
    this.onChangeArea = this.onChangeArea.bind(this);
    this.renderDetail = this.renderDetail.bind(this);
    this.onFocusSearchInput = this.onFocusSearchInput.bind(this);
  }

  componentDidMount(){
    // document.addEventListener('mousedown', this.handleDocClick);
  }
  
  componentWillReceiveProps(nextProps) {
    // document.addEventListener('mousedown', this.handleDocClick);
    if (this.props.alarm !== nextProps.alarm) {
      this.setState({
        ...this.state,
        alarm: nextProps.alarm,
      });
    }
  }

  handleDocClick = (e)=>{
    if(!this.wrapperRef.current) return;
    if(!this.wrapperRef.current.contains(e.target)){
      if(this.props.isOpenDropdown) {
        this.setState(
          {
            ...this.state,
            isOpenDropdown : false
          }
        )
      }
    }
  }

  onFocus = () =>{
    this.setState(
      {
        ...this.state,
        isOpenDropdown: true
      }
    )
  }

  onChange = (e) =>{
    this.setState(
      {
        ...this.state,
        isOpenDropdown: true
      }
    )
  }

  onKeyDown = (e) =>{
    if(e.key === 'Enter'){
      this.setState(
        {
          ...this.state,
          isOpenDropdown: true
        }
      )
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

  renderDetail() {
    let { image } = global.CONFIG.resource;

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
    if (profile.profile.securityList !== undefined) {
      hygptYN =
        profile.profile.securityList.findIndex((row) => row.appType.toUpperCase() === 'HYGPT' && row.openYN.toUpperCase() === 'Y') > -1
          ? true
          : false;
    }
    // console.debug('111111hygptYN === ' + hygptYN);



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
          //fontcolor={this.props.fontcolor}
        />
        {/* 다중공지추가로 삭제 2020.12.22 (!isAnonymousChannel || !isHytubeChannel) && noticeShowView */}
        <div className="topR" style={{ width: hygptYN ? '677px' : '647px' }}>
          {/* <div className="topR"> */}
          {!isAnonymousChannel && !isHytubeChannel && (
            <div>
              {/* 검색어 입력란 */}
              <div className="search" ref={this.wrapperRef}>
                <input type="text" style={{width:'200px'}} name="searchText" placeholder='검색어를 입력하세요1'
                  onChange={this.onChange}
                  onKeyDown={this.onKeyDown}
                  onFocus={this.onFocus}
                />
                {this.isOpenDropdown && (<div className="search" 
                          style={{ 
                              width: "300px",
                              border: "1px solid #373737",
                              height: "300px",
                              zIndex: "10",
                              position: "absolute",
                              margin: "0"
                          }}>
                  최근 검색 이력
                </div>)}
              </div>
              {/* 옵션 선택란[ALL || CURRENT] */}
              <div className="search">
                <select name="searchSelect"
                  style={{ width: '81px', margin: '0px 0px 0px 0px' }}
                  defaultValue={this.state.searchArea}
                  onChange={this.onChangeArea.bind(this)}
                  >
                  <option value="ALL">All</option>
                  <option value="CUR">Current</option>
                </select>
              </div>
            </div>
          )}
          {!isAnonymousChannel && !isHytubeChannel && <DetailTab hygptYN={hygptYN} />}
        </div>
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
  };
};
export default connect(mapStateToProps)(ChatTop);
