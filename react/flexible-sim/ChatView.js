import React, { Component } from 'react';
import ProfileInfo from './details/ProfileInfo';
import { connect } from 'react-redux';
import ChannelList from './channels/ChannelList';
import DMChannelList from './channels/DMChannelList';
import MyChannels from './channels/MyChannels';
import UnreadMessages from './channels/UnreadMessages';
import CreateChannel from '../popup/CreateChannel';
import SearchChannel from '../popup/SearchChannel';
import CreateDM from '../popup/CreateDM';
import SearchDM from '../popup/SearchDM';
import EtcPopUp from '../popup/EtcPopUp';
import AnomyDMChannel from '../popup/AnomyDMChannel';
import * as Socket from 'socket';
import SplitterLayout from 'react-splitter-layout';
import bizrunner from '../../ajax/bizrunner.js';
import slimscroll from 'slimscroll';
import RichNotificationSend from '../popup/RichNotificationSend';
import * as Store from '../../GlobalStore';
import * as actions from '../../actions';
import AIThreadList from './channels/AIThreadList.js';
import {openAITab } from '../../actions/index';


class ChannelView extends Component {
  constructor(props) {
    super(props);

    let language = global.CONFIG.language || {};

    this.language = {
      addChannel: language['BizWorksAddChannel'] || '신규채널 개설',
      addDMChannel: language['AddDMChannel'] || '대화방 개설',
      myChannel: language['BizWorksMyChannel'] || 'My Channel',
      searchChannel: language['BizWorksSearchChannel'] || '채널 검색',
      sortByFavorite: language['BizWorksFavoriteMessage'] || '즐겨찾기',
      addChatChannel: language['AddDMChannel'] || '대화방 개설',
      BizWorksNoChannels:
        language['BizWorksNoChannels'] || '생성된 채널이 없습니다. 채널을 생성해 주세요.',
      placeholder: language['BizWorksSearchUser'] || '대화상대 검색',
      serchChannel:
        language['BizWorksNoSerchChannel'] ||
        '이 기능은 서비스 개선 중입니다.\n당분간 사용이 불가능합니다.',
      BizWorksMoveChannelList: language['BizWorksMoveChannelList'] || '채널목록이동(Ctrl+K)',
      BizWorksChannelVisitHistory: language['BizWorksChannelVisitHistory'] || '채널/DM 접속이력',
      BizWorksOpenedFileHistory: language['BizWorksOpenedFileHistory'] || '파일 열람이력',
      messageReservationHistory: language['MessageReservationHistory'] || '메시지 예약 이력',
      channelMoveConfirm:
        language['BizWorksChannelMoveConfirm'] || '변경된 사항이 있습니다. 변경 하시겠습니까?',
      responseLimitTimeOver:
        language['BizWorksResponseLimitTimeOver'] ||
        '처리 중에 문제가 생겨 다시 기존 리스트를 불러옵니다.',
    };
    let { channel } = this.props;
    this.state = {
      openCreateChannel: false,
      openSearchChannel: false,
      openCreateDM: false,
      openSearchDM: false,
      openEtcPopUp: false,
      showMyChannel: false,
      showUnreadMessage: false,
      favoriteDM: false,
      isShowTotorial: false,
      openInnerSearch: true,
      openCreateAnomy: false,
      openCreateRich: false,
      dmchannels: [],
      dmusers: { userlist: [], totalcount: 0, searchtext: '' },
      style: { display: 'block' },
      isIconChannel: true,
      isIconHytube: !(
        channel.channels.channelList.length > 0 && channel.channels.channelList[0].sysName === 'HYTUBE'
      ),
      isIconHiFeedback: !(
        channel.channels.channelList.length > 0 &&
        (channel.channels.channelList[0].sysName === 'HYFB1' ||
          channel.channels.channelList[0].sysName === 'HYFB2' ||
          channel.channels.channelList[0].sysName === 'HYFB3')
      ),
      //isIconHytube: true
    };

    this.openCreateChannel = this.openCreateChannel.bind(this);
    this.closeCreateChannel = this.closeCreateChannel.bind(this);

    this.openSearchChannel = this.openSearchChannel.bind(this);
    this.closeSearchChannel = this.closeSearchChannel.bind(this);

    this.openCreateDM = this.openCreateDM.bind(this);
    this.closeCreateDM = this.closeCreateDM.bind(this);

    this.openSearchDM = this.openSearchDM.bind(this);
    this.closeSearchDM = this.closeSearchDM.bind(this);

    this.openEtcPopUp = this.openEtcPopUp.bind(this);
    this.closeEtcPopUp = this.closeEtcPopUp.bind(this);

    this.openMyChannel = this.openMyChannel.bind(this);
    this.openUnreadMessages = this.openUnreadMessages.bind(this);
    this.closeMyChannel = this.closeMyChannel.bind(this);
    this.closeUnreadMessage = this.closeUnreadMessage.bind(this);

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onClickSearch = this.onClickSearch.bind(this);
    this.cancelSearchDM = this.cancelSearchDM.bind(this);
    this.addSearchUser = this.addSearchUser.bind(this);
    this.selectChannelList = this.selectChannelList.bind(this);
    this.selectHytubeChannelList = this.selectHytubeChannelList.bind(this);
    this.selectHiFeedbackChannelList = this.selectHiFeedbackChannelList.bind(this);
    this.selectDMChannelList = this.selectDMChannelList.bind(this);
    this.selectAIThreadList = this.selectAIThreadList.bind(this);

    this.openCreateAnomy = this.openCreateAnomy.bind(this);
    this.closeCreateAnomy = this.closeCreateAnomy.bind(this);

    this.openCreateRich = this.openCreateRich.bind(this);
    this.closeCreateRich = this.closeCreateRich.bind(this);

    this.bizrunner = new bizrunner();
    this.isSearchDMNoData = false;
    this.selectAIThreadList = this.selectAIThreadList.bind(this);
  }

