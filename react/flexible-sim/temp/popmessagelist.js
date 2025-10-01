import React, { Component } from 'react';
import AIMessageRoute from './AIMessageRoute';
import slimscroll from 'util/slimscroll-fixed'; // ✅ ownerDocument/doc 대응 버전 권장
import * as Socket from '../../../socket';
import SeperateDateBar from '../messages/SeperateDateBar';
import bizrunner from '../../../ajax/bizrunner';
import airunner from '../../../ajax/airunner';
import { connect } from 'react-redux';
import { setLoading,setPanelLoading } from '../../../actions';

class AIPopupMessageList extends Component {
  constructor(props) {
    super(props);

    this.setModifyMessage = this.setModifyMessage.bind(this);

    this.state = { modifymessage: -1, isRendering:false };

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

    this._inited = false;
  }

  setModifyMessage(messageid) {
    this.isModify = true;
    this.setState({ ...this.state, modifymessage: messageid });
  }

  componentDidMount() {
    const node = this.refs.chatlistin3;
    if (node) node.addEventListener('slimscroll', this.onSlimscroll);

    if (global.externalParam) {
      let { type } = global.externalParam;
      if (type === 'Hytube') {
        window.addEventListener('message', this.receiveMsgFromParent);
      }
    }

    // 최초 1회 래핑 시도 (팝업 문서 기준)
    this.moveScroll('100000');
  }
  
  receiveMsgFromParent(e) {
    if (e.data !== undefined && e.data === 'logout') {
      new bizrunner().logout();
    }
  }

  componentWillUnmount() {
    const node = this.refs.chatlistin3;
    if (node) node.removeEventListener('slimscroll', this.onSlimscroll);
    window.removeEventListener('message', this.receiveMsgFromParent);
  }

  // 기존 로직 유지 (deprecated 경고는 나중에 마이그레이션)
  componentWillReceiveProps(nextProps) {
    let { list, topMessageID, bottomMessageID, findMessageID } = nextProps.messages;
    this.props.messages.scrollstop = false;
    let preList = this.props.messages.list;
    let preTop = this.props.messages.topMessageID;
    let preBottom = this.props.messages.bottomMessageID;
    let preFind = this.props.messages.findMessageID;

    this.scrollBottom = -1;
    this.scrollTop = -1;

    let prevListChannelid = preList.length > 0 ? preList[0].channel_id + '' : '-1';
    let nextListChannelid = list.length > 0 ? list[0].channel_id + '' : '-1';

    let channelMove = prevListChannelid !== nextListChannelid;
    let listChange = topMessageID !== preTop || bottomMessageID !== preBottom;

    if (findMessageID !== '-1' && preFind.replace('!', '') !== findMessageID.replace('!', '')) {
      this.props.messages.scrollstop = false;
      this.preScrollBottom = -1;
      this.preScrollTop = -1;
      if (channelMove) this.initScrollParam();
    } else if (!channelMove && preTop > topMessageID) {
      // PREV
      const node = this.refs.chatlistin3;
      if (node) this.scrollBottom = node.scrollHeight;
    } else if (!channelMove && topMessageID === preTop && preBottom < bottomMessageID) {
      this.props.messages.scrollstop = false;
      // NEXT or Receive Message
      if (list.length - preList.length === 1) {
        this.scrollBottom = 0;
      } else {
        const node = this.refs.chatlistin3;
        if (node) this.scrollTop = node.scrollTop;
      }
    } else if (channelMove || listChange || this.isFirst) {
      this.scrollBottom = 0;
      this.initScrollParam();
    }
  }

  componentDidUpdate() {
    const node = this.refs.chatlistin3;
    if (!node) return;

    const currentScrollHeight = node.scrollHeight;
    const currentScrollTop = node.scrollTop;

    if (this.isModify) {
      this.isModify = false;
      return;
    }

    if (this.props.messages.scrollstop && (this.precurrentScrollTop - currentScrollTop > 150)) {
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

      if (this.preScroll > -1) this.moveScroll(this.preScroll);
      else this.moveScroll(0);
    } else if (this.prevScrollHeight + 20 < currentScrollHeight) {
      if (this.preScrollBottom > -1 || this.preScrollTop > -1) {
        let scrollHeight = 0;

        if (this.preScrollBottom > -1) {
          scrollHeight = node.scrollHeight - this.preScrollBottom;
          if (scrollHeight > -1) this.preScroll = scrollHeight;
        } else if (this.preScrollTop > -1) {
          this.preScroll = this.preScrollTop;
        }

        if (this.preScroll > -1) this.moveScroll(this.preScroll);
        else this.moveScroll(0);
      }
    }
  }

  initScrollParam() {
    this.preTop = undefined;
    this.preBottom = undefined;
  }

