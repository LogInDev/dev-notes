import React from 'react';
import ReactDOM from 'react-dom';
import MessageBase from './MessageBase';
import * as Socket from '../../../socket';
import * as Store from 'GlobalStore';
import MessageRoute from './MessageRoute';
import * as Actions from 'actions';

const defaultProps = {
  hasOverlink: true,
};

class MessageItem extends MessageBase {
  constructor(props) {
    super(props);
    this.cancelModify = this.cancelModify.bind(this);
    this.saveModify = this.saveModify.bind(this);
    this.onContextMenuTerm = this.onContextMenuTerm.bind(this);
    this.onMouseDownTerm = this.onMouseDownTerm.bind(this);
    this.state = {
      ...this.state,
      ogdata: {},
    };
    this.lbindex = 0;
    this.modifyboxHeight = 0;
  }

  cancelModify() {
    this.props.actionparam.setModifyMessage(-1);
  }

  saveModify() {
    Socket.getApi().updateMessage(this.props.message.message_id, this.refs.modifybox.value);
    this.props.actionparam.setModifyMessage(-1);
  }

  onChangeModifyBox() {
    this.refs.modifybox.style.height = 0;
    if (this.modifyboxHeight !== this.refs.modifybox.scrollHeight) {
      this.modifyboxHeight = this.refs.modifybox.scrollHeight;
    }
    this.refs.modifybox.style.height = this.modifyboxHeight + 'px';
  }

  onKeyDown(e) {
    if (e.which === 13 && !e.shiftKey) {
      e.stopPropagation();
      e.preventDefault();
      this.saveModify();
    }
  }

  detailMove(oid) {
    let { actionparam, message } = this.props;
    if (!message.content.indexOf('&msgtype=H')) {
      actionparam.openDetail(oid);
    }
  }

  onContextMenuTerm(e) {
    e.preventDefault();
    this.props.actionparam.openMessageTerm(this.props.message.content);
  }

  onMouseDownTerm(e) {
    let rightclick;
    if (e.which) rightclick = e.which === 3;
    else if (e.button) rightclick = e.button === 2;

    if (rightclick) {
      let copytext = this.props.message.content.trim() + '';
      if (this.is_ie()) {
        window.clipboardData.setData('Text', copytext);
      } else {
        let textarea = document.createElement('textarea');
        textarea.textContent = copytext;
        document.body.appendChild(textarea);

        let selection = document.getSelection();
        let range = document.createRange();
        range.selectNode(textarea);

        selection.removeAllRanges();
        selection.addRange(range);

        // console.log('copy success', document.execCommand('copy'));
        document.execCommand('copy');
        selection.removeAllRanges();

        document.body.removeChild(textarea);
      }
      this.refs.termcopylayer2.className = 'termcopylayer2 active';
      setTimeout(() => {
        this.refs.termcopylayer2.className = 'termcopylayer2 active fadeout';
      }, 1000);

      // e.preventDefault();
      // e.stopPropagation();
      // this.props.actionparam.openMessageTerm(this.props.message.content);
      // e.stopImmediatePropagation();
      // return false;
    }
  }

  is_ie() {
    if (navigator.userAgent.toLowerCase().indexOf('chrome') !== -1) return false;
    if (navigator.userAgent.toLowerCase().indexOf('msie') !== -1) return true;
    if (navigator.userAgent.toLowerCase().indexOf('windows nt') !== -1) return true;
    return false;
  }