  openCreateChannel() {
    this.setState({
      ...this.state,
      openCreateChannel: true,
    });
  }

  closeCreateChannel() {
    this.setState({
      ...this.state,
      openCreateChannel: false,
    });
  }

  openSearchChannel() {
    let uniquename = this.bizrunner.getUserInfo().uniqueName + '';
    if (uniquename.indexOf('X') === 0) {
      alert(this.language.serchChannel);
    } else if (uniquename.indexOf('I') === 0) {
      if (
        uniquename.indexOf('I0100748') === 0 ||
        uniquename.indexOf('I0100835') === 0 ||
        uniquename.indexOf('I0101242') === 0 ||
        uniquename.indexOf('I0103790') === 0 ||
        uniquename.indexOf('I0101845') === 0 ||
        uniquename.indexOf('I0103380') === 0 ||
        uniquename.indexOf('I0103182') === 0 ||
        uniquename.indexOf('I0101082') === 0
      ) {
        this.setState({ ...this.state, openSearchChannel: true });
      } else {
        alert(this.language.serchChannel);
      }
    } else {
      this.setState({ ...this.state, openSearchChannel: true });
    }
  }

  closeSearchChannel() {
    this.setState({ ...this.state, openSearchChannel: false });
  }

  openCreateAnomy() {
    this.setState({ ...this.state, openCreateAnomy: true });
  }

  closeCreateAnomy() {
    this.setState({ ...this.state, openCreateAnomy: false });
  }

  openCreateDM() {
    this.setState({ ...this.state, openCreateDM: true });
  }

  closeCreateDM() {
    this.setState({ ...this.state, openCreateDM: false });
  }

  openCreateRich() {
    this.setState({ ...this.state, openCreateRich: true });
  }

  closeCreateRich() {
    this.setState({ ...this.state, openCreateRich: false });
  }

  openSearchDM() {
    // this.setState({ ...this.state, openSearchDM: true }); //18-05-04 kjh 기존 팝업 호출방식
    this.isSearchDMNoData = false;
    this.setState(
      {
        ...this.state,
        openInnerSearch: !this.state.openInnerSearch,
        dmchannels: [],
        dmusers: { searchtext: '' },
      },
      () => {
        if (this.state.openInnerSearch) this.refs.dmListRef.className = 'listWrap-hjm dmsearchlist';
        else this.refs.dmListRef.className = 'listWrap-hjm';
      }
    );
  }

