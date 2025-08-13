import React, { Component } from 'react';
import * as Socket from '../../../socket';
import * as Store from 'GlobalStore';
import * as actions from '../../../actions';

class DMChannelItem extends Component {
  constructor(props) {
    super(props);
    this.openChannel = this.openChannel.bind(this);
  }

  openChannel() {
    if (this.props.searchFlag) {
      this.props.onCancelSearchList(this.props.data.channel_id, false);
      // let idx = Store.getChannels().dmchannels.findIndex(c=>c.channel_id === this.props.data.channel_id );
      // if(idx < 0){
      //  let tmpDmlist = {...Store.getChannels().dmchannels}
      //  tmpDmlist.push(this.props.data);
      //  Store.getChannels().dmchannels =tmpDmlist;
      // }
    } else {
      let api = Socket.getApi();
      api.openChannel(this.props.data.channel_id);
    }

    if (typeof this.props.closeModal === 'function') {
      setTimeout(() => {
        this.props.closeModal();
      }, 50);
    }
  }

  alarmSetting() {
    const { data } = this.props;
    let api = Socket.getApi();
    setTimeout(() => {
      api.updateDMChannelNotiYn(data.channel_id, data.notiYn === 'Y' ? 'N' : 'Y');
    }, 200);
  }

  upateFavorite() {
    let { data } = this.props;
    let api = Socket.getApi();
    api.updateFavorite(data.channel_id, data.favorite === 'Y' ? 'N' : 'Y');
  }

  render() {
    let { data, selectedChannel, currentUserName } = this.props;
    let _favoriteClass = (
      <button
        onClick={this.upateFavorite.bind(this)}
        type="button"
        className={data.favorite === 'Y' ? 'star on' : 'star'}
      />
    );
    let hasUnreadMention = data.unreadMention && data.unreadMention > 0;
    let hasUnreadAllMention = data.unreadAllMention && data.unreadAllMention > 0;
    let hasUnreadKeywordMention = data.unreadKeywordMention && data.unreadKeywordMention > 0;
    const alarmSettingClass =
      data.notiYn === 'Y' ? <i className="fa fa-bell" /> : <i className="fa fa-bell-slash" />;

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
      let dmChannelHidden = '';
      if (this.props.searchtext !== undefined) {
        if (channelName.toLowerCase().indexOf(this.props.searchtext) === -1) {
          dmChannelHidden = ' hidden';
        }
      }

      let classKey = '';

      if (hasUnreadMention) {
        classKey = 'roundnum-mention';
      } else if (hasUnreadKeywordMention) {
        classKey = 'roundnum-keywords';
      } else if (hasUnreadAllMention) {
        classKey = 'roundnum-all-mention';
      }

      return (
        <li className={'dmchannel' + dmChannelHidden}>
          <div className="con">
            {_favoriteClass}
            <div className="arrow_box">{channelName}</div>
            {this.props.closeModal !== undefined && (
              <a onClick={this.openChannel} className={selectedChannel ? 'on' : ''} title={channelName}>
                <span>{channelName}</span>
                <span>{data.last_message}</span>
              </a>
            )}
            {this.props.closeModal === undefined && (
              <a onClick={this.openChannel} className={selectedChannel ? 'on' : ''}>
                <span>{channelName}</span>
                <span>{data.last_message}</span>
              </a>
            )}
          </div>
          <div className="etc">
            {this.props.closeModal === undefined && data.member_cnt > 2 && (
              <span className={'dm_alarm' + alarmCutYn} onClick={this.alarmSetting.bind(this)}>
                {alarmSettingClass}
              </span>
            )}
            <span className="ppnum">
              <i className="fa fa-user" />
              {data.member_cnt}
            </span>
            {data.unread > 0 && ( // data.notiYn === 'Y' && ( // 20220310 고TL님 요청 DM 알림차단 언리드 카운트 X -> O로 변경
              <span
                className={`roundnum ${classKey}`}
                onClick={() => this.props.onOpenUnreadMessage(this.props.data.channel_id, true)}
              >
                {data.unread > 99 ? '99+' : data.unread}
              </span>
            )}
          </div>
        </li>
      );
    }
  }
}

export default DMChannelItem;