  // ✅ 팝업 문서 기준 slimscroll 초기화 + 스크롤 이동
  moveScroll(height) {
    const el = this.refs.chatlistin3;
    if (!el) return;

    // 팝업에서 내려준 document 우선, 없으면 ownerDocument
    const doc = this.props.popupDocument || el.ownerDocument;

    // 최초 래핑(이미 래핑이면 init 내부에서 무시됨)
    if (!this._inited) {
      const init = new slimscroll({ height: '100%', doc }, [el]); // 요소 배열 + doc
      init.init();
      this._inited = true;
    }

    // 스크롤 이동
    const scroller = new slimscroll({ scrollTo: height || '100000', doc }, [el]);
    scroller.init();
        
    this.prevScrollHeight = el.scrollHeight;
    this.precurrentScrollTop = el.scrollTop;

    if (this.scrollBottom === -1 && this.scrollTop === -1) {
      // FIND
      this.preScrollTop = height;
    }

    if (this.isFirst) this.isFirst = false;
  }

  onSlimscroll(e) {
    const { messages, channelid, isPopup } = this.props;
    const { topMessageID, bottomMessageID, list, hasNext } = messages;
    if (list.length === 0) return;

    const node = this.refs.chatlistin3;
    const api = Socket.getApi();

    if (node.scrollTop === 0) {
      if (topMessageID > 0) {
        if (this.preTop !== topMessageID) {
          this.props.messages.scrollstop = false;
          this.preTop = topMessageID;
          api.selectAIMessageList('PREV', -1, true, isPopup ? 'popup' : 'panel', channelid);
          this.props.messages.hasNext = list.length > 45 ? 1 : 0;
        }
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

  addMentionText(uniquename, username) {
    this.props.onAddMention('@' + username + '(' + uniquename + ')');
  }

  cancelAIRequest = () =>{
    this.props.setLoading(false, this.props.channelid);
    this.props.setPanelLoading(false);
    new airunner().sendQuery({aiCancel : "Y"});
  }

  setRendering = (data)=>{
    this.setState({isRendering : data})
  }
  
  render() {
    const { messages, fontcolor, channelinfo, popupId } = this.props;
    const messagesList = messages.list;
    const isAnonymousChannel = channelinfo.channel_info.channel_type === 3;

    const actionparam = {
      userid: this.props.userid,
      companycode: this.props.companycode,
      action: this.props.action,
      findMessageID: messages.findMessageID,
      modifymessage: this.state.modifymessage,
      setModifyMessage: this.setModifyMessage,
      addMentionText: this.addMentionText.bind(this),
      openDetail: this.props.openDetail,
      moveScroll: this.moveScroll,
    };

    const messageList = messagesList.map((msg, i) => {
      let isSame = false;
      const prevMsg = messagesList[i - 1];
      const isUserMessage = (msg.register_uniqueName !== undefined && msg.register_uniqueName !== '')
        ? (global.CONFIG.login.uniquename === msg.register_uniqueName)
        : false;

      const registerDate = new Date(msg.register_date);
      registerDate.setTime(registerDate.getTime() - registerDate.getTimezoneOffset() * 60 * 1000);

      let prevRegisterDate = prevMsg ? new Date(prevMsg.register_date) : undefined;
      if (prevRegisterDate) prevRegisterDate.setTime(prevRegisterDate.getTime() - prevRegisterDate.getTimezoneOffset() * 60 * 1000);

      if (i > 0 && prevMsg && prevMsg.register_uniqueName === msg.register_uniqueName && msg.type !== 'C') {
        const diff = registerDate.getTime() - prevRegisterDate.getTime();
        if (diff < 120000 && prevMsg.type !== 'C') isSame = true;
      }
      if (prevMsg && prevMsg.type === 'C' && msg.type === 'C' && prevMsg.link_oid === msg.link_oid) isSame = true;

      let isSeperateDateBar = false;
      if ((prevRegisterDate && registerDate.getDate() !== prevRegisterDate.getDate()) || !prevRegisterDate) {
        isSeperateDateBar = true;
        if (isSeperateDateBar) isSame = false;
      }
      
      return [
        isSeperateDateBar && <SeperateDateBar key={`date-${msg.message_id}`} date={registerDate} />,
        <AIMessageRoute
          key={`msg-${i}:${msg.message_id}-ai`}
          message={msg}
          linkedData={messages.linkedData}
          actionparam={actionparam}
          channelinfo={channelinfo.channel_info}
          infosummary={channelinfo}
          isSame={isSame}
          openVotePopup={this.props.openVotePopup}
          fontcolor={fontcolor}
          isUserMessage={isUserMessage}
          setRendering={(data)=>this.setRendering(data)}
        />
      ]
    });

    return (
      // ✅ id를 aiviewMsg-${popupId} 로 맞춘다 (너의 스크롤 바인딩 로직과 동일)
      <div
        id={`aiviewMsg-${popupId}`}
        className="chatlistin"
        ref="chatlistin3"
        style={{ height:'100%' }}
      >
        {messageList}
        {this.props.isLoading &&
          <div className="loaderWrap">
            <div className="loader"></div>
            <div className="loaderInfo">
              <div className="infoText">AI 답변 생성중입니다.</div>
              <button className="cancelBtn" onClick={this.cancelAIRequest}>취소</button>
            </div>
          </div>
        }
      </div>
    );
  }
}

export default connect(null, { setLoading, setPanelLoading })(AIPopupMessageList);