  closeSearchDM() {
    // this.setState({ ...this.state, openSearchDM: false }); //18-05-04 kjh 기존 팝업 호출방식
    this.isSearchDMNoData = false;
    this.setState({
      ...this.state,
      openInnerSearch: false,
      dmchannels: [],
      dmusers: { searchtext: '' },
    });
  }

  openEtcPopUp() {
    this.setState({ ...this.state, openEtcPopUp: !this.state.openEtcPopUp });
  }

  closeEtcPopUp() {
    this.setState({ ...this.state, openEtcPopUp: false });
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.channel.channels === undefined ||
      nextProps.channel.channels.channelList.length === 0
    ) {
      this.setState({
        ...this.state,
        isShowTotorial: true,
      });
    } else {
      this.setState({
        ...this.state,
        isShowTotorial: false,
      });
    }

    if (this.props.channel.currentChannel !== nextProps.channel.currentChannel) {
      this.setState({
        ...this.state,
        showUnreadMessage: false,
      });
    }
  }

  componentDidUpdate() {
    // if (!this.slimscroll) {
    this.slimscroll = new slimscroll({
      height: '100%',
      // idSelector: '.dmsearchlist ul',
    });
    this.slimscroll.init();
  // }
}

  sortFavoriteDM() {
    if (this.state.favorite) {
      this.props.channel.dmchannels.dmchannels = {};
      this.setState(
        {
          ...this.state,
          favorite: !this.state.favorite,
        },
        function () {
          Socket.getApi().selectDMChannelList('N');
        }
      );
    } else {
      this.setState(
        {
          ...this.state,
          favorite: !this.state.favorite,
        },
        function () {
          Socket.getApi().selectDMFavoriteChannel(this.state.favorite ? 'Y' : 'N');
        }
      );
    }
  }

  openMyChannel() {
    if (!this.state.showMyChannel)
      this.setState({
        ...this.state,
        showMyChannel: true,
        showUnreadMessage: false,
      });
  }

  openUnreadMessages(channelid, isDm) {
    //if ( !this.state.showUnreadMessage )
    if (this.state.isIconHytube) {
      this.setState({
        ...this.state,
        showUnreadMessage: true,
        showMyChannel: false,
        unreadChannelid: channelid,
        isDm: isDm,
      });
    }
  }

  closeMyChannel() {
    this.setState({
      ...this.state,
      showMyChannel: false,
    });
  }

  closeUnreadMessage() {
    this.setState({
      ...this.state,
      showUnreadMessage: false,
    });
  }

  onKeyDown(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.onClickSearch();
    }
  }

  onKeyUp(e) {
    if (e.keyCode !== 13) {
      if (e.target.value.trim().length === 0) {
        e.preventDefault();
        this.isSearchDMNoData = false;
        this.setState({ openInnerSearch: true, dmchannels: [], dmusers: { searchtext: '' } });
      }
    }
  }

  setDMChannelData(list) {
    let resultList = [];
    if (list instanceof Array) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].leave === undefined || list[i].leave === 'N') {
          resultList.push(list[i]);
        }
      }
    }

    if (resultList.length > 0) this.isSearchDMNoData = false;
    else this.isSearchDMNoData = true;

    this.setState({ dmchannels: resultList });
  }

  onClickSearch() {
    let _this = this;
    this.setState({
      ...this.state,
      favorite: this.state.favorite,
    });
    _this.bizrunner.searchDMList(this.refs.dmsearchtext.value).then((msg) => {
      _this.setDMChannelData(msg);
    });

    if (this.refs.dmsearchtext.value) {
      let data = {
        companyCode: undefined,
        deptID: -1,
        searchText: this.refs.dmsearchtext.value,
        startIndex: 0,
        orderField: undefined,
        orderAscDesc: undefined,
      };
      this.bizrunner.getUserList(data).then((res) => {
        let dmusers = {
          userlist: res.list,
          totalcount: res.count,
          searchtext: this.refs.dmsearchtext.value,
        };
        this.setState({ dmusers: dmusers });
      });
    } else {
      this.setState({ dmusers: { searchtext: '' } });
    }
  }

  onClickChannel(channelid) {
    if (this.props.channel.currentChannel + '' !== channelid + '') {
      Socket.getApi().openChannel(channelid);
    }
  }

  cancelSearchDM(channel_id, flag) {
    this.isSearchDMNoData = false;
    this.refs.dmsearchtext.value = '';
    this.refs.dmListRef.className = 'listWrap-hjm dmsearchlist';
    let data = this.state.dmchannels;
    let store = Store.getStore();
    this.setState(
      {
        ...this.state,
        openInnerSearch: true,
        dmchannels: [],
        dmusers: { searchtext: '' },
        favorite: this.state.favorite,
      },
      () => {
        if (flag !== undefined) {
          let api = Socket.getApi();
          if (flag) {
            api.addDMChannelByUniqueName(channel_id);
          } else {
            let sidx = this.props.channel.dmchannels.findIndex((c) => c.channel_id === channel_id);
            if (sidx < 0) {
              let didx = data.findIndex((d) => d.channel_id === channel_id);
              if (didx > -1) {
                store.dispatch(actions.addDMChannel(data[didx]));
              }
            }
            api.openChannel(channel_id);
          }
        }
      }
    );
  }

  addSearchUser(start_idx) {
    this.isSearchDMNoData = true;
    let data = {
      companyCode: undefined,
      deptID: -1,
      searchText: this.state.dmusers.searchtext,
      startIndex: start_idx,
      orderField: undefined,
      orderAscDesc: undefined,
    };
    this.bizrunner.getUserList(data).then((res) => {
      let dmusers = {
        userlist: this.state.dmusers.userlist.concat(res.list),
        totalcount: res.count,
        searchtext: this.state.dmusers.searchtext,
      };
      this.setState({ dmusers: dmusers });
    });
  }

  selectChannelList() {
    if (this.state.isIconChannel) {
      this.setState(
        {
          ...this.state,
          isIconChannel: true,
          isIconHytube: true,
          isIconHiFeedback: true,
        },
        function () {
          Socket.getApi().selectChannelList();
        }
      );
    } else {
      this.setState(
        {
          ...this.state,
          isIconChannel: true,
          isIconHytube: true,
          isIconHiFeedback: true,
        },
        function () {
          Socket.getApi().selectChannelList();
        }
      );
    }
  }

  selectHytubeChannelList() {
    if (this.state.isIconHytube) {
      this.setState(
        {
          ...this.state,
          isIconHytube: !this.state.isIconHytube,
          isIconChannel: false,
          isIconHiFeedback: true,
        },
        function () {
          Socket.getApi().selectHytubeChannelList();
        }
      );
    } else {
      this.setState(
        {
          ...this.state,
          isIconHytube: !this.state.isIconHytube,
          isIconChannel: true,
          isIconHiFeedback: true,
        },
        function () {
          Socket.getApi().selectChannelList();
        }
      );
    }
  }

  selectHiFeedbackChannelList() {
    if (this.state.isIconHiFeedback) {
      this.setState(
        {
          ...this.state,
          isIconHiFeedback: !this.state.isIconHiFeedback,
          isIconHytube: true,
          isIconChannel: false,
        },
        function () {
          Socket.getApi().selectHiFeedbackChannelList();
        }
      );
    } else {
      this.setState(
        {
          ...this.state,
          isIconHiFeedback: !this.state.isIconHiFeedback,
          isIconHytube: true,
          isIconChannel: true,
        },
        function () {
          Socket.getApi().selectChannelList();
        }
      );
    }
  }

  selectDMChannelList() {
    this.props.channel.dmchannels.dmchannels = {};
    this.setState(
      {
        ...this.state,
        // favorite: !this.state.favorite,
      },
      function () {
        !this.state.favorite
          ? Socket.getApi().selectDMChannelList('N')
          : Socket.getApi().selectDMFavoriteChannel('Y');
      }
    );
    openAITab(false)
  }

  selectAIThreadList() {
    // this.setState(
    //   {
    //     ...this.state,
    //   },
    //   function () {
    //     console.log('AI-THREAD 탭 클릭 : ', this.state.activeDmTab);
    //     this.renderAiThreadList();
    //   }
    // );
    openAITab(true)
  }

  renderAiThreadList(){
    console.log('AiThreadList 조회')
  }


  renderTutorial() {
    let style = this.state.style;

    return (
      <div className="tutorial-left-wrap" style={style}>
        <div className="tutorial-left-msg">{this.language.BizWorksNoChannels}</div>
        <div className="tutorial-left-btn" onClick={this.openCreateChannel} />
      </div>
    );
  }

  render() {
    let { image } = global.CONFIG.resource;
    let { channel_unread, dmchannel_unread, keyword_unread } = this.props.channel;

    let createChannelTitle = this.language.addChannel; //TODO
    let createDMTitle = this.language.addDMChannel; //TODO
    let placeholder = this.language.placeholder;
    let profile = Store.getProfile();
    let tematype = profile.theme;
    let color1 = '#2A62FF';
    let color2 = '';
    let moveChannelListStr = this.language.BizWorksMoveChannelList;

    if (tematype === '0') {
      color2 = '#FFFFFF';
    } else if (tematype === '1') {
      color2 = '#1C1C1C';
    } else {
      color2 = '#1C1C1C';
    }

    let classnamesort = !this.state.favorite ? 'sortdmchannel' : 'sortdmchannelunder';
    let hasCHUnreadMention = this.props.channel.hasCHUnreadMention;
    let hasCHUnreadKeywordMention = this.props.channel.hasCHUnreadKeywordMention;
    let hasCHUnreadAllMention = this.props.channel.hasCHUnreadAllMention;
    let hasDMUnreadMention = this.props.channel.hasDMUnreadMention;
    let hasDMUnreadKeywordMention = this.props.channel.hasDMUnreadKeywordMention;
    let hasDMUnreadAllMention = this.props.channel.hasDMUnreadAllMention;

    let chClassKey = '';
    let dmClassKey = '';

    if (hasCHUnreadMention) {
      chClassKey = 'roundnum-mention';
    } else if (hasCHUnreadKeywordMention) {
      chClassKey = 'roundnum-keywords';
    } else if (hasCHUnreadAllMention) {
      chClassKey = 'roundnum-all-mention';
    }

    if (hasDMUnreadMention) {
      dmClassKey = 'roundnum-mention';
    } else if (hasDMUnreadKeywordMention) {
      dmClassKey = 'roundnum-keywords';
    } else if (hasDMUnreadAllMention) {
      dmClassKey = 'roundnum-all-mention';
    }

    return (
      <div>
        <div id="userWrap">
          <div className="myView">
            <ProfileInfo profile={this.props.profile} />
            <div className="mylist" id="dividerChannel">
              <SplitterLayout vertical={true}>
                <div className="scroll">
                  <div className="channels">
                    <div className="titW">
                      <div className="tit">
                        <button
                          type="button"
                          id="addchannel"
                          title={this.language.addChannel}
                          style={
                            this.state.isIconChannel
                              ? { color: color1, textDecoration: 'underline' }
                              : { color: color2 }
                          }
                          onClick={this.selectChannelList}
                        >
                          CHANNELS{' '}
                        </button>
                        {channel_unread > 0 && this.state.isIconChannel ? (
                          <span
                            className={`roundnum ${chClassKey}`}
                            onClick={() => this.openUnreadMessages(-1, false)}
                            style={{ top: '2px' }}
                          >
                            {' '}
                            {channel_unread > 99 ? '99+' : channel_unread}
                          </span>
                        ) : (
                          false
                        )}
                      </div>
                      <div className="titmenu">
                        <img
                          src={
                            image +
                            (this.state.isIconHiFeedstyle
                              ? '/ico/ic_hifeedback_off.png'
                              : '/ico/ic_hifeedback_on.png')
                          }
                          role="presentation"
                          style={{ marginTop: this.state.isIconHiFeedback ? '' : '3px' }}
                          onClick={this.selectHiFeedbackChannelList}
                        />
                        <img
                          src={
                            image +
                            (this.state.isIconHytube
                              ? '/ico/icon_hytube_ch_off.png'
                              : '/ico/icon_hytube_ch_on.png')
                          }
                          role="presentation"
                          style={{ marginTop: this.state.isIconHytube ? '' : '3px' }}
                          onClick={this.selectHytubeChannelList}
                        />
                        <button
                          type="button"
                          id="addchannel"
                          title={this.language.addChannel}
                          onClick={this.openCreateChannel}
                        >
                          <i className="fa fa-plus" role="presentation" />
                        </button>
                        <button
                          type="button"
                          id="btnmore"
                          title={this.language.myChannel}
                          onClick={this.openMyChannel}
                        >
                          <i className="fa fa-ellipsis-v" role="presentation" />
                        </button>
                        <button
                          type="button"
                          id="searchchannel"
                          title={this.language.searchChannel}
                          onClick={this.openSearchChannel}
                        >
                          <i className="fa fa-search" role="presentation" />
                        </button>
                      </div>
                    </div>

                    <div className="listWrap-hjm">
                      <div className="listW">
                        <ChannelList {...this.props} onOpenUnreadMessage={this.openUnreadMessages} />
                      </div>
                      {this.state.isShowTotorial && this.renderTutorial()}
                    </div>
                  </div>
                </div>
                <div className="scroll">
                  <div className="messages">
                    <div className="titW">
                      <div className="tit">
                        <button
                          type="button"
                          id="addchannel"
                          title={this.language.addChannel}
                          style={
                            this.state.activeAiTab
                              ? { color: color1, textDecoration: 'underline'}
                              : { color: color2 }
                          }
                          onClick={this.selectDMChannelList}
                        >
                          DM{' '}
                        </button>
                        {dmchannel_unread > 0 ? (
                          <span
                            className={`roundnum ${dmClassKey}`}
                            onClick={() => this.openUnreadMessages(-1, true)}
                            style={{ top: '2px' }}
                          >
                            {' '}
                            {dmchannel_unread > 99 ? '99+' : dmchannel_unread}
                          </span>
                        ) : (
                          false
                        )}
                      <button
                          type="button"
                          id="ai-thread-btn"
                          title={this.language.addChannel}
                          style={
                            this.state.activeAiTab
                              ? { color: color2 }
                              : { color: color1, textDecoration: 'underline' }
                          }
                          onClick={this.selectAIThreadList}
                        >
                          AI-THREAD{' '}
                        </button>
                      </div>
                      <div className="titmenu">
                        {/* 익명 오픈채널 추가 */}
                        {/* <button type="button" id="addAnomychannel" title={this.language.addChatChannel} onClick={this.openCreateAnomy}>
                          <i className="icon-bubbles" role="presentation" />
                        </button> */}
                        {/* 익명 오픈채널 추가 */}
                        {/* <button type="button" id="addRich" title={this.language.addChatChannel} onClick={this.openCreateRich}>
                          <i className="icon-bubbles" role="presentation" />
                        </button> */}
                        <button
                          type="button"
                          id={classnamesort}
                          title={this.language.sortByFavorite}
                          onClick={this.sortFavoriteDM.bind(this)}
                        >
                          <img
                            src={
                              image +
                              (this.state.favorite
                                ? '/ico/ico_star_on_underline.png'
                                : '/ico/ico_star_off.png')
                            }
                            role="presentation"
                          />
                        </button>
                        <button
                          type="button"
                          id="adddmchannel"
                          title={this.language.addChatChannel}
                          onClick={this.openCreateDM}
                        >
                          <i className="fa fa-plus" role="presentation" />
                        </button>
                        <button
                          type="button"
                          id="searchchannel"
                          title={this.language.searchChannel}
                          onClick={this.openSearchDM}
                        >
                          <i className="fa fa-search" role="presentation" />
                        </button>
                        {/* //예약메시지 미적용으로 주석 처리, 예약메시지 반영 시 해당 부분 주석 제거
                        <button type="button" id="openetcmenu" title={moveChannelListStr.replace('(Ctrl+K)', '') + ' ' + this.language.BizWorksChannelVisitHistory + ', ' + this.language.BizWorksOpenedFileHistory + ', ' + this.language.messageReservationHistory} onClick={this.openEtcPopUp}>
                          <img src={image + '/ico/ch-topbtn04.png'} role="presentation" />
                        </button>
                        */}
                      </div>
                    </div>
                    {this.state.openInnerSearch && (
                      <div className="dmsearch">
                        <span className="inputbox afterBtn">
                          <input
                            onKeyDown={this.onKeyDown}
                            onKeyUp={this.onKeyUp}
                            placeholder={placeholder}
                            type="text"
                            ref="dmsearchtext"
                          />
                          <a onClick={this.cancelSearchDM} href="#" type="text" className="inputbtn">
                            <img
                              src={image + '/dm/icon_cancel.png'}
                              role="presentation"
                              className="clearsearchdm"
                            />
                          </a>
                          <a onClick={this.onClickSearch} href="#" type="text" className="inputbtn">
                            <i className="icon-magnifier" />
                          </a>
                        </span>
                      </div>
                    )}
                    {this.props.activeAiTab
                      ? <div className="listWrap-hjm aisearchlist" ref="aiListRef" key="ai">
                          <div className="listW">
                            <AIThreadList 
                              {...this.props}
                                onOpenUnreadMessage={this.openUnreadMessages}
                                isFavorite={this.state.favorite}
                                filterList={this.state.dmchannels}
                                isSearchDMNoData={this.isSearchDMNoData}
                                onCancelSearchList={this.cancelSearchDM}
                                onAddSearchList={this.addSearchUser}
                                dmusers={this.state.dmusers}
                            />
                          </div>
                        </div>
                      : <div className="listWrap-hjm dmsearchlist" ref="dmListRef" key="dm">
                          <div className="listW">
                            <DMChannelList 
                                {...this.props}
                                onOpenUnreadMessage={this.openUnreadMessages}
                                isFavorite={this.state.favorite}
                                filterList={this.state.dmchannels}
                                isSearchDMNoData={this.isSearchDMNoData}
                                onCancelSearchList={this.cancelSearchDM}
                                onAddSearchList={this.addSearchUser}
                                dmusers={this.state.dmusers}
                              />
                          </div>
                        </div>
                    }
                  </div>
                </div>
              </SplitterLayout>
            </div>
          </div>
        </div>
        {this.state.showMyChannel && <MyChannels {...this.props} onClose={this.closeMyChannel} />}
        {this.state.showUnreadMessage ? (
          <UnreadMessages
            channelid={this.state.unreadChannelid}
            onClose={this.closeUnreadMessage}
            isDm={this.state.isDm}
          />
        ) : (
          false
        )}
        {this.state.openCreateChannel && (
          <CreateChannel
            closeModal={this.closeCreateChannel}
            title={createChannelTitle}
            isLayer={true}
          />
        )}
        {this.state.openSearchChannel && (
          <SearchChannel closeModal={this.closeSearchChannel} isLayer={true} />
        )}
        {this.state.openCreateDM && (
          <CreateDM closeModal={this.closeCreateDM} title={createDMTitle} isLayer={true} />
        )}
        {this.state.openSearchDM && (
          <SearchDM closeModal={this.closeSearchDM} title={'MESSAGES'} isLayer={true} />
        )}

        {/*//예약메시지 미적용으로 주석 처리 
          this.state.openEtcPopUp && <EtcPopUp {...this.props} closeModal={this.closeEtcPopUp} isLayer={true} />
        */}
        {this.state.openCreateAnomy && (
          <AnomyDMChannel closeModal={this.closeCreateAnomy} title={'Open Channel'} isLayer={true} />
        )}
        {this.state.openCreateRich && (
          <RichNotificationSend closeModal={this.closeCreateRich} title={'Send Rich'} isLayer={true} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    profile: state.profile.profile,
    channel: state.channel,
    activeAiTab : state.uiSetting.ai_tab,
  };
};

export default connect(mapStateToProps, { openAITab })(ChannelView);
