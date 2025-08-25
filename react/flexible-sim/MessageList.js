import React, { Component } from 'react';
//import ReactDOM from 'react-dom';
import MessageRoute from './MessageRoute';
import slimscroll from 'util/slimscroll';
import * as Socket from '../../../socket';
import SeperateDateBar from './SeperateDateBar';
import * as Store from 'GlobalStore';
import bizrunner from '../../../ajax/bizrunner';

class MessageList extends Component {
  constructor(props) {
    super(props);

    this.setModifyMessage = this.setModifyMessage.bind(this);

    this.state = {
      modifymessage: -1
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
  }

  setModifyMessage(messageid) {
    this.isModify = true;
    this.setState({ ...this.state, modifymessage: messageid });
  }

  componentDidMount() {
    var node = this.refs.chatlistin;
    node.addEventListener('slimscroll', this.onSlimscroll);

    if (global.externalParam) {
      let { type } = global.externalParam;
      if (type === 'Hytube') {
        window.addEventListener( 'message', this.receiveMsgFromParent );
        // 부모로부터 메시지 수신        
      }
    }
  }
  
  receiveMsgFromParent( e ) {
    // e.data가 전달받은 메시지
    console.log('부모로 부터 받은 메시지 ', e.data );
    if(e.data !== undefined && e.data === 'logout') {
      new bizrunner().logout();
    }
  }

  componentWillUnmount() {
    let node = this.refs.chatlistin;
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
      this.props.messages.scrollstop = false;
      // FIND
      this.preScrollBottom = -1;
      this.preScrollTop = -1;
      if (channelMove) {
        this.initScrollParam();
      }
    } else if (!channelMove && preTop > topMessageID) {
      // PREV
      this.scrollBottom = this.refs.chatlistin.scrollHeight;
    } else if (!channelMove && topMessageID === preTop && preBottom < bottomMessageID) {
      this.props.messages.scrollstop = false;
      // NEXT or Receive Message
      if (list.length - preList.length === 1) {
        this.scrollBottom = 0;
      } else {
        this.scrollTop = this.refs.chatlistin.scrollTop;
      }
    } else if (channelMove || listChange || this.isFirst) {
      // DIR
      this.scrollBottom = 0;
      this.initScrollParam();
    }
  }

  componentDidUpdate() {
    let currentScrollHeight = this.refs.chatlistin.scrollHeight;
    let currentScrollTop = this.refs.chatlistin.scrollTop;

    if (this.isModify) {
      this.isModify = false;
    } else if (this.props.messages.scrollstop && (this.precurrentScrollTop - currentScrollTop > 150)) { // 새글왔을때 유지
      return false;
    } else if (this.scrollBottom > -1 || this.scrollTop > -1) {
      let node = this.refs.chatlistin; //ReactDOM.findDOMNode(this);
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
        let node = this.refs.chatlistin;
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
      idSelector: '#message',
      scrollTo: height || '100000'
    });
    this.slimscroll.init();

    this.prevScrollHeight = this.refs.chatlistin.scrollHeight;
    this.precurrentScrollTop = this.refs.chatlistin.scrollTop;
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
    let { topMessageID, bottomMessageID, list, hasPrev, hasNext } = this.props.messages;

    if (list.length === 0) {
      return;
    } 

    let node = this.refs.chatlistin;
    let api = Socket.getApi();
    // console.debug('bottomMessageID = ', bottomMessageID);
    // console.debug('node.scrollTop = ', Math.round(node.scrollTop));
    // console.debug('node.offsetHeight = ', node.offsetHeight);
    // console.debug('node.scrollHeight = ',node.scrollHeight);
    if (node.scrollTop === 0) {
      if (topMessageID > 0) {
        if (this.preTop !== topMessageID) {
          this.props.messages.scrollstop = false;
          this.preTop = topMessageID;
          api.selectMessageList('PREV');
          if (list.length > 45) {
            this.props.messages.hasNext = 1; // Go to Recent 표시 처리
          } else {
            this.props.messages.hasNext = 0;
          }
        }
      }
    } else if (Math.round(node.scrollTop) + node.offsetHeight === node.scrollHeight && bottomMessageID > 0) {
      if (this.preBottom !== bottomMessageID && hasNext) {
        this.props.messages.scrollstop = false;
        this.preBottom = bottomMessageID;
        api.selectMessageList('NEXT');
      }else{
        // api.selectMessageList('NEXT');
      }
    }
    e.stopPropagation();
  }

  addMentionText(uniquename, username) {
    this.props.onAddMention('@' + username + '(' + uniquename + ')');
  }

  render() {
    let messages = this.props.messages.list;
    let isAnonymousChannel = this.props.channelinfo.channel_info.channel_type === 3;

    let actionparam = {
      userid: this.props.userid,
      companycode: this.props.companycode,
      action: this.props.action,
      findMessageID: this.props.messages.findMessageID,
      modifymessage: this.state.modifymessage,
      setModifyMessage: this.setModifyMessage,
      addMentionText: this.addMentionText.bind(this),
      openDetail: this.props.openDetail,
      moveScroll: this.moveScroll,
      openMessageTerm: this.props.openMessageTerm
    };

    let messageList = messages.map((msg, i) => {
      let isSame = false;
      let prevMsg = messages[i - 1];

      let registerDate = new Date(msg.register_date);
      registerDate.setTime(registerDate.getTime() - registerDate.getTimezoneOffset() * 60 * 1000);

      let prevRegisterDate = prevMsg === undefined || prevMsg === null ? undefined : new Date(prevMsg.register_date);
      if (prevRegisterDate !== undefined) prevRegisterDate.setTime(prevRegisterDate.getTime() - prevRegisterDate.getTimezoneOffset() * 60 * 1000);

      if (i > 0 && prevMsg.register_uniqueName === msg.register_uniqueName && msg.type !== 'C') {
        let diff = registerDate.getTime() - prevRegisterDate.getTime();
        if (diff < 120000 && prevMsg.type !== 'C') isSame = true;
      }

      if (prevMsg && prevMsg.type === 'C' && msg.type === 'C' && prevMsg.link_oid === msg.link_oid)
        isSame = true;

      let isSeperateDateBar = false;

      if ((prevRegisterDate && registerDate.getDate() !== prevRegisterDate.getDate()) || !prevRegisterDate) {
        isSeperateDateBar = true;
        if (isSeperateDateBar) isSame = false;
      }
      
      return [
        isSeperateDateBar && <SeperateDateBar date={registerDate} />,
        <MessageRoute
          key={i + ':' + msg.message_id}
          message={msg}
          linkedData={this.props.messages.linkedData}
          actionparam={actionparam}
          channelinfo={this.props.channelinfo.channel_info}
          infosummary={this.props.channelinfo}
          isSame={isSame}
          openVotePopup={this.props.openVotePopup}
          fontcolor={this.props.fontcolor}
        />
      ];
    });

    return (
      <div id="message" className="chatlistin" ref="chatlistin">
        {messageList}
      </div>
    );
  }
}

export default MessageList;
