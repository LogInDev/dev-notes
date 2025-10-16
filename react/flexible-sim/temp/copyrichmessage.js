// CopyRichMessage.js (전체 대체 예시 - 중요한 부분 위주로 갱신)
import React from 'react';
import PopupBase from './PopupBase.js';
import slimscroll from 'util/slimscroll';
import { connect } from 'react-redux';
import * as Store from 'GlobalStore';
import * as Socket from 'socket';
import { sendNativeCommand } from 'util/nativeBridge'; // ★ 추가

class CopyRichMessage extends PopupBase {
  constructor(props) {
    super(props);

    this.onClickChannelTab = this.onClickChannelTab.bind(this);
    this.onClickDirectTab = this.onClickDirectTab.bind(this);
    this.onClickSearch = this.onClickSearch.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onClickSave = this.onClickSave.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);

    let messageid = this.params['inputmessageid'] || this.params['messageid'];

    let language = global.CONFIG.language || {};
    this.language = {
      moveMsg: language['BizWorksSelectCopyMessageMsg'] || '이동하실 채널을 선택하여 주세요.',
      channel: language['BizWorksChannel'] || '채널',
      chatRoom: language['DMChannel'] || '대화방',
      copyMsg: language['BizWorksSearchCopyMessageMsg'] || '해당 메세지를 복사 할 대화방을 검색하세요.',
      save: language['ButtonSave'] || '저장',
      cancel: language['ButtonCancel'] || '취소',
    };

