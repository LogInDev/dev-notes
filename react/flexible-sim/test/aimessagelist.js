import React, { Component } from 'react';
import AIMessageRoute from './AIMessageRoute';
import slimscroll from 'util/slimscroll';
import * as Socket from 'socket';
import SeperateDateBar from '../messages/SeperateDateBar';
import bizrunner from '../../../ajax/bizrunner';
import { connect } from 'react-redux';
import { setLoading, setPanelLoading } from '../../../actions';

class AIMessageList extends Component {
  constructor(props) {
    super(props);
    this.setModifyMessage = this.setModifyMessage.bind(this);
    this.state = { modifymessage: -1, isRendering: false };

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
    this.receiveMsgFromParent = this.receiveMsgFromParent.bind(this);

    this.channelid = -1;
    this.preTop = undefined;
    this.preBottom = undefined;

    this.bizrunner = new bizrunner();
  }

  setModifyMessage(messageid) {
    this.isModify = true;
    this.setState({ modifymessage: messageid });
  }

  componentDidMount() {
    const node = this.refs.chatlistin2;
    node.addEventListener('slimscroll', this.onSlimscroll);

    if (global.externalParam && global.externalParam.type === 'Hytube') {
      window.addEventListener('message', this.receiveMsgFromParent);
    }
  }

  receiveMsgFromParent(e) {
    if (e.data !== undefined && e.data === 'logout') {
      this.bizrunner.logout();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.receiveMsgFromParent);
  }

  componentWillReceiveProps(nextProps) {
    const { list, topMessageID, bottomMessageID, findMessageID } = nextProps.messages;
    this.props.messages.scrollstop = false;

    const preList = this.props.messages.list;
    const preTop = this.props.messages.topMessageID;
    const preBottom = this.props.messages.bottomMessageID;
    const preFind = this.props.messages.findMessageID;

    this.scrollBottom = -1;
    this.scrollTop = -1;

    const prevListChannelid = preList.length > 0 ? preList[0].channel_id + '' : '-1';
    const nextListChannelid = list.length > 0 ? list[0].channel_id + '' : '-1';

    const channelMove = prevListChannelid !== nextListChannelid;
    const listChange = topMessageID !== preTop || bottomMessageID !== preBottom;

    if (findMessageID !== '-1' && preFind.replace('!', '') !== findMessageID.replace('!', '')) {
      this.props.messages.scrollstop = false;
      this.preScrollBottom = -1;
      this.preScrollTop = -1;
      if (channelMove) {
        this.initScrollParam();
      }
    } else if (!channelMove && preTop > topMessageID) {
      this.scrollBottom = this.refs.chatlistin2.scrollHeight;
    } else if (!channelMove && topMessageID === preTop && preBottom < bottomMessageID) {
      this.props.messages.scrollstop = false;
      if (list.length - preList.length === 1) {
        this.scrollBottom = 0;
      } else {
        this.scrollTop = this.refs.chatlistin2.scrollTop;
      }
    } else if (channelMove || listChange || this.isFirst) {
      this.scrollBottom = 0;
      this.initScrollParam();
    }
  }