  componentDidMount() {
    const { message } = this.props;

    if (!this.props.isCopy && message.content !== undefined && message.content !== null) {
      if (
        message.content.indexOf(global.Common.urlPattern.bizworks) > 0 ||
        message.content.indexOf(global.Common.urlPattern.bizworks2) > 0
      ) {
        const { linkedData } = Store.getMessages();
        let start = message.content.indexOf('messageid=') + 10;
        let msgid = message.content.substring(start, start + 19);

        let idx = linkedData.findIndex((linked) => linked.message_id === msgid);
        if (idx === -1) {
          Socket.getApi().selectMessage({ messageID: msgid }, (msg) => {
            // console.debug('76767676767676767676767');
            Store.getStore().dispatch(Actions.updateLinkData(msg));
          });
        }

        this.setState({ ...this.state, linked_oid: message.message_id }, () => {});
      }
    }

    if (!this.props.isCopy) {
      let findMessageID = this.props.actionparam ? this.props.actionparam.findMessageID : '-1';

      if (findMessageID !== '-1' && findMessageID.startsWith(this.props.message.message_id + '')) {
        let a = ReactDOM.findDOMNode(this);
        this.props.actionparam.moveScroll(a.offsetTop);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.actionparam.modifymessage !== nextProps.actionparam.modifymessage &&
      this.props.message.message_id === nextProps.actionparam.modifymessage
    ) {
      this.modifyboxHeight = this.refs.originbox.scrollHeight;
    }
  }

  renderChatBox() {
    const { linkedData } = Store.getMessages();
    const { message } = this.props;
    let data = [];

    if (!this.props.isCopy && message.content !== undefined && message.content !== null) {
      if (
        message.content.indexOf(global.Common.urlPattern.bizworks) > 0 ||
        message.content.indexOf(global.Common.urlPattern.bizworks2) > 0
      ) {
        data = message.content.split('\n').map((msg) => {
          let start = msg.indexOf('messageid=') + 10;
          let msgid = msg.substring(start, start + 19);
          let idx = linkedData.findIndex((linked) => linked.message_id === msgid);

          if (idx > -1) {
            return (
              <div className="chatbox" onClick={() => this.detailMove(msgid)}>
                <MessageRoute
                  key={message.message_id + '-' + msgid}
                  message={linkedData[idx]}
                  actionparam={{ ...this.props.actionparam, isCopy: true }}
                  isSame={false}
                  hasOverlink={false}
                  isCopy={true}
                  channelinfo={this.props.channelinfo}
                />
              </div>
            );
          }
        });
      }
    }

    return data;
  }

  renderWebMetaItem(result) {
    let image = result.image ? result.image : '';
    if (image.startsWith('/')) image = result.url + image;

    return (
      <a className="webmeta" href={result.url} target="_blank">
        <div className="chatbox webmeta">
          <div className="image">
            <img src={image} onError={(i) => (i.target.style.display = 'none')} />
          </div>
          {result.title && (
            <div className="chatuser">
              <span className="name">{result.title}</span>
            </div>
          )}
          <div className="chatmsg">{result.description}</div>
        </div>
      </a>
    );
  }

  renderWebMeta() {
    const { og } = Store.getMessages();
    const { message } = this.props;

    let data = [],
      data1 = [];
    if (message.og) {
      data = message.og.map((meta, idx) => {
        if (meta.url !== undefined && meta.url !== null && meta.url !== '')
          return this.renderWebMetaItem(meta);
        else {
          return false;
        }
      });
    }

    data1 = og.map((meta, idx) => {
      if (meta.message_id === message.message_id && meta.result) {
        const { result } = meta;

        if (result.url !== undefined && result.url !== null && result.url !== '')
          return this.renderWebMetaItem(result);
        else {
          return false;
        }
      } else {
        return false;
      }
    });

    return data.concat(data1);
  }

  renderContent() {
    let msg = this.props.message;
    // console.debug('msg111111 ===== ' + JSON.stringify(msg));
    let lastMarks = [];
    if (msg.reply_cnt !== undefined && msg.type === 'M' && msg.reply_cnt > 0) {
      lastMarks.push(<span className="">{' [' + msg.reply_cnt + ']'}</span>);
    }
    const commentActions = [
      {
        actName: 'CommentAction4',
        icon: 'ico_recommand',
        msgKey: this.language.CommentAction4,
        className: '',
      },
      {
        actName: 'CommentAction0',
        icon: 'like_circle',
        msgKey: this.language.CommentAction0,
        className: 'like',
      },
      {
        actName: 'CommentAction2',
        icon: 'awesome_circle',
        msgKey: this.language.CommentAction2,
        className: '',
      },
      {
        actName: 'CommentAction3',
        icon: 'smile_circle',
        msgKey: this.language.CommentAction3,
        className: '',
      },
      {
        actName: 'CommentAction5',
        icon: 'checking_circle',
        msgKey: this.language.CommentAction5,
        className: '',
      },
      {
        actName: 'CommentAction1',
        icon: 'checkmark_circle',
        msgKey: this.language.CommentAction1,
        className: 'checkmark',
      },
    ];
    commentActions.forEach((action, i) => {
      const { icon, msgKey, className, actName } = action;
      if (msg[actName] && msg[actName] > 0)
        lastMarks.push(
          <span className={`comment-action ${className}`} key={i}>
            <img
              src={`${global.CONFIG.resource.image}/ico/${icon}.png`}
              onClick={() => this.toggleCommentReaction(actName)}
              alt={msgKey}
            />
            {msg[actName]}
          </span>
        );
      // if (msg.type === 'C') {
      //   lastMarks.push(
      //     <span className={`comment-action ${className}`} key={i}>
      //       <img src={`${global.CONFIG.resource.image}/ico/${icon}.png`} onClick={this.toggleLike.bind(this)} alt={msgKey}/>
      //       {msg[action] || 1}
      //     </span>
      //   );
      // }
    });

    if (
      !this.props.isCopy &&
      this.props.actionparam &&
      this.props.message.message_id === this.props.actionparam.modifymessage
    ) {
      return (
        <div className="chatmsg">
          <div className="mesagemody">
            <textarea
              ref="modifybox"
              style={{ height: this.modifyboxHeight + 'px' }}
              onKeyDown={this.onKeyDown.bind(this)}
            >
              {this.props.message.content}
            </textarea>
            <div className="modybtns">
              <button onClick={this.saveModify} type="button" className="save">
                <i className="icon-check cgreen" />
              </button>
              <button onClick={this.cancelModify} type="button" className="cancel">
                ``
                <i className="icon-close" />
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      //let regx = /((http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?)/g;
      let html = this.renderMarkdown(this.props.message.content);
      let fontcolor = this.props.message.fontColor;
      // if (this.props.message.register_id === global.CONFIG.login.userid && this.props.fontcolor !== this.props.message.fontColor) {
      //   fontcolor = this.props.fontcolor;
      // }
      //this.props.message.register_id;
      return (
        <div
          key={'chatmsg_' + this.props.message.message_id}
          className="chatmsg"
          id="chatmsg"
          ref="originbox"
          style={{ color: fontcolor }}
          // style={{ color: this.props.fontcolor }}
          onContextMenu={this.onContextMenuTerm}
          onMouseDown={this.onMouseDownTerm}
        >
          {html}
          {lastMarks}
          {this.uptimeString && <span className="edited"> (edited)</span>}
          <div className="termcopylayer2 active fadeout" ref="termcopylayer2">
            <span className="termcopymsg">{this.language.copied}</span>
          </div>
        </div>
      );
    }
  }
}

MessageItem.defaultProps = defaultProps;

export default MessageItem;