    this.state = {
      selectedtab: 'CH',
      selectedchannel: -1,
      messageid: messageid,
      keyword: '',
      channels: [],
      dmchannels: [],
      isRichMsg: false,
    };
    this.content = '';
    this.richMsg = '';
  }

  componentDidMount() {
    // ... 생략 없이 기존 로직 유지
    let _this = this;

    if (this.params.content === undefined) {
      _this.richMsg = _this.props.messageList.filter(msg => msg.message_id === _this.state.messageid);
      if (_this.richMsg.length > 0) {
        let msgType = _this.richMsg[0].type;
        if (msgType === 'X' || msgType === 'Y' || msgType === 'A') {
          const richMessageString = JSON.stringify(_this.richMsg[0].rndata);
          this.content = richMessageString;
          _this.setState({ isRichMsg: true });
        }
      }
    }

    _this.bizrunner.getChannelList().then(function(res) {
      _this.setChannelData(res.bizWorksChannelList, res.groupInChannelList);
    });

    _this.airunner.getDMChannels('N').then(function(res) {
      _this.setDMChannelData(res);
    });

    this.raf = requestAnimationFrame(() => {
      this.slimscroll = new slimscroll({
        height: '100%',
        idSelector: '.copyschlist ul',
      });
      this.slimscroll.init();
    });
  }

  setChannelData(channelList, groupList) {
    let list = [];
    channelList.map(channel => {
      if (channel.channel_info.channel_id > 0) {
        if (channel.channel_info.channel_type !== 4) {
          let channelname = channel.channel_info.aliasChannelName === null
            ? channel.channel_info.channel_name
            : channel.channel_info.aliasChannelName;
          channel.channel_info.channel_name = channelname;
          list.push(channel);
        }
      }
      return true;
    });
    list = list.concat(groupList);
    this.state.channels = list;
    this.setState({ ...this.state });
  }

  setDMChannelData(dmlist) {
    let list = [];
    let userName = Store.getProfile().nameLang;
    if (this.params.username) {
      userName = this.params.username;
    }
    dmlist.map(c => {
      let viewname = '';
      if (c.name) {
        if (userName && c.name.indexOf(',') > -1 && c.name.indexOf(userName) > -1) {
          viewname = c.name.replace(userName + ', ', '').replace(userName + ',', '');
          viewname = viewname.replace(', ' + userName, '').replace(',' + userName, '');
        } else viewname = c.name;
      }
      let channelname = c.aliasChannelName === null ? viewname : c.aliasChannelName;
      c.name = channelname;
      if (c.leave === 'N') {
        list.push(c);
      }
      return true;
    });
    this.state.dmchannels = list;
    this.setState({ ...this.state });
  }

  onClickChannelTab() {
    if (this.refs.test) this.refs.test.value = '';
    this.setState({ ...this.state, selectedtab: 'CH', keyword: '' });
  }

  onClickDirectTab() {
    if (this.refs.test) this.refs.test.value = '';
    this.setState({ ...this.state, selectedtab: 'DM', keyword: '' });
  }

  onClickSearch() {
    this.setState({ ...this.state, keyword: this.refs.test ? this.refs.test.value : '' });
  }

  onClickChannel(channelid) {
    this.setState({ ...this.state, selectedchannel: channelid });
  }

  onKeyDown(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.onClickSearch();
    }
  }

  /** ★ 수정 포인트: 모든 네이티브 호출 → sendNativeCommand 로 통일 */
  async onClickSave(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const selected = this.state.selectedchannel;
    if (!(selected > -1)) {
      // 필요 시 UX 처리 (토스트/알럿 등)
      // alert(this.language.moveMsg);
      return;
    }

    // 1) 메시지 복사/즐겨찾기 비즈니스 로직
    const { messageid } = this.state;
    const { content, inputmessageid, foldername, rid, channelid } = this.params;
    const isRich = this.state.isRichMsg;

    // props로 들어온 경우도 고려
    if (this.props.inputmessageid) {
      // 패널/팝업에서 선택한 메시지 복사
      if (isRich) {
        this.bizrunner.copyMessage(channelid, messageid, selected, this.content);
      } else {
        this.bizrunner.copyMessage(channelid, messageid, selected, this.refs.inputbox ? this.refs.inputbox.value : '');
      }

      // 2) 네이티브 닫기 시그널 (있으면) + 모달 닫기
      await sendNativeCommand('PopupBrowserClose');
      super.onClickCancel(); // closeModal 포함
      return;
    }

    if (this.props.content) {
      // 외부에서 content 주입되어 즐겨찾기 추가
      let lang = Number(global.CONFIG.languageType + '');
      let data = {
        languageType: lang,
        channelID: selected,
        type: 'H',
        status: 'I',
        content: this.props.content,
        rid: this.props.rid,
        fName: this.props.foldername,
      };
      this.bizrunner.addFavorite(data);

      await sendNativeCommand('PopupBrowserClose');
      super.onClickCancel();
      return;
    }

    if (content) {
      // URL 파라미터로 넘어온 content 즐겨찾기
      let lang = Number(global.CONFIG.languageType + '');
      let data = {
        languageType: lang,
        channelID: selected,
        type: 'H',
        status: 'I',
        content: decodeURIComponent(content),
        rid: rid,
        fName: decodeURIComponent(foldername),
      };
      this.bizrunner.addFavorite(data);

      // 네이티브 알림 필요시(선호 포맷)
      await sendNativeCommand('PopupBrowserClose');
      super.onClickCancel();
      return;
    }

    if (inputmessageid) {
      // 입력창 복사 (일반 텍스트)
      this.bizrunner.copyMessage(channelid, messageid, selected, this.refs.inputbox ? this.refs.inputbox.value : '');
      await sendNativeCommand('PopupBrowserClose');
      super.onClickCancel();
      return;
    }

    // 3) 마지막 보호: 그래도 여기 오면 그냥 닫기
    await sendNativeCommand('PopupBrowserClose');
    super.onClickCancel();
  }

  async onClickCancel(e) {
    // 베이스(네이티브 + 닫기) 호출
    await super.onClickCancel(e);
  }

  renderTab() {
    let channelTabString = this.language.channel;
    let directTabString = this.language.chatRoom;
    return (
      <div className="topboxtab">
        <ul>
          <li>
            <a href="#" onClick={this.onClickChannelTab} className={this.state.selectedtab === 'CH' ? 'on' : ''}>
              {channelTabString}
            </a>
          </li>
          <li>
            <a href="#" onClick={this.onClickDirectTab} className={this.state.selectedtab === 'DM' ? 'on' : ''}>
              {directTabString}
            </a>
          </li>
        </ul>
      </div>
    );
  }

  renderBottom() {
    let search = this.renderSearch();
    let list = this.renderList();
    let tab = this.renderTab();
    return (
      <div className="postgroup">
        {search}
        {tab}
        {list}
      </div>
    );
  }

  renderHeader() {
    return (
      <div className='copycontent'>
        <div className='copymessageTitle'>채널간 메시지 복사</div>
        <div className="sourceHr" />
        <a onClick={this.onClickCancel} href="#" type="text" className="closeBtn">
          <i className="icon-close" />
        </a>
      </div>
    );
  }

  renderSearch() {
    let placeholder = this.language.copyMsg;
    return (
      <div className="thisname2">
        <span className="inputbox afterBtn">
          <input onKeyDown={this.onKeyDown} type="text" ref="test" placeholder={placeholder} />
          <a onClick={this.onClickSearch} href="#" type="text" className="inputbtn">
            <i className="icon-magnifier" />
          </a>
        </span>
      </div>
    );
  }

  renderList() {
    let channellist = [];
    let selectedchannel = this.state.selectedchannel;
    if (this.state.selectedtab === 'CH') {
      this.state.channels.map(channel => {
        let { channel_id, channel_name } = channel.channel_info;
        if (!this.state.keyword || (channel_name && channel_name.indexOf(this.state.keyword) > -1)) {
          channellist.push(
            <li className={selectedchannel === channel_id ? 'selectedChannel' : ''} onClick={this.onClickChannel.bind(this, channel_id)} key={channel_id}>
              <a><span style={{color: '#4a68f9'}}>[Channel]</span> {channel_name}</a>
            </li>
          );
        }
        return true;
      });
    } else {
      this.state.dmchannels.map(channel => {
        if (!this.state.keyword || (channel.name && channel.name.indexOf(this.state.keyword) > -1)) {
          channellist.push(
            <li className={selectedchannel === channel.channel_id ? 'selectedChannel' : ''} onClick={this.onClickChannel.bind(this, channel.channel_id)} key={channel.channel_id}>
              <a><span style={{color: '#4a68f9'}}>[DM]</span> {channel.name}</a>
            </li>
          );
        }
        return true;
      });
    }

    return (
      <div className="copyschlist">
        <ul>{channellist}</ul>
      </div>
    );
  }

  renderButton() {
    let save = this.language.save;
    let cancel = this.language.cancel;
    return (
      <div className="btnWc">
        <button onClick={this.onClickSave} type="button" className="btns btnOk">{save}</button>
        <button onClick={this.onClickCancel} type="button" className="btns">{cancel}</button>
      </div>
    );
  }

  renderCopyMsg() {
    return (
      <div className="copymessageWrap">
        <div className='copymessageSubTitle'>
          <i className="icon-bubble" />
          <span>Copy Message</span>
        </div>
        <div>
          {/* 필요 시 RichPreview 또는 textarea 복원 */}
        </div>
        <div className="sourceHr" />
      </div>
    );
  }

  renderContent() {
    let bottom = this.renderBottom();
    let header = this.renderHeader();
    let copyMsg = this.renderCopyMsg();
    let button = this.renderButton();
    return (
      <div className="aiAssistant copy-msg">
        {header}
        <div className="copymessageBody">
          {copyMsg}
          {bottom}
          {button}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { isPopup, channelid } = ownProps;
  const messageList = isPopup
    ? state.assistant.popupThread[channelid] && state.assistant.popupThread[channelid].list
    : state.assistant.panelThread && state.assistant.panelThread.list;
  return { messageList };
};

export default connect(mapStateToProps)(CopyRichMessage);