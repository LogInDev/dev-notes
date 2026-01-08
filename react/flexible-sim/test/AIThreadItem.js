import React, { Component } from 'react';
import * as Socket from 'socket';
import * as Store from 'GlobalStore';
import OpenDialogPop from 'components/popup/OpenDialogPop/OpenDialogPop';
import { ModalContainer, ModalDialog } from 'react-modal-dialog';
import { connect } from 'react-redux';

class AIThreadItem extends Component {
  constructor(props) {
    super(props);

    this.popHeight = 700;
    this.openAIThread = this.openAIThread.bind(this);
    this.onOpenModal = this.onOpenModal.bind(this);
    this.state = {
      isHovered: false,
      isShowOpenDialogModal:false,
    };
  }

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  openAIThread() {
    const threadId = this.props.data.channel_id;
    this.props.closePopup(threadId)
    let api = Socket.getApi();
    api.openAIThreadPanel(threadId);
  }

  alarmSetting() {
    const { data } = this.props;
    let api = Socket.getApi();
    setTimeout(() => {
      api.updateDMChannelNotiYn(data.channel_id, data.notiYn === 'Y' ? 'N' : 'Y');
    }, 200);
  }

  deleteAIThread = () =>{
    const threadId = this.props.threadId
    this.setState({isShowOpenDialogModal: false})
    this.props.deleteThread(threadId)
  }

  onOpenModal() {
    this.setState({
      ...this.state,
      isShowOpenDialogModal: true,
      // isRepopup: true,
      // data: msg || {},
    })
  }
  
  onCloseModal() {
    this.setState({
      //...this.state,
      isShowOpenDialogModal: false,
      // isRepopup: false,
    });
  }

  renderOpenDialog() {
      return (
        <ModalContainer>
          <ModalDialog>
            <OpenDialogPop
              onClose={this.onCloseModal.bind(this)}
              explosion={this.deleteAIThread}
              channelid={this.props.data.channel_id}
              isThread={true}
              callback={this.callback}
            />
          </ModalDialog>
        </ModalContainer>
      );
    }

  onMouseDownTerm(e) {
    let rightclick;
    if (e.which) rightclick = e.which === 3;
    else if (e.button) rightclick = e.button === 2;

    if (rightclick) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  upateFavorite = ()=> {
    let { data } = this.props;
    let api = Socket.getApi();
    api.updateFixThread(data.channel_id, data.favorite === 'Y' ? 'N' : 'Y');
  }

  render() {
    let { image } = global.CONFIG.resource;

    let { isHovered } = this.state;
    let { data, selectedChannel, currentUserName, openedPopupThreads, threadId } = this.props;
    let hasUnreadMention = data.unreadMention && data.unreadMention > 0;
    let hasUnreadAllMention = data.unreadAllMention && data.unreadAllMention > 0;
    let hasUnreadKeywordMention = data.unreadKeywordMention && data.unreadKeywordMention > 0;
    const alarmSettingClass =
      data.notiYn === 'Y' ? <i className="fa fa-bell" /> : <i className="fa fa-bell-slash" />;

    let classKey = '';

    if (hasUnreadMention) {
      classKey = 'roundnum-mention';
    } else if (hasUnreadKeywordMention) {
      classKey = 'roundnum-keywords';
    } else if (hasUnreadAllMention) {
      classKey = 'roundnum-all-mention';
    }

    let alarmCutYn = '';
    if (data.notiYn === 'N') {
      alarmCutYn = '_cut';
    }

    if (data.leave === 'Y') {
      return false;
    } else {
      let viewname = '';
      if (data.name) {
        if (currentUserName && data.name.indexOf(',') > -1 && data.name.indexOf(currentUserName) > -1) {
          viewname = data.name.replace(currentUserName + ', ', '').replace(currentUserName + ',', '');
          viewname = viewname.replace(', ' + currentUserName, '').replace(',' + currentUserName, '');
        } else viewname = data.name;
      } else if (data.channel_name) {
        if (
          currentUserName &&
          data.channel_name.indexOf(',') > -1 &&
          data.channel_name.indexOf(currentUserName) > -1
        ) {
          viewname = data.channel_name
            .replace(currentUserName + ', ', '')
            .replace(currentUserName + ',', '');
          viewname = viewname.replace(', ' + currentUserName, '').replace(',' + currentUserName, '');
        } else viewname = data.channel_name;
      }
      let channelName = data.aliasChannelName ? data.aliasChannelName : viewname;
      // let isOpened = openedPopupThreads.find(thread => thread === threadId);

      return (
        <li className='dmchannel'
          data-id={this.props.threadId} 
          key={this.props.threadId}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          >
            <div className="con">
              <button
                onClick={this.upateFavorite}
                type="button"
                className={data.favorite === 'Y' ? 'star on' : 'star'}
              />
                <a 
                  onClick={this.openAIThread}
                  className={this.props.selectedChannel ? 'on' : ''} title='channelName' 
                  onMouseDown={this.onMouseDownTerm}
                  onContextMenu={(e) => this.props.openThreadPopup(e, this.props.threadId)}  
                >
                  <span 
                    // style={isOpened ? {color:'#FFB80A'} : {}}
                  >{channelName}</span>
                </a>
            </div>
            <div className="aibtn">
            {/* {data.unread > 0 && ( 
              <span
                className={`roundnum ${classKey}`}
                onClick={() => this.props.onOpenUnreadMessage(this.props.data.channel_id, true)}
              >
                {data.unread > 99 ? '99+' : data.unread}
              </span>
            )} */}
            {isHovered &&
              <div>
                <button onClick={(e) => this.onOpenModal(e)} >
                  <img src={image + '/aiassistant/icon_x_red.png'} />
                </button>
              </div>
            }
            </div>
            {this.state.isShowOpenDialogModal && this.renderOpenDialog()}
          </li>
      );
    }
  }
}


const mapStateToProps = (state) => {
  return {
    // openedPopupThreads: state.aiThread.currentPopupThread
  };
};

// export default connect(mapStateToProps)(AIThreadItem);
export default AIThreadItem;