  componentDidUpdate() {
    const currentScrollHeight = this.refs.chatlistin2.scrollHeight;
    const currentScrollTop = this.refs.chatlistin2.scrollTop;
    if (this.isModify) {
      this.isModify = false;
      return;
    }
    if (this.props.messages.scrollstop && (this.precurrentScrollTop - currentScrollTop > 150)) {
      return;
    }
    if (this.scrollBottom > -1 || this.scrollTop > -1) {
      const node = this.refs.chatlistin2;
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
      if (this.preScrollBottom > -1 || this.preScrollTop > -1) {
        const node = this.refs.chatlistin2;
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
  }

  initScrollParam() {
    this.preTop = undefined;
    this.preBottom = undefined;
  }

  moveScroll(height) {
    this.slimscroll = new slimscroll({
      height: '100%',
      idSelector: '#message2',
      scrollTo: height || '100000'
    });
    this.slimscroll.init();

    this.prevScrollHeight = this.refs.chatlistin2.scrollHeight;
    this.precurrentScrollTop = this.refs.chatlistin2.scrollTop;
    if (this.scrollBottom === -1 && this.scrollTop === -1) {
      this.preScrollTop = height;
    }
    if (this.isFirst) this.isFirst = false;
  }

  onSlimscroll(e) {
    const { messages, channelid, isPopup } = this.props;
    const { topMessageID, bottomMessageID, list, hasNext } = messages;
    if (list.length === 0) return;

    const node = this.refs.chatlistin2;
    const api = Socket.getApi();

    if (node.scrollTop === 0) {
      if (topMessageID > 0 && this.preTop !== topMessageID) {
        this.props.messages.scrollstop = false;
        this.preTop = topMessageID;
        api.selectAIMessageList('PREV', -1, true, isPopup ? 'popup' : 'panel', channelid);
        this.props.messages.hasNext = list.length > 45 ? 1 : 0;
      }
    } else if (Math.round(node.scrollTop) + node.offsetHeight === node.scrollHeight && bottomMessageID > 0) {
      if (this.preBottom !== bottomMessageID && hasNext) {
        this.props.messages.scrollstop = false;
        this.preBottom = bottomMessageID;
        api.selectAIMessageList('NEXT', -1, true, isPopup ? 'popup' : 'panel', channelid);
      } else {
        api.selectAIMessageList('NEXT', -1, true, isPopup ? 'popup' : 'panel', channelid);
      }
    }
    e.stopPropagation();
  }

  setRendering = (data) => {
    this.setState({ isRendering: data });
  };

  // === [중요] 날짜별 구분바 & 메시지에 안정적인 key 부여 ===
  render() {
    const { image } = global.CONFIG.resource;
    const { messages } = this.props;
    const messagesList = messages.list;

    const actionparam = {
      userid: this.props.userid,
      companycode: this.props.companycode,
      action: this.props.action,
      findMessageID: this.props.messages.findMessageID,
      modifymessage: this.state.modifymessage,
      setModifyMessage: this.setModifyMessage,
      addMentionText: (uniquename, username) => this.props.onAddMention('@' + username + '(' + uniquename + ')'),
      moveScroll: this.moveScroll,
    };

    const items = [];
    for (let i = 0; i < messagesList.length; i++) {
      const msg = messagesList[i];
      const prevMsg = messagesList[i - 1];

      const isUserMessage =
        msg.register_uniqueName
          ? global.CONFIG.login.uniquename === msg.register_uniqueName
          : false;

      const registerDate = new Date(msg.register_date);
      registerDate.setTime(registerDate.getTime() - registerDate.getTimezoneOffset() * 60 * 1000);

      let isSame = false;
      if (i > 0) {
        const prevRegisterDate = new Date(prevMsg.register_date);
        prevRegisterDate.setTime(prevRegisterDate.getTime() - prevRegisterDate.getTimezoneOffset() * 60 * 1000);

        if (prevMsg.register_uniqueName === msg.register_uniqueName && msg.type !== 'C') {
          const diff = registerDate.getTime() - prevRegisterDate.getTime();
          if (diff < 120000 && prevMsg.type !== 'C') isSame = true;
        }
        if (prevMsg.type === 'C' && msg.type === 'C' && prevMsg.link_oid === msg.link_oid) isSame = true;

        // 날짜 바 표시 여부
        const needSep = registerDate.getDate() !== prevRegisterDate.getDate();
        if (i === 0 || needSep) {
          const dayKey = registerDate.toISOString().slice(0, 10); // YYYY-MM-DD
          items.push(
            <SeperateDateBar
              key={`sep-${dayKey}-${msg.message_id}`}
              date={registerDate}
            />
          );
          isSame = false;
        }
      } else {
        // 첫 메시지는 무조건 날짜 바 추가
        const dayKey = registerDate.toISOString().slice(0, 10);
        items.push(
          <SeperateDateBar
            key={`sep-${dayKey}-${msg.message_id}`}
            date={registerDate}
          />
        );
      }

      items.push(
        <AIMessageRoute
          key={`msg-${msg.message_id}`}
          message={msg}
          linkedData={this.props.messages.linkedData}
          actionparam={actionparam}
          isSame={isSame}
          openVotePopup={this.props.openVotePopup}
          fontcolor={this.props.fontcolor}
          isUserMessage={isUserMessage}
          setRendering={this.setRendering}
          isAiPopup={false}
          handleSourcePopup={this.props.handleSourcePopup}
        />
      );
    }

    return (
      <div id="message2" className="chatlistin" ref="chatlistin2">
        {items}
        {this.props.isLoading && (
          <div className="loaderWrap">
            <div className="loader">
              <img src={image + '/aiassistant/img_loading.gif'} alt="icon_send" />
            </div>
            <div className="loaderInfo">
              <div className="infoText">AI 답변 생성중입니다.</div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect(null, { setLoading, setPanelLoading })(AIMessageList);