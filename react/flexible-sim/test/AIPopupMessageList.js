import React, { Component, Fragment } from 'react';
import AIMessageRoute from './AIMessageRoute';
import slimscroll from 'util/slimscroll';
import * as Socket from 'socket';
import AISeperateDateBar from '../messages/AISeperateDateBar';
import bizrunner from '../../../ajax/bizrunner';
import { connect } from 'react-redux';

class AIPopupMessageList extends Component {
  constructor(props) {
    super(props);
    let language = global.CONFIG.language || {};

    this.language = {
      copied: language['BizworksClipboardCopied'] || '클립보드에 복사되었습니다.',
    };

    this.setModifyMessage = this.setModifyMessage.bind(this);

    this.state = {
      modifymessage: -1, 
      isRendering:false,
    };

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
      console.log('22222222222222', this.props)
     
      this.props.messages.scrollstop = false;
      this.preScrollBottom = -1;
      this.preScrollTop = -1;
      if (channelMove) this.initScrollParam();
    } else if (!channelMove && preTop > topMessageID) {
      // PREV
      console.log('33333333333333333', this.props)

      const node = this.refs.chatlistin3;
      if (node) this.scrollBottom = node.scrollHeight;
    } else if (!channelMove && topMessageID === preTop && preBottom < bottomMessageID) {
      console.log('444444444444', this.props)

      this.props.messages.scrollstop = false;
      // NEXT or Receive Message
      if (list.length - preList.length === 1) {
        this.scrollBottom = 0;
      } else {
        const node = this.refs.chatlistin3;
        if (node) this.scrollTop = node.scrollTop;
      }
    } else if (channelMove || listChange || this.isFirst) {
      console.log('11111111111', this.props)
      this.scrollBottom = 0;
      this.initScrollParam();
    }
  }

  componentDidUpdate() {
    if(this.props.showToastMsg) this.showToast();

    const node = this.refs.chatlistin3;
    const currentScrollHeight = node.scrollHeight;
    const currentScrollTop = node.scrollTop;

    if (this.isModify) {
      this.isModify = false;
    } else if (this.props.messages.scrollstop && (this.precurrentScrollTop - currentScrollTop > 150)) {
      console.log('5555555555', this.props)
    
      return false;
    } else if (this.scrollBottom > -1 || this.scrollTop > -1) {
      console.log('666666666666', this.props)
      console.log('this.scrollBottom > ', this.scrollBottom)
      console.log('this.scrollTop > ', this.scrollTop)

      let scrollHeight = 0;
      if (this.scrollBottom > -1) {
        scrollHeight = node.scrollHeight - this.scrollBottom;
        if (scrollHeight > -1) this.preScroll = scrollHeight;
      } else if (this.scrollTop > -1) {
        this.preScroll = this.scrollTop;
      }

      this.preScrollBottom = this.scrollBottom;
      this.preScrollTop = this.scrollTop;

      if (this.preScroll > -1) {
        this.moveScroll(this.preScroll);
      }else{
        this.moveScroll(0);
      } 
    } else if (this.prevScrollHeight + 20 < currentScrollHeight) {
      console.log('7777777777', this.props)

      if (this.preScrollBottom > -1 || this.preScrollTop > -1) {
        let scrollHeight = 0;
        if (this.preScrollBottom > -1) {
          scrollHeight = node.scrollHeight - this.preScrollBottom;
          if (scrollHeight > -1) this.preScroll = scrollHeight;
        } else if (this.preScrollTop > -1) {
          this.preScroll = this.preScrollTop;
        }

        if (this.preScroll > -1) {
          this.moveScroll(this.preScroll);
        }else{
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
      console.log('999999999', height)

    const node = this.refs.chatlistin3;
    const el = this.refs.chatlistin3;
    if (!el) return;

    const doc = this.props.popupDocument || el.ownerDocument;
    const idSelector = `#aiviewMsg-${this.props.channelid}`;

    const scroller = new slimscroll({ scrollTo: height || '100000', doc, idSelector }, [el]);
    scroller.init();
        

    this.prevScrollHeight = node.scrollHeight;
    this.precurrentScrollTop = node.scrollTop;

    if (this.scrollBottom === -1 && this.scrollTop === -1) {
      console.log('888888888888', this.props)

      this.preScrollTop = height;
    }

    if (this.isFirst) this.isFirst = false;
  }

  onSlimscroll(e) {
    const { messages, channelid } = this.props;
    const { topMessageID, bottomMessageID, list, hasNext } = messages;
    if (list.length === 0) {
      return;
    } 

    const node = this.refs.chatlistin3;
    const api = Socket.getApi();

    if (node.scrollTop === 0) {
      if (topMessageID > 0) {
        if (this.preTop !== topMessageID) {
          this.props.messages.scrollstop = false;
          this.preTop = topMessageID;
          api.selectAIMessageList('PREV', -1, true, channelid);
          this.props.messages.hasNext = list.length > 45 ? 1 : 0; // Go to Recent 표시 처리
        }
      }
    } else if (Math.round(node.scrollTop) + node.offsetHeight === node.scrollHeight && bottomMessageID > 0) {
      if (this.preBottom !== bottomMessageID && hasNext) {
        this.props.messages.scrollstop = false;
        this.preBottom = bottomMessageID;
        api.selectAIMessageList('NEXT', -1, true, channelid);
      } else {
        // api.selectAIMessageList('NEXT', -1, true, channelid);
      }
    }
    e.stopPropagation();
  }

  addMentionText(uniquename, username) {
    this.props.onAddMention('@' + username + '(' + uniquename + ')');
  }

  setRendering = (data)=>{
    this.setState({isRendering : data})
  }

  showToast = () =>{
    this.refs.termcopylayer3.className = 'termcopylayer3 active';
    setTimeout(() => {
      this.refs.termcopylayer3.className = 'termcopylayer3 fadeout';
    }, 1000);

    if(this.props.showToastMsg) this.props.offToastMsg();
  }
  
  render() {
    let { image } = global.CONFIG.resource;
    const { messages, fontcolor, channelid } = this.props;
    const messagesList = messages.list;

    const actionparam = {
      userid: this.props.userid,
      companycode: this.props.companycode,
      action: this.props.action,
      findMessageID: messages.findMessageID,
      modifymessage: this.state.modifymessage,
      setModifyMessage: this.setModifyMessage,
      addMentionText: this.addMentionText.bind(this),
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
        isSeperateDateBar && <AISeperateDateBar key={`date-${msg.message_id}`} date={registerDate} />,
        <AIMessageRoute
          key={`msg-${i}:${msg.message_id}-ai`}
          message={msg}
          linkedData={messages.linkedData}
          actionparam={actionparam}
          isSame={isSame}
          openVotePopup={this.props.openVotePopup}
          fontcolor={fontcolor}
          isUserMessage={isUserMessage}
          setRendering={(data)=>this.setRendering(data)}
          isAiPopup={true}
          popupDocument={this.props.popupDocument}
          popupId={channelid}
          handleSourcePopup={this.props.handleSourcePopup}
          handleMarkdownPopup={this.props.handleMarkdownPopup}
          showToast={this.showToast}
        />
      ]
    });

    return (
      <div
        id={`aiviewMsg-${channelid}`}
        className="chatlistin aipopupMsg"
        ref="chatlistin3"
        style={{ height:'100%' }}
      >
        {messageList}
        {this.props.isLoading &&
          <div className="loaderWrap">
            <div className="loader">
              <img src={image + '/aiassistant/loading.gif'} alt="icon_send" style={{height: 'auto'}} />
            </div>
            <div className="loaderInfo">
              <div className="infoText">AI 답변 생성중입니다.</div>
            </div>
          </div>
        }
        <div className="termcopylayer3" ref="termcopylayer3" >
          <span className="termcopymsg">{this.language.copied}</span>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    threadInfoSummary: state.aiThread.threadInfoSummary,
    currentThreadId: state.aiThread.currentChannel
  };
};

export default connect(mapStateToProps)(AIPopupMessageList);
