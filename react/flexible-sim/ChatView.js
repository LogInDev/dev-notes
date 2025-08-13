import React, { Component } from 'react';
import ChatTop from './chat/ChatTop';
import MiniChatTop from './chat/MiniChatTop';
import DetailView from './DetailView';
import MessageList from './messages/MessageList';
import { connect } from 'react-redux';
import * as Socket from '../../socket';
import * as actions from '../../actions';
import * as Store from 'GlobalStore';
import * as Services from 'services';
import CommandList from './chat/autocomplete/CommandList';
import MentionList from './chat/autocomplete/MentionList';
import TutorialView from './chat/TutorialView';
import AppList from './chat/AppList';
import EmoticonList from './chat/EmoticonList'; //emoticon 추가
// import ReactDOM from 'react-dom';
import XHRUploader from 'util/XHRUploader';
import SelectFileCategory from 'components/popup/SelectFileCategory';
import AnonymousSetting from 'components/popup/AnonymousSetting';
import EditVote from 'components/popup/EditVote';
import AddReservationMessage from './chat/AddReservationMessage';
import AddMember from 'components/popup/AddMemberWithFavorite';
import MemberItem from './messages/MemberItem';
import Log from 'logger/log';
import Glossary from 'components/popup/Glossary';
import OpenDialogPop from 'components/popup/OpenDialogPop/OpenDialogPop';
import { ModalContainer, ModalDialog } from 'react-modal-dialog';
import HistoryList from './chat/autocomplete/HistoryList';
import WrittingList from './chat/autocomplete/WrittingList';
import TermList from './chat/TermList';
import ViewVote from 'components/popup/ViewVote';
import slimscroll from 'slimscroll';
import VoteList from 'components/popup/VoteList';
import TransList from './chat/TransList';
import ChatBotList from './chat/ChatBotList';
import bizrunner from '../../ajax/bizrunner.js';
import moment from 'moment';
import Giphy from 'components/popup/Giphy';
import TmsLimitMsg from '../popup/TmsLimitMsg';
import LinkParserToJsx from './LinkParserToJsx.js';
import ConfirmAlert from '../popup/ConfirmAlert.js';

class ChatView extends Component {
  constructor(props) {
    super(props);

    let language = global.CONFIG.language || {};

    this.language = {
      confirmChannelLeave: language['BizWorksConfirmChannelLeave'] || '현재채널에서 탈퇴하시겠습니까?',
      chatInputWindow:
        language['BizWorksEditMessage'] ||
        '여기에 메시지를 입력하세요. 스페이스바 한번으로 할일 입력이 가능해졌습니다!',
      chatInputNoticeWindow:
        language['BizWorksNoticeChannelMessage'] || '공지 채널에서는 채널관리자만 입력이 가능합니다.',
      newMessageReceive: language['BizWorksArrivedNewMessage'] || '새 메시지가 도착하였습니다.',
      //anonymousSetting: language['BizWorksAnonymousSetting'] || '닉네임 및 프로필 설정',
      notEnterAnonymousChannel:
        language['BizWorksNotEnterAnonymousChannel'] ||
        '닉네임 및 사진을 등록하지 않으면 익명채널에 입장하실 수 없습니다.',
      uploadFileSetup: language['BizWorksUploadFileSetup'] || '파일 설정',
      anonymousSettingLanguage: language['BizWorksNickAndPhotoSetting'] || '닉네임 및 사진 설정',
      chatInputAnnoymousWindow:
        language['BizWorksEditAnnoymousMessage'] || '여기에 메시지를 입력하세요.',
      voteMsg: language['BizWorksVoteType'] || '투표', //TODO
      commentMsg: language['BizWorksCommentType'] || '의견취합', //TODO,
      last1Msg: language['BizworksChannelVoteMsg'] || '{VOTENAME} 1건이 진행중입니다.',
      last2Msg: language['BizworksChannelVoteListMsg'] || '{VOTENAME} 외 {COUNT}건이 진행중입니다.',
      anonymouseFreezingInputMsg:
        language['BizWorksFreezingMessage'] || '현재 채널은 채널관리자에 의해 입력이 제한 되었습니다.',
      BizWorksFreezingAdminMessage:
        language['BizWorksFreezingAdminMessage'] ||
        '메시지 입력 제한이 설정되어 있습니다.\n해제 시 채널 상단의 메시지 입력 제한 아이콘을 클릭해주세요.',
      BizWorksFreezingMessage:
        language['BizWorksFreezingMessage'] ||
        '현재 채널은 채널 관리자에 의해 입력이 제한 되었습니다. 제한 해제는 채널 관리자에게 문의해주세요. ',
      BizWorksNotificationFreezingOff: language['BizWorksNotificationFreezingOff'] || '메시지입력 제한',
      BizWorksNotificationFreezingOn: language['BizWorksNotificationFreezingOn'] || '메시지입력 허용',

      BizWorksNotificationFreezingInputMsg1:
        language['BizWorksNotificationFreezingInputMsg1'] ||
        '현재 채널은 채널 관리자에 의해 입력이 제한 되었습니다. 제한 해제는 채널 관리자에게 문의해주세요.',

      BizWorksNotificationFreezingInputMsg2:
        language['BizWorksNotificationFreezingInputMsg2'] || '메시지 입력 제한이 설정되어 있습니다.',
      BizWorksNotificationFreezingInputMsg3:
        language['BizWorksNotificationFreezingInputMsg3'] ||
        '해제 시 채널 상단의 메시지 입력 제한 아이콘을 클릭해주세요.',

      BizWorksNotificationFreezingInputMsg4:
        language['BizWorksNotificationFreezingInputMsg4'] ||
        '현재 채널은 채널관리자만 메시지 입력이 가능합니다.',
      BizWorksNotificationFreezingInputMsg5:
        language['BizWorksNotificationFreezingInputMsg5'] || '제한 해제는 채널 관리자에게 문의해주세요.',
      limitSendingMsgOvertime:
        language['BizWorksLimitSendingMsgOvertime'] ||
        '현재 채널은 {STARTTIME}부터 {ENDTIME}까지 메시지 발송이 제한되며,\n{AFTERTIME} 이후 일괄전송 됩니다.',
      BizWorksGIFSearch: language['BizWorksGIFSearch'] || 'GIF 검색',
      alertLimitHyGPTMsg:
        language['BizWorksAlertLimitHyGPTMsg'] || '채팅 내용은 500자를 초과할 수 없습니다.',
      addToDo: language['BizWorksAddToDo'] || '할일등록',

      // secretDocNotCopyMoveChannelAndDM : language['[다국어 key값]'] || '비밀 문서를 DM/채널로 복사/이동할 수 없습니다.',
    };

    this.setLayerPopup = this.setLayerPopup.bind(this);
    this.setLayerAnonymousPopup = this.setLayerAnonymousPopup.bind(this);
    this.onKeyDownEvent = this.onKeyDownEvent.bind(this);
    this.onKeyUpEvent = this.onKeyUpEvent.bind(this);
    this.getMentionList = this.getMentionList.bind(this);
    this.getSpacesList = this.getSpacesList.bind(this);
    this.getCategoriesList = this.getCategoriesList.bind(this);
    this.getTasksList = this.getTasksList.bind(this);
    this.selectCommand = this.selectCommand.bind(this);
    this.selectMention = this.selectMention.bind(this);
    this.selectSpacesList = this.selectSpacesList.bind(this);
    this.selectCategoriesList = this.selectCategoriesList.bind(this);
    this.selectTasksList = this.selectTasksList.bind(this);
    this.setCommandCursor = this.setCommandCursor.bind(this);
    this.setCommandCompanyCode = this.setCommandCompanyCode.bind(this);
    this.setMentionCursor = this.setMentionCursor.bind(this);
    this.onChangeInputBox = this.onChangeInputBox.bind(this);
    this.onPasteEvent = this.onPasteEvent.bind(this);
    this.onChangesearchArea = this.onChangesearchArea.bind(this);
    this.executeCommand = this.executeCommand.bind(this);
    this.openDetail = this.openDetail.bind(this);
    this.openUrl = this.openUrl.bind(this);
    this.handleChannelDeleteCancel = this.handleChannelDeleteCancel.bind(this);
    this.onCloseModal = this.onCloseModal.bind(this);
    this.onClickChatbot = this.onClickChatbot.bind(this);
    this.onCloseChatbotNotice = this.onCloseChatbotNotice.bind(this);
    this.setHistoryCursor = this.setHistoryCursor.bind(this);
    this.selectHistory = this.selectHistory.bind(this);
    this.copyChannelID = this.copyChannelID.bind(this);
    this.time = 60;
    this.start = false;

    this.callback = {
      onReceiveMessage: this.onReceiveMessage.bind(this),
    };

    this.state = {
      //timer:0,

      command: {
        list: [],
        cursor: 0,
      },

      history: {
        list: [],
        cursor: 0,
      },

      mention: {
        list: [],
        cursor: 0,
      },

      spacesList: {
        list: [],
        cursor: 0,
      },

      categoriesList: {
        list: [],
        cursor: 0,
      },

      tasksList: {
        list: [],
        filterList: [],
        cursor: 0,
      },

      openApp: false,
      openEmoticon: false,
      openReservationMessage: false, // 예약 메시지
      openChat: false,
      openCommand: false,
      openMention: false,
      openSpacesList: false,
      openCategoriesList: false,
      openTasksList: false,
      openTerm: false,
      openLayerPopup: 'FALSE',
      closeLayerPopup: false,
      openPopupFlag: false,
      anonymousChannelID: -1,
      openMessageList: false,
      searchArea: 'CUR',
      height: '',
      isShowTotorial: false,
      isShowChatbotNotice: false,
      openHistoryList: false,
      tp: '',
      isShowOpenDialogModal: false,
      //channelexplosion: [],

      votelist: {},
      messageid: '',
      isopinion: false,
      writingUserList: this.props.writting || [],
      writtingStart: false,
      alarm: 'N',
      isNotice: true,
      tmsSpaceId: '',
      tmsLimitMsg: '',
      isAll: false,
      keywordMsg: '',
      isKeyword: true,
      addKeyword: false,
    };

    this.mention = {
      delay: 300,
      min: 0,
      set: false,
      stack: 0,
      text: '',
    };

    this.spacesList = {
      delay: 300,
      min: 0,
      set: false,
      stack: 0,
      text: '',
    };

    this.categoriesList = {
      delay: 300,
      min: 0,
      set: false,
      stack: 0,
      text: '',
    };

    this.tasksList = {
      delay: 300,
      min: 0,
      set: false,
      stack: 0,
      text: '',
      spaceId: '',
      taskId: '',
      filterTaskId: '',
    };

    this.commandCompanyCode = '';
    this.commandGuideOpen = false;
    this.disabled = false;
    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDrop = this.onDrop.bind(this);

    this.setPresence = this.setPresence.bind(this);
    this.setPresenceInterval = this.setPresenceInterval.bind(this);
    this.getPresence = this.getPresence.bind(this);
    this.getPresenceInterval = this.getPresenceInterval.bind(this);
    this.handleChannelDeleteStop = this.handleChannelDeleteStop.bind(this);
    this.getVoteList = this.getVoteList.bind(this);
    this.isFirstShowChatbotNotice = true;
    this.getWrittingUser = this.getWrittingUser.bind(this);
    this.stopWrittingUser = this.stopWrittingUser.bind(this);
    this.checkTMS = this.checkTMS.bind(this);
    this.timerID = 0;
    this.openHistory = true;
    this.transType = false;
    this.bizrunner = new bizrunner();
    this.giphyKeyword = '';
    this.pasteText = '';
    this.setSpaceId = '';
    this.fontSize = 14;

    this.emphasizeStyle1 = {
      color: '#FF0000',
      fontSize: this.fontSize,
      textDecoration: 'underline',
    };
    this.emphasizeStyle2 = {
      color: '#0000FF',
      fontSize: this.fontSize,
      textDecoration: 'underline',
    };
    this.emphasizeStyle3 = {
      color: '#FF0000',
      fontSize: this.fontSize,
    };
    this.emphasizeStyle4 = {
      color: '#0000FF',
      fontSize: this.fontSize,
    };
    this.emphasizeStyle11 = {
      color: '#FF0000',
      fontSize: this.fontSize + 5,
      textDecoration: 'underline',
    };
    this.emphasizeStyle21 = {
      color: '#0000FF',
      fontSize: this.fontSize + 5,
      textDecoration: 'underline',
    };
    this.emphasizeStyle12 = {
      color: '#FF0000',
      fontSize: this.fontSize + 10,
      textDecoration: 'underline',
    };
    this.emphasizeStyle22 = {
      color: '#0000FF',
      fontSize: this.fontSize + 10,
      textDecoration: 'underline',
    };
    this.emphasizeStyle13 = {
      color: '#FF0000',
      fontSize: this.fontSize + 15,
      textDecoration: 'underline',
    };
    this.emphasizeStyle23 = {
      color: '#0000FF',
      fontSize: this.fontSize + 15,
      textDecoration: 'underline',
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channelInfo.channel_id === undefined) {
      this.setState({
        ...this.state,
        isShowTotorial: true,
      });
    }

    if (
      this.props.channelInfo.channel_id !== nextProps.channelInfo.channel_id &&
      nextProps.channelInfo.channel_type !== 3
    ) {
      this.setState({
        ...this.state,
        command: {
          list: [],
          cursor: 0,
        },

        mention: {
          list: [],
          cursor: 0,
        },

        spacesList: {
          list: [],
          cursor: 0,
        },

        categoriesList: {
          list: [],
          cursor: 0,
        },

        tasksList: {
          list: [],
          filterList: [],
          cursor: 0,
        },

        openApp: false,
        openEmoticon: false,
        openLayerPopup: 'FALSE',
        openMessageList: false,
        // searchArea: 'CUR',
        height: '',
        isShowTotorial: false,
        presence: {},
        votelist: {},
        messageid: '',
        openHistoryList: false,
        isopinion: false,
        count: 0,
        writingUserList: nextProps.writtings || [],
        writtingStart: false,
        alarm: nextProps.channelInfo.alarmYN || 'N',
      });
      // Store.dispatch(actions.setSpaceList([]));
      this.setPresence(nextProps.channelInfo.channel_id);
      this.getVoteList(nextProps.channelInfo.channel_id);
      this.setPresenceInterval(nextProps.channelInfo.channel_id);
      this.disabled = false;
      if (this.props.writting.length > 0) {
        let idx = this.props.writting.findIndex((w) => w.user_ID + '' === nextProps.profile.userID + '');
        if (idx > -1) {
          this.stopWrittingUser(this.props.channelInfo.channel_id);
        }
      }

      // this.slimscroll = new slimscroll({
      //   height: 'calc(100% - 30px)',
      //   idSelector: '#scrollTarget'
      // });

      //this.slimscroll.init();
    } else if (
      this.props.channelInfo.channel_id !== nextProps.channelInfo.channel_id &&
      nextProps.channelInfo.channel_type === 3
    ) {
      this.getVoteList(nextProps.channelInfo.channel_id);
      this.setState({
        //...this.state,
        openLayerPopup: 'ANONYMOUS',
        //openMessageList: false,
        openHistoryList: false,
        votelist: {},
        messageid: '',
        count: 0,
        isopinion: false,
      });
      this.disabled = false;
    } else if (this.props.channelInfo.alarmYN !== nextProps.channelInfo.alarmYN) {
      this.setState({
        alarm: nextProps.channelInfo.alarmYN,
      });
    }
    let isChatbotTester = false; //18-06-14 배포시 챗봇버튼 허용인원
    // if (
    //   this.props.profile.deptCode === '10115722' ||
    //   this.props.profile.deptCode === '50061910' ||
    //   this.props.profile.deptCode === '50061908' ||
    //   this.props.profile.deptCode === '50061909' ||
    //   this.props.profile.deptCode === '50078282' ||
    //   this.props.profile.deptCode === '50061912' ||
    //   this.props.profile.uniqueName === 'X0104419' ||
    //   this.props.profile.uniqueName === 'I0100750' ||
    //   this.props.profile.uniqueName === 'X0005251' ||
    //   this.props.profile.uniqueName === 'X0100134' ||
    //   this.props.profile.uniqueName === 'X0100947' ||
    //   this.props.profile.uniqueName === 'X0102255' ||
    //   this.props.profile.uniqueName === 'I0100748' ||
    //   this.props.profile.uniqueName === 'I0100746' ||
    //   this.props.profile.uniqueName === 'I0100136' ||
    //   this.props.profile.uniqueName === 'I0100176' ||
    //   this.props.profile.uniqueName === 'X0007895'
    // ) {
    //   isChatbotTester = true;
    // }

    if (
      this.props.channelInfo.channel_id &&
      nextProps.channelInfo.channel_id &&
      this.props.channelInfo.channel_id === nextProps.channelInfo.channel_id &&
      this.isFirstShowChatbotNotice &&
      nextProps.profile.chatbotpm === 'Y' &&
      isChatbotTester
    ) {
      this.isFirstShowChatbotNotice = false;
      this.setState({ isShowChatbotNotice: true });
      if (this.refs.chatbotcontainer) {
        setTimeout(() => {
          this.refs.chatbotcontainer.className = 'chatbotcontainer fadeout';
        }, 5000);
      }
      setTimeout(() => {
        this.setState({ isShowChatbotNotice: false });
      }, 8000);
    }

    if (this.props.spacelist !== nextProps.spacelist) {
      this.setState({
        ...this.state,
        spacesList: {
          list: nextProps.spacelist,
          cursor: 0,
        },
      });
    }

    if (this.props.categorylist !== nextProps.categorylist) {
      this.setState({
        ...this.state,
        categoriesList: {
          list: nextProps.categorylist,
          cursor: 0,
        },
      });
    }

    if (this.props.tasklist !== nextProps.tasklist) {
      this.setState({
        ...this.state,
        tasksList: {
          list: nextProps.tasklist,
          filterList: [],
          cursor: 0,
        },
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.channelInfo.channel_type === 0 ||
      this.props.channelInfo.channel_type === 1 ||
      this.props.channelInfo.sysName === 'HYTUBE'
    ) {
      this.noticechannel = false;
      this.disabled = false;
      this.anonymousFreezing = false;

      if (
        this.props.channelInfo.channel_sysop_id.indexOf(this.props.profile.userID) === -1 &&
        this.props.infosummary.isFreezing === 'true'
      ) {
        this.anonymousFreezing = true;
        this.disabled = true;
      }
    } else if (this.props.channelInfo.channel_type === 4) {
      this.noticechannel = false;
      this.disabled = false;
      this.anonymousFreezing = false;
      //if (this.props.channelInfo.channel_sysop_id[0] !== this.props.profile.userID) {
      // if (this.props.channelInfo.channel_sysopid !== this.props.profile.userID) {
      if (this.props.channelInfo.channel_sysop_id.indexOf(this.props.profile.userID) === -1) {
        this.noticechannel = true;
        this.disabled = true;
      }

      // this.noticechannel = false;
      // this.disabled = false;
      // //if (this.props.channelInfo.channel_sysop_id[0] !== this.props.profile.userID) {
      // if (this.props.channelInfo.channel_sysopid !== this.props.profile.userID) {
      //   this.noticechannel = true;
      //   this.disabled = true;
      // }
    } else if (this.props.channelInfo.channel_type === 3) {
      this.noticechannel = false;
      this.anonymousFreezing = false;
      this.disabled = false;
      // 익명방 Freezing
      if (
        this.props.channelInfo.channel_sysopid !== this.props.profile.userID &&
        this.props.infosummary.isFreezing === 'true'
      ) {
        this.anonymousFreezing = true;
        this.disabled = true;
      }

      // this.anonymousFreezing = false;
      // this.disabled = false;
      // // 익명방 Freezing
      // if (this.props.channelInfo.channel_sysopid !== this.props.profile.userID && this.props.infosummary.isFreezing === "true") {
      //   this.anonymousFreezing = true;
      //   this.disabled = true;
      // }
    } else if (this.props.channelInfo.channel_type === undefined) {
      this.noticechannel = false;
      this.disabled = false;
      this.anonymousFreezing = false;
    }

    //this.noticechannel =  && channel_sysop_id ;
    if (this.props.presencelist !== prevProps.presencelist) {
      if (this.props.presencelist.length > 0) {
        if (prevProps.channelInfo.channel_id === this.props.channelInfo.channel_id) {
          this.setState({
            ...this.state,
            presence: this.props.presencelist || {},
            // isNotice: this.props.infosummary.channel_set !== undefined ?
            //           (this.props.infosummary.channel_set.NOTICEYN !== undefined ?
            //           (this.props.infosummary.channel_set.NOTICEYN === 'Y' ? false : true) : true) : true
          });
        }
      }
    }

    // setTimeout(() => {
    //   Socket.getApi().getChannelMessages(this.props.channelInfo.channel_id, (msg) => {
    //     let lastMessage = msg.list[msg.list.length-1].content;

    //     if(msg.list[msg.list.length-1].attach_file !== undefined){
    //       if(msg.list[msg.list.length-1].attach_file !== null){
    //         if(msg.list[msg.list.length-1].attach_file.trim().length !== 0){
    //           lastMessage = msg.list[msg.list.length-1].attach_file;
    //         }
    //       }
    //     }
    //     if(msg.list[msg.list.length-1].attach_image !== undefined){
    //       if(msg.list[msg.list.length-1].attach_image !== null){
    //         if(msg.list[msg.list.length-1].attach_image.trim().length !== 0){
    //           lastMessage = msg.list[msg.list.length-1].attach_image;
    //         }
    //       }
    //     }

    //     if(msg.list[msg.list.length-1].comment_info !== undefined){
    //       if(msg.list[msg.list.length-1].comment_info !== null){
    //         if(msg.list[msg.list.length-1].comment_info.length !== 0){
    //           lastMessage = msg.list[msg.list.length-1].comment_info.content;
    //         }
    //       }
    //     }

    //     const channelOpenHistory = {
    //       channelId: this.props.channelInfo.channel_id,
    //       channelName: this.props.channelInfo.aliasChannelName !== null ? this.props.channelInfo.aliasChannelName : this.props.channelInfo.channel_name,
    //       openTime: moment().add(0, 'days').format('YY/MM/DD HH:mm'),
    //       lastMessage: lastMessage,
    //     }

    //     if(channelOpenHistory.channelId !== undefined){
    //       Store.getStore().dispatch(actions.channelOpenHistory(channelOpenHistory));
    //     }
    //   });
    // }, 50);
  }

  componentWillMount() {}

  componentWillUpdate(props, state) {
    // if (this.props.channelInfo.channel_type === 4) {
    //   this.noticechannel = false;
    //   this.disabled = false;
    //   //if (this.props.channelInfo.channel_sysop_id[0] !== this.props.profile.userID) {
    //   if (this.props.channelInfo.channel_sysopid !== this.props.profile.userID) {
    //     this.noticechannel = true;
    //     this.disabled = true;
    //   }
    // } else if (this.props.channelInfo.channel_type === 3) {
    //   this.anonymousFreezing = false;
    //   this.disabled = false;
    //   // 익명방 Freezing
    //   if (this.props.channelInfo.channel_sysopid !== this.props.profile.userID && this.props.infosummary.isFreezing === "true") {
    //     this.anonymousFreezing = true;
    //     this.disabled = true;
    //   }
    // }
  }

  setPresence(channelID) {
    this.getPresence(channelID);
  }

  getWrittingUser(channelID) {
    // 2021.04.16 WEB은 작성중 모두 제외 (서동호PL요청)
    // let channelid = channelID + '' || this.props.channelInfo.channel_id + '';
    // let _this = this;
    // Socket.getApi()
    //   .messageWritting(channelid)
    //   .then(function(msg) {
    //     if (msg.res === true) {
    //       _this.start = true;
    //     }
    //   });
  }

  stopWrittingUser(channelID) {
    // 2021.04.16 WEB은 작성중지 모두 제외 (서동호PL요청)
    // let channelid = channelID + '' || this.props.channelInfo.channel_id + '';
    // let _this = this;
    // clearTimeout(_this.timerID);
    // Socket.getApi()
    //   .messageWrittingStop(channelid)
    //   .then(function(msg) {
    //     if (msg.res === true) {
    //       _this.start = false;
    //     }
    //   });
  }

  getVoteList(channelid) {
    let _this = this;
    Socket.getApi()
      .votelist(channelid)
      .then(function (msg) {
        if (msg.count > 0) {
          _this.setState({
            ..._this.state,
            votelist: msg.list || {},
            count: msg.count,
          });
        }
      });
  }

  setPresenceInterval(channelID) {
    // if (this.refreshPresence) {
    //   clearInterval(this.refreshPresence);
    // }
    // this.getPresenceInterval(channelID);
    // this.refreshPresence = setInterval(this.getPresenceInterval, 60000 * 5);
  }

  handleChannelDeleteCancel(channelID, id) {
    Socket.getApi().rejectChannelDelete(channelID);
  }

  handleCancelChannelDelete(channelID) {
    Store.getStore().dispatch(actions.deletecancelChannel(channelID));
  }

  handleChannelDeleteStop(channelID, tp) {
    if (tp !== null) {
      let id = tp + channelID + '';
      Store.getStore().dispatch(actions.deleteChannel(id));
    }
  }

  getPresence(channelID) {
    // if( channelID ) {

    let channelid = channelID || this.props.channelInfo.channel_id;

    if (channelid) {
      channelid += '';
      if (channelid.trim()) {
        let param = {
          channelID: channelid,
          type: 'PRESENCE',
        };

        if (channelid[0] === '2') {
          Socket.getApi().selectChannelInMember(param, this.onReceivePresence.bind(this));
        } else {
          Socket.getApi().selectDMChannelInMember(
            { ...param, startIndex: 0 },
            this.onReceivePresence.bind(this)
          );
        }
      }
    }
    // }
  }

  getPresenceInterval(channelID) {
    let channelid = channelID || this.props.channelInfo.channel_id;

    if (channelid) {
      channelid += '';
      if (channelid.trim()) {
        let param = {
          channelID: channelid,
          type: 'PRESENCE',
        };
        if (global.externalParam) {
          let { type } = global.externalParam;
          if (type !== 'Hytube') {
            if (channelid[0] === '2') {
              //Socket.getApi().selectChannelPresence(param);
            } else {
              //Socket.getApi().selectChannelPresence(param);
            }
          }
        } else {
          if (channelid[0] === '2') {
            //Socket.getApi().selectChannelPresence(param);
          } else {
            //Socket.getApi().selectChannelPresence(param);
          }
        }
      }
    }
  }

  onReceivePresence(member) {
    this.setState({
      ...this.state,
      presence: member.list || {},
    });
  }

  onChangesearchArea(value) {
    this.setState({
      ...this.state,
      searchArea: value,
    });
  }

  openGlossary(keyWord) {
    let commandCompanyCode = this.commandCompanyCode || this.props.profile.companyCode;
    let idx = this.props.command.findIndex(
      (c) =>
        (!c.company_code || c.company_code === commandCompanyCode) && c.command.toUpperCase() === 'TERM'
    );
    var url = '/web/BizWorks/Glossary.bzr?layerfree=true&keyWord=' + keyWord;
    if (idx > -1) {
      let param = this.props.command[idx].parameter.replace(/{{KEYWORD}}/g, keyWord);
      url = this.props.command[idx].popup_url + '?' + param;
    }
    let open = window.open(
      url,
      'Glossary',
      'width=860, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no'
    );
    if (window.focus) {
      setTimeout(function () {
        open.focus();
      }, 500);
    }
  }

  onKeyDownEvent(event) {
    let _KEY = { ENTER: 13, ESC: 27, UP: 38, DOWN: 40, BACK: 8, TAB: 9, SPACE: 32 };
    this.openLayerPopup = this.state.openLayerPopup;
    let input = event.keyCode;
    let chatbot = this.props.channelInfo.chatbot;
    let isAnonymousChannel = this.props.channelInfo.channel_type === 3;
    let termHistoryContent = '';
    let cursorStart = event.target.selectionStart;
    let cursorEnd = event.target.selectionEnd;
    let text = event.target.value.toUpperCase();
    let { channelInfo } = this.props;

    if (input && !isAnonymousChannel) {
      clearTimeout(this.timerID);
    }

    if (input === _KEY.ESC) {
      this.setState({
        openCommand: false,
      });
    }

    // 연계 스페이스 자동 완성 부분
    if (!this.state.openHistoryList || !isAnonymousChannel) {
      if (!chatbot) {
        if (text === '' || text === '/TMS' || text === '/TMSSUB' || text === '/TMSMORE') {
          if (
            channelInfo.TMS_Space !== undefined &&
            channelInfo.TMS_Space !== null &&
            channelInfo.TMS_Space.spaceId !== -1
          ) {
            if (input === _KEY.SPACE) {
              text =
                text + ' $' + channelInfo.TMS_Space.spaceNm + '(' + channelInfo.TMS_Space.spaceId + ')';
              this.refs.inputbox.value = text;
              this.state.tmsSpaceId = channelInfo.TMS_Space.spaceId;
            }
          }
        }
      }
    }

    if (
      // 리스트가 보일때 키 입력 이벤트
      (this.state.command.list.length && !this.commandGuideOpen) ||
      this.state.mention.list.length ||
      this.state.spacesList.list.length ||
      this.state.categoriesList.list.length ||
      this.state.tasksList.list.length
    ) {
      let target = this.state.mention.list.length
        ? 'mention'
        : this.state.spacesList.list.length
        ? 'spacesList'
        : this.state.categoriesList.list.length
        ? 'categoriesList'
        : this.state.tasksList.list.length
        ? 'tasksList'
        : 'command';

      // let target = this.state.mention.list.length ? 'mention' : 'command';
      if (input === _KEY.UP) {
        event.preventDefault();
        this.moveCursor(target, -1);
      } else if (input === _KEY.DOWN) {
        event.preventDefault();
        this.moveCursor(target, 1);
      } else if (input === _KEY.ESC) {
        event.preventDefault();
        this.setInputBox();
      } else if (input === _KEY.ENTER) {
        event.preventDefault();
        event.stopPropagation();
        this.selectAutoCompleteItem(target);
      } else if (input === _KEY.TAB) {
        event.preventDefault();
        event.stopPropagation();
        this.selectAutoCompleteItem(target);
      }
    } else if (this.state.openHistoryList) {
      let target = 'history';
      if (input === _KEY.UP) {
        event.preventDefault();
        this.moveCursor(target, -1);
      } else if (input === _KEY.DOWN) {
        event.preventDefault();
        this.moveCursor(target, 1);
      } else if (input === _KEY.ESC) {
        event.preventDefault();
        this.setInputBoxByHistory();
      } else if (input === _KEY.ENTER) {
        event.preventDefault();
        event.stopPropagation();
        this.selectHistory(this.state.history.cursor);
      } else if (input === _KEY.TAB) {
        event.preventDefault();
        event.stopPropagation();
        this.selectHistory(this.state.history.cursor);
      }
    } else if (!event.shiftKey && input === _KEY.ENTER) {
      event.preventDefault();
      let content = event.target.value.trim();
      if (event.target.value.indexOf(' ') === 0 && !isAnonymousChannel) {
        if (this.state.openCommand === false) {
          content = event.target.value;
        } else {
          content = '/tms ' + event.target.value.trim();
        }
      } else if (event.target.value.indexOf(' ') === 0 && isAnonymousChannel) {
        if (this.state.openCommand === false) {
          content = event.target.value;
        } else {
          content = event.target.value.trim();
        }
      } else if (
        // ? 용어 처리 주석
        event.target.value.lastIndexOf('?') === 0 &&
        content.length > 1 &&
        event.target.value.indexOf(' ') === 1
      ) {
        let keyWord = event.target.value.replace('?', '').trim();
        content = ' ';
        termHistoryContent = event.target.value.trim();
        this.openGlossary(keyWord);
      } else {
        content = event.target.value.trim();
      }

      if (content.length > 0) {
        this.setHistoryList(content === ' ' ? termHistoryContent : content);
        if (!this.executeCommand(content)) {
          let profile = Store.getStore().getState().profile;
          let hygptYN = false;
          if (profile.profile.securityList !== undefined) {
            hygptYN =
              profile.profile.securityList.findIndex(
                (row) => row.appType.toUpperCase() === 'HYGPT' && row.openYN.toUpperCase() === 'Y'
              ) > -1
                ? true
                : false;
          }

          if (content.toUpperCase().indexOf('@HYGPT') > -1 && hygptYN) {
            let hygptMsg = global.CONFIG.legacy.getLegacyInfo('HYGPT_MSG', 'ALL');
            let token = hygptMsg.parameter.split('|')[0];
            if (content[6] === '(') {
              content = content.substr(content.indexOf(')') + 2);
            } else {
              content = content.substr(7);
            }

            // const formData = new FormData();
            let formData = {};
            if (content.length > 500) {
              formData = {
                user_no: this.props.profile.uniqueName,
                type: 'user',
                docs: content.substring(0, 500),
              };

              alert(this.language.alertLimitHyGPTMsg);
            } else {
              formData = {
                user_no: this.props.profile.uniqueName,
                type: 'user',
                docs: content,
              };
            }
            const xhr = new XMLHttpRequest();

            xhr.open('POST', hygptMsg.url, true);
            xhr.setRequestHeader(token.split(':')[0], token.split(':')[1]);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onload = () => {
              let res = xhr.response;
              res = JSON.parse(res);
              console.log(JSON.stringify(res));
            };
            xhr.send(JSON.stringify(formData));

            this.setInputBox('', false, true);
            this.stopWrittingUser(this.props.channelInfo.channel_id);
          } else {
            this.addMessage(content);
          }
        }
      }
    } else if (
      input === _KEY.UP &&
      cursorStart === 0 &&
      cursorEnd === 0 &&
      this.state.history.list.length > 0 &&
      !this.state.openHistoryList
    ) {
      event.preventDefault();
      event.stopPropagation();
      let list = this.state.history.list;
      if (list[list.length - 1] !== undefined) {
        let historyText = this.checkCommandHistory(list[list.length - 1]);
        event.target.value = historyText;
        event.target.selectionStart = historyText.length;
        event.target.selectionEnd = historyText.length;
      }

      this.setState({
        ...this.state,
        openHistoryList: true,

        history: {
          list: list,
          cursor: list.length - 1,
        },

        command: {
          list: [],
          cursor: 0,
        },

        mention: {
          list: [],
          cursor: 0,
        },

        spacesList: {
          list: [],
          cursor: 0,
        },

        categoriesList: {
          list: [],
          cursor: 0,
        },

        tasksList: {
          list: [],
          cursor: 0,
        },
      });

      this.state.openHistory = true;
    }
  }

  /*onKeyUp Event*/
  onKeyUpEvent(event) {
    const _this = this;
    let isAnonymousChannel = _this.props.channelInfo.channel_type === 3;
    if (_this.start === false && !isAnonymousChannel) {
      if (_this.refs.inputbox.value.length > 0) {
        _this.getWrittingUser(_this.props.channelInfo.channel_id);
      }
    }
    event.persist();
    let prms = (_event) => {
      return new Promise(function (resolve, reject) {
        let { inputbox } = _this.refs;
        var height = event.target.scrollHeight + 15;
        var overflow = inputbox.style.overflow;

        if (height < 390) {
          if (overflow !== 'hidden') {
            overflow = 'hidden';
          }
        } else {
          height = 390;
          if (overflow !== 'visible') overflow = 'visible';
        }

        if (height !== _this.height) {
          resolve({ height: height, overflow: overflow });
        }
      });
    };

    prms(event).then(function (result) {
      _this.refs.chatinput.style.height = 0;
      _this.height = Math.min(_this.refs.inputbox.scrollHeight + 15, 390);
      _this.refs.chatinput.style.height = _this.height + 'px';
      _this.setState({
        height: _this.height,
      });
      _this.state.height;
      if (_this.height < 390) {
        if (_this.refs.inputbox.style.overflow !== 'hidden')
          _this.refs.inputbox.style.overflow = 'hidden';
      } else if (_this.refs.inputbox.style.overflow !== 'auto') {
        _this.refs.inputbox.style.overflow = 'auto';
      }
    });
  }

  /*onPaste Event*/
  onPasteEvent(event) {
    var clipboardData = event.clipboardData || window.clipboardData;
    this.pasteText = clipboardData.getData('Text');
    if (this.is_ie()) {
      clipboardData.setData('Text', this.pasteText);
    }
  }

  //Add Message
  addMessage(content, imoticon, file, callback) {
    let { channelInfo, profile } = this.props;
    let isNickCheck = this.props.infosummary.nick_check === true;
    this.start = false;
    this.setSpaceId = '';

    if (isNickCheck && !this.state.openPopupFlag) {
      this.setState({
        ...this.state,
        openLayerPopup: 'ANONYMOUS',
      });
    } else {
      let data = {
        channelID: channelInfo.channel_id,
        languageType: profile.languageType,
        msg: content,
        image: imoticon === undefined ? '' : imoticon,
        tag: '',
        file: file,
        isMobile: channelInfo.docm_search,
        isSearch: channelInfo.doc_search,
        nodeid: -1,
      };

      Socket.getApi().addMessage(data, callback);
      this.setInputBox('');
      clearTimeout(this.timerID);
    }
  }

  addBotMessage(content, imoticon, file, callback) {
    let { channelInfo, profile } = this.props;
    let isNickCheck = this.props.infosummary.nick_check === true;
    this.start = false;
    if (isNickCheck && !this.state.openPopupFlag) {
      this.setState({
        ...this.state,
        openLayerPopup: 'ANONYMOUS',
      });
    } else {
      let data = {
        channelID: channelInfo.channel_id,
        languageType: profile.languageType,
        msg: content,
        image: imoticon === undefined ? '' : imoticon,
        tag: '',
        file: file,
        isMobile: channelInfo.docm_search,
        isSearch: channelInfo.doc_search,
        nodeid: -1,
      };

      Socket.getApi().addBotMessage(data, callback);
      this.setInputBox('');
      clearTimeout(this.timerID);
    }
  }

  setHistoryList(content) {
    let maxCount = global.CONFIG.chatInputHistoryCount || 20;
    let { list, cursor } = this.state.history;
    if (list.length === maxCount) list.splice(0, 1);
    list.push(content);
    cursor = list.length - 1;
    this.setState({ ...this.state, history: { list: list, cursor: cursor } });
  }

  messgeTrans() {
    let _this = this;
    let store = Store.getStore();
    let targetlang = global.CONFIG.other.messagetranslang;
    if (targetlang === '' || targetlang === undefined) {
      targetlang = 'en';
    }
    let { value, selectionEnd } = _this.refs.inputbox;
    store.dispatch(actions.setOrgContent(value));
    if (value.length > 0) {
      Socket.getApi()
        .translateMessage(value, '', targetlang)
        .then(function (msg) {
          if (msg.stat === true) {
          }
        });
    }
    _this.transType = true;
  }

  //LayerPopup Setting
  setLayerPopup(command) {
    if (this.noticechannel || this.anonymousFreezing) {
      command = false;
    }
    this.setState({ ...this.state, openLayerPopup: command });
  }

  closeChannelDelete() {
    this.setState({ ...this.state, openLayerPopup: 'FALSE' });
  }

  //LayerPopup Setting
  setLayerAnonymousPopup() {
    this.setState({
      ...this.state,
      openLayerPopup: 'FALSE',
      openMessageList: true,
    });
  }

  onReceiveMessage(e, msg) {
    if (e === 'cancelFlag') {
      this.setState({
        ...this.state,
        openLayerPopup: 'FALSE',
        openMessageList: false,
        anonymousChannelID: -1,
        closeLayerPopup: true,
        openPopupFlag: false,
      });
    } else {
      if (msg.result) {
        this.setState({
          ...this.state,
          openLayerPopup: 'FALSE',
          openMessageList: false,
          openPopupFlag: true,
        });
      } else {
        alert(msg.msg);
        this.setState({
          ...this.state,
          openLayerPopup: 'ANONYMOUS',
          openMessageList: true,
          openPopupFlag: true,
        });
      }
    }
  }

  //Key down event for Commnd and Mention {
  moveCursor(target, move) {
    if (target === 'command') {
      this.moveCommandCursor(move);
    } else if (target === 'mention') {
      this.moveMentionCursor(move);
    } else if (target === 'history') {
      this.moveHistoryCursor(move);
    } else if (target === 'spacesList') {
      this.moveSpacesListCursor(move);
    } else if (target === 'categoriesList') {
      this.moveCategoriesListCursor(move);
    } else if (target === 'tasksList') {
      this.moveTasksListCursor(move);
    }
  }

  selectAutoCompleteItem(target) {
    if (target === 'command') {
      this.selectCommand(this.state.command.cursor);
    } else if (target === 'mention') {
      this.selectMention(this.state.mention.cursor);
    } else if (target === 'spacesList') {
      this.selectSpacesList(this.state.spacesList.cursor);
    } else if (target === 'categoriesList') {
      this.selectCategoriesList(this.state.categoriesList.cursor);
    } else if (target === 'tasksList') {
      this.selectTasksList(this.state.tasksList.cursor);
    }
  }

  timestate(e) {
    let _this = this;
    if (_this.start) {
      _this.stopWrittingUser(_this.props.channelInfo.channel_id);
    }
  }

  onChangeInputBox(event) {
    let _text = event.target.value;

    let isAnonymousChannel = this.props.channelInfo.channel_type === 3;

    if (this.pasteText.length !== 0) {
      this.refs.inputbox.value = this.refs.inputbox.value.trim();
      _text = this.refs.inputbox.value;
      this.pasteText = '';
    }

    if (_text.length === 0) {
      this.setSpaceId = '';
    }

    //input값 변화가 있으면 timer 시작
    if (this.timerID > 0) {
      clearTimeout(this.timerID);
    }

    this.timerID = setTimeout(this.timestate.bind(this), 1000 * this.time);

    if (this.start && !isAnonymousChannel) {
      if (_text.length === 0) {
        this.stopWrittingUser(this.props.channelInfo.channel_id);
      }
    }

    if (this.state.openHistoryList) {
      this.setState({ ...this.state, openHistoryList: false });
    }

    if (!this.state.openHistoryList || !isAnonymousChannel) {
      let { channelInfo } = this.props;

      if (!channelInfo.chatbot) {
        this.searchMention(event.target);
      }

      this.searchCommand(_text);
      this.searchTMSSpaces(event.target);
      this.searchTMSCategories(event.target);
      this.searchTaskList(event.target);
    }

    let profile = Store.getStore().getState().profile;
    let hygptYN = false;

    if (profile.profile.securityList !== undefined) {
      hygptYN =
        profile.profile.securityList.findIndex(
          (row) => row.appType.toUpperCase() === 'HYGPT' && row.openYN.toUpperCase() === 'Y'
        ) > -1
          ? true
          : false;
    }

    if (_text.toUpperCase().trim().slice(0, 6) === '@HYGPT' && hygptYN) {
      this.props.clickDetailTabItem('hygpt');
    }
  }
  //}

  checkTMS(target) {
    let { value } = target;

    if (
      // text 한번에 지웠을 때 호출되게..각 list 컴포넌트 false
      value.indexOf(' ') === 0 ||
      value.toUpperCase().trim().slice(0, 4) === '/TMS' ||
      value.toUpperCase().trim().slice(0, 7) === '/TMSSUB' ||
      value === ''
    ) {
      return false;
    } else if (
      value.indexOf('^') === 0 ||
      value.indexOf('$') === 0 ||
      !(value.toUpperCase().trim().slice(0, 4) === '/TMS') ||
      !(value.toUpperCase().trim().slice(0, 4) === '/TMSSUB')
    ) {
      return true;
    }
  }

  //Command {
  searchCommand(text) {
    let list = [];
    let todolist = [];
    let term = [];
    let commandCompanyCode = this.commandCompanyCode || this.props.profile.companyCode;
    this.commandGuideOpen = false;
    let isDm = (this.props.channelInfo.channel_id + '')[0] === '5';
    let isSysop = this.props.channelInfo.channel_register === this.props.profile.userID;
    let isSystemAdmin = global.CONFIG.other.isSystemAdmin === 'Y';
    let memberadd =
      this.props.channelInfo.memberadd_yn !== undefined && this.props.channelInfo.memberadd_yn === 'Y';
    let sysoplist = this.props.channelInfo.channel_sysop_id;
    let tempSysop = false;
    if (sysoplist !== undefined) {
      let sysopidx = sysoplist.findIndex((temp) => temp === this.props.profile.userID);
      if (sysopidx > -1) {
        tempSysop = true;
      }
    }

    // if (text.indexOf('/') === 0 && !(this.props.channelInfo.sysName.indexOf('HYFB') > -1)) { // 하이피드백 채널 일 시 Command 사용 안되게 수정 220308
    if (text.indexOf('/') === 0) {
      // 하이피드백 채널 일 시 Command 사용 되게 수정 230713
      let findSpace = text.substring(1).split(' ');
      let command = findSpace[0];

      this.props.command.map((item) => {
        if (!item.company_code || item.company_code === commandCompanyCode) {
          if (findSpace.length > 1 && command.toUpperCase() === item.command.toUpperCase()) {
            if ((!isDm && (isSysop || isSystemAdmin || memberadd || tempSysop)) || isDm) {
              this.commandGuideOpen = true;
              list.push(item);
            } else {
              if (item.command.toUpperCase() !== 'INVITE') {
                this.commandGuideOpen = true;
                list.push(item);
              }
            }
          } else if (
            item.command.toUpperCase().indexOf(command.toUpperCase()) === 0 &&
            findSpace.length === 1
          ) {
            if ((!isDm && (isSysop || isSystemAdmin || memberadd || tempSysop)) || isDm) {
              list.push(item);
            } else {
              if (item.command.toUpperCase() !== 'INVITE') {
                list.push(item);
              }
            }
          }
        }

        return false;
      });
      // } else if (text.indexOf(' ') === 0 && !(this.props.channelInfo.sysName.indexOf('HYFB') > -1)) { // 하이피드백 채널 일 시 할일기능(띄어쓰기) 사용 안되게 수정 220308
    } else if (text.indexOf(' ') === 0) {
      // 하이피드백 채널 일 시 할일기능(띄어쓰기) 사용 안되게 수정 230713
      let idx = this.props.command.findIndex(
        (c) =>
          (!c.company_code || c.company_code === commandCompanyCode) && c.command.toUpperCase() === 'TMS'
      );
      if (idx > -1) {
        todolist = { ...this.props.command[idx], command: undefined };
        this.commandGuideOpen = true;
        list.push(todolist);
      }
    } else if (text.indexOf('?') === 0 && text.indexOf(' ') === 1) {
      let idx = this.props.command.findIndex(
        (c) =>
          (!c.company_code || c.company_code === commandCompanyCode) &&
          c.command.toUpperCase() === 'TERM'
      );
      if (idx > -1) {
        term = { ...this.props.command[idx], command: undefined };
        this.commandGuideOpen = true;
        list.push(term);
      }
    }

    let commandRefresh = this.state.command.list.length !== list.length;

    if (list.length === 0) {
      this.commandCompanyCode = '';
    } else if (
      !commandRefresh &&
      this.state.command.list.length > 0 &&
      this.state.command.list[0].company_code
    ) {
      commandRefresh = this.commandCompanyCode !== this.state.command.list[0].company_code;
    }

    if (commandRefresh) {
      this.setState({
        ...this.state,
        command: { list: list, cursor: 0 },
        openCommand: true,
      });
    }
  }

  selectCommand(idx) {
    let selectedCommand = this.state.command.list[idx];
    if (selectedCommand !== undefined) {
      let commandStr = '/' + selectedCommand.command + ' ';
      let { command } = selectedCommand;

      if (command === 'TMS' || command === 'TMSSUB' || command === 'TMSMORE') {
        let { channelInfo } = this.props;
        if (
          channelInfo.TMS_Space !== undefined &&
          channelInfo.TMS_Space !== null &&
          channelInfo.TMS_Space.spaceId !== -1
        ) {
          // 스페이스 자동완성
          commandStr =
            commandStr +
            '$' +
            channelInfo.TMS_Space.spaceNm +
            '(' +
            channelInfo.TMS_Space.spaceId +
            ') ';
        }
      }

      this.setInputBox(commandStr, true);

      // if(selectedCommand.command === 'Hygpt'){
      //   this.props.clickDetailTabItem('hygpt');
      // }
    }
  }

  moveCommandCursor(move) {
    this.setCommandCursor(this.state.command.cursor + move);
  }

  setCommandCursor(_cursor) {
    let { list, cursor } = this.state.command;
    cursor = (_cursor + list.length) % list.length;
    this.setState({ ...this.state, command: { list: list, cursor: cursor } });
  }

  setCommandCompanyCode(companyCode) {
    this.commandCompanyCode = companyCode;
    this.searchCommand(this.refs.inputbox.value);
  }

  executeCommand(content) {
    let commandContent = content;
    let isAnonymousChannel = this.props.channelInfo.channel_type === 3;

    if (!isAnonymousChannel && !this.props.isMini) {
      this.start = false;
      // if (content.indexOf('/') === 0 && !(this.props.channelInfo.sysName.indexOf('HYFB') > -1)) { // 하이피드백 채널 일 시 Command 사용 안되게 수정 220308
      if (commandContent.indexOf('/') === 0) {
        // 하이피드백 채널 일 시 Command 사용 되게 수정 230713
        let firstword = commandContent.split(' ')[0].substring(1).toUpperCase();
        let companyCode = this.commandCompanyCode || this.props.profile.companyCode;
        this.commandCompanyCode = '';
        let idx = this.props.command.findIndex(
          (c) => c.command.toUpperCase() === firstword && c.company_code === companyCode
        );

        if (firstword === 'LEAVE') {
          var ret = confirm(this.language.confirmChannelLeave);
          if (!ret) {
            //TODO
            return true;
          }
        }

        if (firstword === 'COPYID') {
          this.copyChannelID();
        }

        if (firstword === 'TMS') {
          commandContent = content + ' ';
        }

        if (firstword === 'TMSLIST') {
          this.props.clickDetailTabItem('todo');
          this.props.tmsListOnOff(true);
        }

        if (firstword === 'TMSMORE') {
          let inputText = this.refs.inputbox.value;
          let s = inputText.indexOf('^') + 1;
          let taskId = inputText.substring(s, inputText.length);

          const numberRegx = /^[0-9]*/g;
          const companyCode = Store.getProfile().companyCode;
          const css =
            'width=1050, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no';

          let { scheurl, getLegacyInfo } = global.CONFIG.legacy;
          let url = '';
          let legacyInfo = getLegacyInfo('TODO_VIEW', companyCode);
          let subContent = content.substring(s);
          let numberText = parseInt(subContent.match(numberRegx)[0]);

          if (legacyInfo) {
            scheurl = legacyInfo.url;
          }

          url = scheurl + taskId;

          if (content.indexOf('^') === -1) {
            this.refs.inputbox.value = '';
          } else if (content.indexOf('^') >= 0 && subContent.indexOf(' ') >= 0) {
            this.refs.inputbox.value = '';
          } else if (isNaN(numberText)) {
            this.refs.inputbox.value = '';
          } else {
            window.open(url, this.language.addToDo, css);
          }
        }

        if (content.toUpperCase().includes('/TASK')) {
          const { TMS_Space } = this.props.channelInfo;
          const { popup_url } = this.props.command[idx];
          let url = '';

          if (TMS_Space !== undefined && TMS_Space !== null && TMS_Space.spaceId !== -1) {
            url = `${popup_url}?spaceId=${TMS_Space.spaceId}`;
          } else {
            url = popup_url;
          }

          window.open(
            url,
            '',
            'width=' +
              800 +
              ',height=' +
              1200 +
              ',toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no'
          );
        }

        let isKeyword = false;
        if (content.toUpperCase().includes('/KEYWORD')) {
          isKeyword = true;
        }

        if (idx < 0) {
          return false;
        } else if (this.props.command[idx].popup_yn.toUpperCase() === 'Y') {
          this.openUrl(this.props.command[idx], commandContent);
        } else if (this.state.openCommand === false) {
          return false;
        } else if (isKeyword) {
          Socket.getApi().executeCommand(
            {
              channelID: this.props.channelInfo.channel_id,
              content: commandContent,
            },
            (msg) => {
              this.setState({
                keywordMsg: msg.msg,
                isKeyword: msg.result,
                addKeyword: msg.result,
              });
            }
          );
        } else {
          Socket.getApi().executeCommand(
            {
              channelID: this.props.channelInfo.channel_id,
              content: commandContent,
            },
            (msg) => {
              this.setState({
                tmsLimitMsg: msg.msg,
                isAll: msg.isAll,
              });
            }
          );
        }

        this.setInputBox('', false, true);
        this.stopWrittingUser(this.props.channelInfo.channel_id);
        setTimeout(() => {
          if (firstword === 'GIF') {
            this.giphyKeyword = commandContent.split(' ')[1];
            this.setLayerPopup('GIPHY');
          }
        }, 100);
        return true;
      }
    }
    return false;
  }
  //}

  //Mention {
  searchMention(target) {
    let { value, selectionEnd } = target;
    let start = value.lastIndexOf('@', selectionEnd);
    let text = value.substring(start, selectionEnd);
    let regx = /[\s\(\)\[\]\{\}]/g;
    let interrupt = (text.match(regx) || []).length > 0;

    this.findMention(!interrupt ? text : '');
  }

  findMention(text) {
    let regx = /\@([^\s\(\)\[\]\{\}]+)|\@/g;
    let getMentionList = this.getMentionList;
    let matchedMentions = text.match(regx) || [];

    getMentionList(
      matchedMentions.length > 0
        ? matchedMentions[0] === '@'
          ? matchedMentions[0]
          : matchedMentions[0].substring(1)
        : ''
    );
  }

  getMentionList(text) {
    this.mention.stack++;
    var timeoutfunction = function () {
      if (--this.mention.stack === 0) {
        if (this.mention.text === text) return;
        else this.mention.text = text;

        if (text.length > 0) {
          if (text === '@') {
            text = '';
          }
          let param = {
            channelid: this.props.channelInfo.channel_id,
            text: text,
          };
          let api = Socket.getApi();
          api.searchMentionList(param, (msg) => {
            this.setState({
              ...this.state,
              mention: { list: msg, cursor: 0 },
              openMention: true,
            });
          });
        } else {
          this.setState({ ...this.state, mention: { list: [], cursor: 0 } });
        }
      }
    };
    setTimeout(timeoutfunction.bind(this), this.mention.delay);
  }

  selectMention(idx) {
    let { userID, name } = this.state.mention.list[idx];
    let { value, selectionEnd } = this.refs.inputbox;
    let start = value.lastIndexOf('@', selectionEnd);
    let space = start > 0 ? ' ' : '';
    let pre = value.substring(0, start);
    let post = value.substring(selectionEnd, value.length);
    let mention = false;
    let hygptYN = false;
    let profile = Store.getStore().getState().profile;

    if (name === 'CHANNEL' || name === 'ALL') {
      mention = space + '@' + name + ' ';
    } else {
      mention = space + '@' + name + '(' + userID + ') ';
    }

    if (profile.profile.securityList !== undefined) {
      hygptYN =
        profile.profile.securityList.findIndex(
          (row) => row.appType.toUpperCase() === 'HYGPT' && row.openYN.toUpperCase() === 'Y'
        ) > -1
          ? true
          : false;
    }
    if (name === 'HYGPT' && hygptYN) {
      this.props.clickDetailTabItem('hygpt');
    }

    this.setInputBox(pre + mention + post);
    this.refs.inputbox.selectionStart = start + mention.length;
    this.refs.inputbox.selectionEnd = start + mention.length;
  }

  moveMentionCursor(move) {
    this.setMentionCursor(this.state.mention.cursor + move);
  }

  setMentionCursor(_cursor) {
    let { list, cursor } = this.state.mention;
    cursor = (_cursor + list.length) % list.length;
    this.setState({ ...this.state, mention: { list: list, cursor: cursor } });
  }
  //}

  //TMSSpaces {
  searchTMSSpaces(target) {
    const { value, selectionEnd } = target;

    if (this.checkTMS(target)) {
      return;
    }

    let s1 = value.indexOf('$') + 1;
    let s2 = value.lastIndexOf('$') + 1;

    if (s2 > s1) {
      return;
    }

    const spacesRegx = /\$[^\$\#]+\([0-9]*\)/g;
    let matchedSpaces = value.replaceAll(' ', '').match(spacesRegx);
    let matchedSpacesStr = '';

    if (matchedSpaces !== null) {
      matchedSpacesStr = matchedSpaces.toString();
    }

    let start = value.lastIndexOf('$', selectionEnd);
    let text = value.substring(start, selectionEnd);
    let regx = /[\s\(\)\[\]\{\}]/g;
    let interrupt = (text.match(regx) || []).length > 0;

    if (matchedSpacesStr === '') {
      if (!interrupt) {
      }
    }
    this.findTMSSpaces(!interrupt ? text : '');
  }

  findTMSSpaces(text) {
    const regx = /\$([^\s\(\)\[\]\{\}]+)|\$/g;
    const getSpacesList = this.getSpacesList;
    let matchedMentions = text.match(regx) || [];

    getSpacesList(
      matchedMentions.length > 0
        ? matchedMentions[0] === '$'
          ? matchedMentions[0]
          : matchedMentions[0].substring(1)
        : ''
    );
  }

  getSpacesList(text) {
    this.spacesList.stack++;
    var timeoutfunction = function () {
      if (--this.spacesList.stack === 0) {
        if (this.spacesList.text === text) return;
        else this.spacesList.text = text;

        if (text.length > 0) {
          if (text === '$') {
            text = '';
          }

          const param = {
            channelid: this.props.channelInfo.channel_id,
            text: text,
          };

          Socket.getApi().searchTmsSpace(param, (msg) => {
            this.setState({ ...this.state, openSpacesList: true });
          });
        } else {
          this.setState({ ...this.state, spacesList: { list: [], cursor: 0 } });
        }
      }
    };
    setTimeout(timeoutfunction.bind(this), this.spacesList.delay);
  }

  selectSpacesList(idx) {
    let { spaceId, spaceNm } = this.state.spacesList.list[idx];
    let { value, selectionEnd } = this.refs.inputbox;
    let start = value.lastIndexOf('$', selectionEnd);

    var space = start > 0 ? ' ' : '';

    let pre = value.substring(0, start);
    let post = value.substring(selectionEnd, value.length);
    let spacesList = '';

    spacesList = space + '$' + spaceNm + '(' + spaceId + ') ';

    this.tasksList.spaceId = spaceId; // 선택한 스페이스 아이디

    this.setInputBox(pre + spacesList + post);
    this.refs.inputbox.selectionStart = start + spacesList.length;
    this.refs.inputbox.selectionEnd = start + spacesList.length;
  }

  moveSpacesListCursor(move) {
    this.setSpacesListCursor(this.state.spacesList.cursor + move);
  }

  setSpacesListCursor(_cursor) {
    let { list, cursor } = this.state.spacesList;
    cursor = (_cursor + list.length) % list.length;
    this.setState({
      ...this.state,
      spacesList: { list: list, cursor: cursor },
    });
  }

  //TMSCategoris {
  searchTMSCategories(target) {
    if (this.checkTMS(target)) {
      return;
    }

    let { value, selectionEnd } = target;
    let spaceId = '';
    let categoriesRegx = /\#[^\$\#]+\([0-9]*\)/g;
    let matchedCategories = value.match(categoriesRegx);

    let start = value.lastIndexOf('#', selectionEnd);
    let text = value.substring(start, selectionEnd);
    let regx = /[\s\(\)\[\]\{\}]/g;
    let interrupt = (text.match(regx) || []).length > 0;
    let spacesRegx = /\$[^\$\#]+\([0-9]*\)/g;
    let matchedSpaces = value.replaceAll(' ', '').match(spacesRegx);
    let matchedSpacesStr = '';

    if (matchedSpaces !== null) {
      matchedSpacesStr = matchedSpaces.toString();
      spaceId = matchedSpacesStr.substring(
        matchedSpacesStr.lastIndexOf('(') + 1,
        matchedSpacesStr.lastIndexOf(')')
      );
      this.setSpaceId = spaceId + '';
    } else {
      // 창겹침
      this.setSpaceId = '';
    }

    if (!value.toUpperCase().includes('/TMSMORE')) {
      if (!matchedCategories) {
        this.findTMSCategories(!interrupt ? text : '');
      }
    }
  }

  findTMSCategories(text) {
    const regx = /\#([^\s\(\)\[\]\{\}]+)|\#/g;
    const getCategoriesList = this.getCategoriesList;
    let matchedMentions = text.match(regx) || [];

    getCategoriesList(
      matchedMentions.length > 0
        ? matchedMentions[0] === '#'
          ? matchedMentions[0]
          : matchedMentions[0].substring(1)
        : ''
    );
  }

  getCategoriesList(text) {
    this.categoriesList.stack++;
    var timeoutfunction = function () {
      if (--this.categoriesList.stack === 0) {
        if (this.categoriesList.text === text) return;
        else this.categoriesList.text = text;

        if (text.length > 0) {
          if (text === '#') {
            text = '';
          }
          let param = {
            channelid: this.props.channelInfo.channel_id,
            text: text,
            spaceId: this.setSpaceId,
          };
          let api = Socket.getApi();
          api.searchTmsCategorie(param, (msg) => {
            this.setState({ ...this.state, openCategoriesList: true });
          });
        } else {
          this.setState({
            ...this.state,
            categoriesList: { list: [], cursor: 0 },
          });
        }
      }
    };
    setTimeout(timeoutfunction.bind(this), this.categoriesList.delay);
  }

  selectCategoriesList(idx) {
    let { spaceCatgId, catgNm } = this.state.categoriesList.list[idx];
    let { value, selectionEnd } = this.refs.inputbox;
    let start = value.lastIndexOf('#', selectionEnd);

    var space = start > 0 ? ' ' : '';

    let pre = value.substring(0, start);
    let post = value.substring(selectionEnd, value.length);
    let categoriesList = false;

    categoriesList = space + '#' + catgNm + '(' + spaceCatgId + ') ';

    this.setInputBox(pre + categoriesList + post);
    this.refs.inputbox.selectionStart = start + categoriesList.length;
    this.refs.inputbox.selectionEnd = start + categoriesList.length;
  }

  moveCategoriesListCursor(move) {
    this.setCategoriesListCursor(this.state.categoriesList.cursor + move);
  }

  setCategoriesListCursor(_cursor) {
    let { list, cursor } = this.state.categoriesList;
    cursor = (_cursor + list.length) % list.length;
    this.setState({
      ...this.state,
      categoriesList: { list: list, cursor: cursor },
    });
  }

  //TMS 할 일 목록(^)
  searchTaskList(target) {
    if (this.checkTMS(target)) {
      return;
    }

    const taskRegx = /\^[0-9]*/g;

    let { value, selectionEnd } = target;
    let matchedTasks = value.replaceAll(' ', '').match(taskRegx);
    let matchedTaskString = '';

    if (matchedTasks !== null) {
      matchedTaskString = matchedTasks.toString();
    }

    if (matchedTaskString === '^') {
      matchedTaskString = '';
    }

    let start = value.lastIndexOf('^', selectionEnd);
    let text = value.substring(start, selectionEnd);
    this.findTMSTask(text);
  }

  findTMSTask(text) {
    const regx = /\^[0-9]*/g;
    let matchedTask = text.match(regx) || [];

    this.getTasksList(
      matchedTask.length > 0
        ? matchedTask[0] === '^'
          ? matchedTask[0]
          : matchedTask[0].substring(1)
        : ''
    );
  }

  getTasksList(text) {
    //인풋 창에 입력된 text 잘라서 spaceId만 추출
    let inputText = this.refs.inputbox.value;
    let s1 = inputText.indexOf('(') + 1;
    let e1 = inputText.indexOf(')');
    let spaceId = '';

    spaceId = inputText.substring(s1, e1);

    const timeoutfunction = () => {
      if (this.tasksList.text === text) {
        return;
      } else {
        this.tasksList.text = inputText;
      }

      if (text.length > 0) {
        let subText = '';

        if (inputText.indexOf('^') >= 0) {
          let s = inputText.indexOf('^') + 1;
          subText = inputText.substring(s);
        }

        if (subText.length > 0) {
          let list = this.state.tasksList.list;
          let filterList = [];

          list.filter((data) => {
            if (data.title.toLowerCase().includes(subText.toLowerCase())) {
              filterList.push(data);
            }
          });
          123 ^
            this.setState({
              ...this.state,
              openTasksList: true,
              tasksList: { list: list, filterList: filterList, cursor: 0 },
            });

          if (list.length > 0 && filterList.length === 0) {
            this.setState({ ...this.state, openTasksList: false });
          }
        } else {
          const param = {
            tp: 'TOD1017',
            spaceId: spaceId.toString(),
          };

          Socket.getApi().searchTaskList(param, (msg) => {
            this.setState({ ...this.state, openTasksList: true });
          });
        }
      } else {
        this.setState({ ...this.state, tasksList: { list: [], cursor: 0 } });
      }
    };
    setTimeout(timeoutfunction.bind(this), this.tasksList.delay);
  }

  selectTasksList(idx) {
    const { taskId, spaceNm, spaceId } = this.state.tasksList.list[idx];
    const { value, selectionEnd } = this.refs.inputbox;
    const start = value.lastIndexOf('^', selectionEnd);

    this.tasksList.taskId = taskId;

    let pre = value.substring(0, start);
    let post = value.substring(selectionEnd, value.length);
    let text = '';
    let selectSpace = ` $${spaceNm}(${spaceId}) `;

    let filterTaskId = '';
    let filterspaceNm = '';
    let filterspaceId = '';
    let selectFilterSpace = '';

    if (this.state.tasksList.filterList.length > 0) {
      filterTaskId = this.state.tasksList.filterList[idx].taskId;
      filterspaceNm = this.state.tasksList.filterList[idx].spaceNm;
      filterspaceId = this.state.tasksList.filterList[idx].spaceId;
      selectFilterSpace = ` $${filterspaceNm}(${filterspaceId}) `;
      this.tasksList.filterTaskId = filterTaskId;
    }

    if (pre.indexOf('$') > 0) {
      text = pre + `^${filterTaskId === '' ? taskId : filterTaskId} ` + post;
      this.setInputBox(text);
      this.refs.inputbox.selectionStart = start + text.length;
      this.refs.inputbox.selectionEnd = start + text.length;
    } else {
      text =
        pre +
        (selectFilterSpace === '' ? selectSpace : selectFilterSpace) +
        `^${filterTaskId === '' ? taskId : filterTaskId} ` +
        post;
      this.setInputBox(text);
      this.refs.inputbox.selectionStart = start + text.length;
      this.refs.inputbox.selectionEnd = start + text.length;
    }
  }

  moveTasksListCursor(move) {
    this.setTasksListCursor(this.state.tasksList.cursor + move);
  }

  setTasksListCursor(_cursor) {
    let { list, cursor, filterList } = this.state.tasksList;
    cursor = (_cursor + list.length) % list.length;

    if (filterList.length > 0) {
      cursor = (_cursor + filterList.length) % filterList.length;
    }

    this.setState({
      ...this.state,
      tasksList: { list: list, filterList: filterList, cursor: cursor },
    });
  }

  //App
  onClickApp() {
    let openApp = this.state.openApp;
    if (this.noticechannel || this.anonymousFreezing) {
      openApp = true;
      //alert(this.language.chatInputNoticeWindow);
    }
    if (!openApp) {
      this.openHistory = false;
      this.setState({
        ...this.state,
        openApp: !openApp,
        openCommand: false,
        openMention: false,
        openTerm: false,
        openSpacesList: false,
        openCategoriesList: false,
        openTasksList: false,
      });
    } else {
      this.openHistory = this.state.openHistoryList ? true : false;
      this.setState({
        ...this.state,
        openApp: !openApp,
        openCommand: true,
        openMention: true,
        openTerm: true,
        openSpacesList: true,
        openCategoriesList: true,
        openTasksList: true,
      });
    }
    //this.setState({ ...this.state, openApp: !openApp });
  }

  onCloseApp() {
    // kjb
    this.openHistory = this.state.openHistoryList ? true : false;
    this.setState({
      ...this.state,
      openApp: false,
      openCommand: true,
      openMention: true,
      openTerm: true,
      openSpacesList: true,
      openCategoriesList: true,
      openTasksList: true,
    });
  }

  // emoticon
  onClickEmoticon() {
    let openEmoticon = this.state.openEmoticon;
    let openHistory = this.state.openHistoryList;
    if (this.noticechannel || this.anonymousFreezing) {
      openEmoticon = true;
      //alert(this.language.chatInputNoticeWindow);
    }
    if (!openEmoticon) {
      this.openHistory = false;
      this.setState({
        ...this.state,
        openEmoticon: !openEmoticon,
        openCommand: false,
        openMention: false,
        openTerm: false,
        openSpacesList: false,
        openCategoriesList: false,
        openTasksList: false,
      });
    } else {
      this.openHistory = this.state.openHistoryList ? true : false;
      this.setState({
        ...this.state,
        openEmoticon: !openEmoticon,
        openCommand: true,
        openMention: true,
        openSpacesList: true,
        openCategoriesList: true,
        openTerm: true,
        openTasksList: true,
      });
    }
    //this.setState({ ...this.state, openEmoticon: !openEmoticon });
  }

  onCloseEmoticon() {
    this.openHistory = this.state.openHistoryList ? true : false;
    this.setState({
      ...this.state,
      openEmoticon: false,
      openCommand: true,
      openMention: true,
      openTerm: true,
      openSpacesList: true,
      openCategoriesList: true,
      openTasksList: true,
    });
  }

  // 예약 메시지
  onClickReservationMessage() {
    let openReservationMessage = this.state.openReservationMessage;
    if (this.noticechannel || this.anonymousFreezing) {
      openReservationMessage = true;
      //alert(this.language.chatInputNoticeWindow);
    }
    if (!openReservationMessage) {
      this.openHistory = false;
      this.setState({
        ...this.state,
        openReservationMessage: !openReservationMessage,
        openCommand: false,
        openMention: false,
        openTerm: false,
        inputboxValue: this.refs.inputbox.value,
      });
    } else {
      this.openHistory = this.state.openHistoryList ? true : false;
      this.setState({
        ...this.state,
        openReservationMessage: !openReservationMessage,
        openCommand: true,
        openMention: true,
        openTerm: true,
        inputboxValue: this.refs.inputbox.value,
      });
    }
    this.refs.inputbox.value = '';
  }

  onCloseReservationMessage() {
    this.openHistory = this.state.openHistoryList ? true : false;
    this.setState({
      ...this.state,
      openReservationMessage: false,
      openCommand: true,
      openMention: true,
      openTerm: true,
      inputboxValue: '',
    });
  }

  onClickChatbot() {
    let openChat = this.state.openChat;
    let openHistory = this.state.openHistoryList;
    if (this.noticechannel || this.anonymousFreezing) {
      openChat = true;
      //alert(this.language.chatInputNoticeWindow);
    }
    if (!openChat && this.props.botlist.length > 1) {
      this.openHistory = false;
      this.setState({
        ...this.state,
        openChat: !openChat,
        openCommand: false,
        openMention: false,
        openTerm: false,
        openSpacesList: false,
        openCategoriesList: false,
        openTasksList: false,
      });
    } else if (!openChat && this.props.botlist.length === 1) {
      this.chatbotchannel(this.props.botlist[0].UNIQUENAME);
    } else {
      this.openHistory = this.state.openHistoryList ? true : false;
      this.setState({
        ...this.state,
        openChat: !openChat,
        openCommand: true,
        openMention: true,
        openTerm: true,
        openSpacesList: true,
        openCategoriesList: true,
        openTasksList: true,
      });
    }
  }

  onCloseChat() {
    this.openHistory = this.state.openHistoryList ? true : false;
    this.setState({
      ...this.state,
      openChat: false,
      openCommand: true,
      openMention: true,
      openTerm: true,
      openSpacesList: true,
      openCategoriesList: true,
      openTasksList: true,
    });
  }

  emoticonAdd(emotId) {
    this.addMessage('', emotId);
  }

  // giphyAdd(giphyData) {

  //   let data = {
  //     content: giphyData.title,
  //     type: 'L',
  //     file: [{
  //       id: '',
  //       object_name: giphyData.id,
  //       type: 'giphy/' + giphyData.type,
  //       size: -1,
  //     }],
  //   }

  //   this.addMessage('', undefined, undefined, data);
  // }

  selectEmoticonByGropIDPC() {
    Socket.getApi()
      .selectEmoticonByGropIDPC()
      .then(function (msg) {
        if (msg.count > 0) {
          Store.getStore().dispatch(actions.setEmoticon(msg));
        }
      });
  }

  onCompleteUpload(uploadFile, response) {
    let _this = this;
    if (_this.noticechannel) {
      alert(_this.language.chatInputNoticeWindow);
      return;
    } else if (_this.anonymousFreezing) {
      //alert(_this.language.chatInputNoticeWindow);
      return;
    } else {
      Log.debug('onCompleteUpload', response);
      var res = JSON.parse(response);
      var data = res.list.map((_file, idx) => {
        return {
          id: _file.id,
          object_name: _file.object_name,
          type: uploadFile[idx].file.type,
          size: uploadFile[idx].file.size,
        };
      });
      Log.debug(uploadFile, response, data);
      let content = this.refs.inputbox.value.trim();
      this.addMessage(content, undefined, data, (msg) => {
        Log.debug('addMessage', msg);
        this.setState({
          ...this.state,
          openLayerPopup: 'ATTACH',
          // isShowOpenDialogModal: true,
          xhrResponse: response,
          messageids: msg.message_ids,
        });
      });
    }
  }

  onCloseModal() {
    const store = Store.getStore();
    store.dispatch(actions.adddeleteChannel(false));
  }

  setInputBox(text, commandSelect, commandOpenPopup) {
    if (text !== undefined) {
      this.refs.inputbox.value = text;
    }

    if (this.state.spacesList.list.length > 0) {
      this.setState({ ...this.state, spacesList: { list: [], cursor: 0 } });
    } else if (this.state.categoriesList.list.length > 0) {
      this.setState({ ...this.state, categoriesList: { list: [], cursor: 0 } });
    } else if (this.state.tasksList.list.length > 0) {
      this.setState({ ...this.state, tasksList: { list: [], cursor: 0, text: '' } });
    } else {
      let command = { list: [], cursor: 0 };

      if (commandSelect) {
        let commandCompanyCode = this.commandCompanyCode || this.props.profile.companyCode;
        let commandTemp = text.substring(1).trim().toUpperCase();
        let idx = this.props.command.findIndex(
          (c) =>
            (!c.company_code || c.company_code === commandCompanyCode) &&
            c.command.toUpperCase() === commandTemp
        );

        if (idx > -1) {
          this.commandGuideOpen = true;
          command.list.push(this.props.command[idx]);
        }
      }

      this.setState({
        ...this.state,
        openLayerPopup: this.openLayerPopup,
        command: command,
        mention: { list: [], cursor: 0 },
      });

      if (!commandOpenPopup) {
        this.refs.inputbox.focus();
      }
    }
  }

  setMentionToInputBox(mention) {
    let isAnonymousChannel = this.props.channelInfo.channel_type === 3;

    if (!isAnonymousChannel) {
      this.refs.inputbox.value += mention + ' ';
      this.refs.inputbox.focus();
    }
  }

  openUrl(selectedCommand, content) {
    let keyword = content.replace(/\/term/gi, '').trim();
    let searchCube = encodeURIComponent(content.replace(/\/OrgAt/gi, '').trim()); // /Org 검색대상사번 추가
    let { command, popup_url, parameter, width, height, company_code } = selectedCommand;
    let isDm = (this.props.channelInfo.channel_id + '')[0] === '5';
    let isSysop = this.props.channelInfo.channel_register === this.props.profile.userID;
    let isSystemAdmin = global.CONFIG.other.isSystemAdmin === 'Y';
    let memberadd =
      this.props.channelInfo.memberadd_yn !== undefined && this.props.channelInfo.memberadd_yn === 'Y';
    let sysoplist = this.props.channelInfo.channel_sysop_id;
    let tempSysop = false;

    if (sysoplist !== undefined) {
      let sysopidx = sysoplist.findIndex((temp) => temp === this.props.profile.userID);
      if (sysopidx > -1) {
        tempSysop = true;
      }
    }

    if (popup_url !== undefined) {
      let lang = { 1: 'ko', 2: 'ja', 3: 'en', 4: 'zh' };
      let {
        userID,
        languageType,
        deptCode,
        email,
        uniqueName,
        companyCode,
        subEmail,
        refUniqueName,
        subCompanyCode,
      } = this.props.profile;

      if (parameter !== undefined && parameter !== null) {
        parameter = parameter
          .replace(/{{CHANNELID}}/g, this.props.channelInfo.channel_id)
          .replace(/{{ACCOUNTID}}/g, userID)
          .replace(/{{LANGUAGE}}/g, languageType + '')
          .replace(/{{LANGUAGENAME}}/g, lang[languageType])
          .replace(/{{SEARCHCUBE}}/g, searchCube)
          .replace(/{{KEYWORD}}/g, keyword);

        if (!company_code || !subCompanyCode.trim() || company_code === companyCode) {
          parameter = parameter
            .replace(/{{DEPTCODE}}/g, deptCode)
            .replace(/{{UNIQUENAME}}/g, uniqueName)
            .replace(/{{EMAIL}}/g, email);
        } else {
          parameter = parameter
            .replace(/{{DEPTCODE}}/g, '')
            .replace(/{{UNIQUENAME}}/g, refUniqueName)
            .replace(/{{EMAIL}}/g, subEmail);
        }
      }
      let url = popup_url;

      if (parameter !== undefined && parameter !== null) {
        url = url + '?' + (parameter || '');
      }

      if (url.indexOf('web/BizWorks/Gl') > -1) {
        url = url + '&layerfree=true';
      }
      // if ( !global.CONFIG.vertxip ) {
      //url = url.replace('bwpdev.skhynix.com', 'localhost:3000');
      // }

      if (command.toUpperCase() === 'INVITE') {
        if ((!isDm && (isSysop || isSystemAdmin || memberadd || tempSysop)) || isDm) {
          this.openLayerPopup = command.toUpperCase();
        }
      } else if (command.toUpperCase() === 'VOTE') {
        //this.setLayerPopup(command.toUpperCase());
        this.openLayerPopup = command.toUpperCase();
      }
      // else if(command.toUpperCase() === 'HYGPT'){
      //   let token = parameter.split('|')[0];
      //   content = content.substr(7);

      //   // const formData = new FormData();
      //   const xhr = new XMLHttpRequest();

      //   let formData = {
      //     'user_no' : '2069644',
      //     'type' : 'user',
      //     'docs' : content
      //   };

      //   xhr.open('POST', popup_url, true);
      //   xhr.setRequestHeader(token.split(':')[0], token.split(':')[1]);
      //   xhr.setRequestHeader('Content-Type', 'application/json');

      //   xhr.onload = () => {
      //     let res = xhr.response;
      //     res = JSON.parse(res);
      //     console.log(JSON.stringify(res));
      //   };
      //   xhr.send(JSON.stringify(formData));
      // }
      else {
        open(
          url,
          command,
          'width=' +
            width +
            ',height=' +
            height +
            ',toolbar=no,status=no,menubar=no,scrollbars=yes,resizable=yes,location=no'
        );
      }
    }
  }

  openDetail(messageid) {
    const store = Store.getStore();
    // let profile = Store.getProfile();
    // let token = '';
    // if(profile.iFlowToken){
    //   token =profile.iFlowToken.toString().trim();
    // }
    if (typeof messageid === 'string' && (messageid + '').trim().length > 0) {
      let params = {
        messageID: messageid + '',
        channelid: this.props.channelInfo.channel_id + '',
      };
      Socket.getApi().selectMessage(params, (msg) => {
        store.dispatch(actions.moveToDetail(msg));
      });
    }
  }

  onDragEnter(e) {
    //this.activeDrag += 1;
    //this.setState({isActive: this.activeDrag > 0});
  }

  onDragOver(e) {
    if (e) {
      e.preventDefault();
    }

    return false;
  }

  onDragLeave() {
    //this.activeDrag -= 1;
    //if (this.activeDrag === 0) {
    //this.setState({isActive: false});
    //}
  }

  onDrop(e) {
    if (!e) {
      return;
    }

    this.activeDrag = 0;

    if (e.dataTransfer) {
      if (e.dataTransfer.files.length === 0) {
        e.preventDefault();

        var str = e.dataTransfer.getData('text');
        Log.debug(str);

        var json = null;
        try {
          json = JSON.parse(str);
        } catch (e) {
          json = null;
        }

        try {
          var data = JSON.parse(str);

          if (data === null) return;

          // 2021 10 05 비밀문서 채널 and DM채널 이동/복사 불가 추가
          /*
          if(data.r_security_level === 'secret'){
            alert(this.language.secretDocNotCopyMoveChannelAndDM);
          }
          */

          if (data.type !== undefined && data.type === 'hydiskfile') {
            var { r_object_id } = data.message;

            Services.copyToBwp(r_object_id).then((json) => {
              var file = json.list.map((_file, idx) => {
                return {
                  id: _file.r_object_id,
                  object_name: _file.object_name,
                  type: _file.a_content_type,
                  size: _file.r_content_size,
                };
              });

              let content = this.refs.inputbox.value.trim();
              this.addMessage(content, undefined, file, (msg) => {
                Log.debug('addMessage', msg);
                this.setState({
                  ...this.state,
                  openLayerPopup: 'ATTACH',
                  messageids: msg.message_ids,
                });
              });
            });
          } else if (data.type === 'post') {
            var channelid = Store.getStore().getState().channel.currentChannel;

            var url = global.CONFIG.legacy[data.companycode].MAIL_TOPOST.url;
            //type=post&senderac={{senderac}}&sendernm={{sendernm}}&senderem={{senderem}}&messageid={{messageid}}&channelid={{channelid}}
            //var url = global.CONFIG.legacy[companyCode].MAIL_TOPOST + "?type=post&senderac=" + data.senderac + "&sendernm=" + escape(data.sendernm) + "&senderem=" + escape(data.senderem) + "&messageid=" + escape(data.messageid) + "&channelid=" + channelid;

            url = url
              .replace('{{senderac}}', data.senderac)
              .replace('{{sendernm}}', escape(data.sendernm))
              .replace('{{senderem}}', escape(data.senderem))
              .replace('{{messageid}}', escape(data.messageid))
              .replace('{{channelid}}', channelid);
            Log.debug(url);
            window.open(
              url,
              'Mail',
              'width=860, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no'
            );
          } else if (json.type === 'filemove') {
            var { r_object_id } = data.message;

            Services.copyToBwp(r_object_id).then((json) => {
              var file = json.list.map((_file, idx) => {
                return {
                  id: _file.r_object_id,
                  object_name: _file.object_name,
                  type: _file.a_content_type,
                  size: _file.r_content_size,
                };
              });

              let content = this.refs.inputbox.value.trim();
              this.addMessage(content, undefined, file, (msg) => {
                Log.debug('addMessage', msg);
                this.setState({
                  ...this.state,
                  openLayerPopup: 'ATTACH',
                  messageids: msg.message_ids,
                });
              });
            });
          } else if (json.type === 'postfilemove') {
            var { emdid } = data.message;
            var isPost =
              emdid === null || emdid === undefined || emdid === '' || emdid == ' ' || emdid.length > 16;

            if (isPost) {
              e.preventDefault();
              return false;
            }
            Services.copyToBwp(emdid).then((json) => {
              var file = json.list.map((_file, idx) => {
                return {
                  id: _file.r_object_id,
                  object_name: _file.object_name,
                  type: _file.a_content_type,
                  size: _file.r_content_size,
                };
              });

              let content = this.refs.inputbox.value.trim();
              this.addMessage(content, undefined, file, (msg) => {
                Log.debug('addMessage', msg);
                this.setState({
                  ...this.state,
                  openLayerPopup: 'ATTACH',
                  messageids: msg.message_ids,
                });
              });
            });
          }
        } catch (e) {}
      }
    }

    //this.setState({isActive: false, items}, () => {
    //this.upload();
    //});
  }

  onClickRecentButton() {
    Socket.getApi().selectMessageList('DIR', -1);
  }

  onClickHide(e) {
    e.preventDefault();
    e.stopPropagation();
    let store = Store.getStore();
    store.dispatch(actions.hideDetailArea());
  }

  clickHandler() {
    let store = Store.getStore();
    store.dispatch(actions.clickDetailTabItem('member'));
  }

  chatbotchannel(id) {
    // let vertxip = global.CONFIG.vertxip || 'localhost';
    // let isDev = vertxip === '10.158.122.138' || vertxip === 'localhost';
    // if (isDev) Socket.getApi().addDMChannelByUniqueName('BOT001');
    // else Socket.getApi().addDMChannelByUniqueName('X9800002');
    if (!this.noticechannel && !this.anonymousFreezing) {
      //command = false;
      Socket.getApi().addDMChannelByUniqueName(id);
    }
  }

  onCloseChatbotNotice() {
    this.setState({ ...this.state, isShowChatbotNotice: false });
  }

  setHistoryCursor(_cursor) {
    let { list, cursor } = this.state.history;
    cursor = (_cursor + list.length) % list.length;
    this.setState({ ...this.state, history: { list: list, cursor: cursor } });
  }

  selectHistory(idx) {
    let selectedHistory = this.state.history.list[idx];
    if (selectedHistory !== undefined) {
      this.setInputBoxByHistory(selectedHistory);
    }
  }

  // callbackAlarm(state) {
  //   let _this = this;
  //   this.setState({
  //     alarm: state
  //   });
  // }

  setInputBoxByHistory(text) {
    let historyText = '';
    this.setState({ ...this.state, openHistoryList: false }, () => {
      if (text !== undefined) {
        historyText = this.checkCommandHistory(text);
        this.refs.inputbox.value = historyText;
      }
      this.refs.inputbox.focus();
      this.refs.inputbox.selectionStart = historyText.length;
      this.refs.inputbox.selectionEnd = historyText.length;
    });
  }

  checkCommandHistory(text) {
    let retText = text;
    // if (text.indexOf('/') === 0 && !(this.props.channelInfo.sysName.indexOf('HYFB') > -1)) { // 하이피드백 채널 일 시 Command 사용 안되게 수정 220308
    if (text.indexOf('/') === 0) {
      // 하이피드백 채널 일 시 Command 사용 되게 수정 230713
      let commandCompanyCode = this.commandCompanyCode || this.props.profile.companyCode;
      let command = text.substring(1).split(' ')[0];
      let findCommand = '';
      this.props.command.map((item) => {
        if (!item.company_code || item.company_code === commandCompanyCode) {
          if (text.indexOf(' ') > 0 && command.toUpperCase() === item.command.toUpperCase()) {
            findCommand = '/' + item.command + ' ';
          } else if (item.command.toUpperCase().indexOf(command.toUpperCase()) === 0) {
            findCommand = '/' + item.command + ' ';
          }
        }
      });
      retText = findCommand === '' ? retText : findCommand;
    }

    return retText;
  }

  moveHistoryCursor(move) {
    this.setHistoryCursor(this.state.history.cursor + move);
  }

  openMessageTerm(messageText) {
    Socket.getApi().termDictionary({
      channelID: this.props.channelInfo.channel_id,
      channelMsg: messageText,
    });
    this.setState({
      ...this.state,
      openTerm: true,
      openMention: false,
      openCommand: false,
      openSpacesList: false,
      openCategoriesList: false,
      openTasksList: false,
    });
  }

  onCloseMessageTerm() {
    Store.getStore().dispatch(actions.setTermList(false));
    this.setState({
      openTerm: false,
      openCommand: true,
      openMention: true,
      openSpacesList: true,
      openCategoriesList: true,
      openTasksList: true,
    });
  }

  onCloseTransContent() {
    Store.getStore().dispatch(actions.setTransContent(false));
  }

  messageInput(content) {
    let _this = this;
    if (content !== false) {
      _this.refs.inputbox.value = content;
    }
    _this.onCloseTransContent();
  }

  onTermClick(keyWord) {
    this.openGlossary(keyWord);
  }

  onclickTitle(item, e) {
    let _this = this;
    let opinion = item.commentTypeYN === 'Y';

    this.setState({
      messageid: item.message_id,
      isopinion: opinion,
      count: _this.state.votelist.length,
    });
  }

  onclickOpenNotice(idx) {
    let url;
    if (idx === 1) {
      url = this.props.channelInfo.channel_notice_url;
    } else if (idx === 2) {
      url = this.props.channelInfo.channel_notice1_url;
    } else {
      url = this.props.channelInfo.channel_notice2_url;
    }
    window.open(
      url,
      'Notice',
      'width=860, height=740,toolbar=no,status=no,menubar=no,scrollbars=yes, resizable=yes, location=no'
    );
  }

  onclickNoticeSet(isnotice) {
    let param;
    if (isnotice === 'Y') {
      param = {
        channelID: this.props.channelInfo.channel_id,
        noticeOpenYn: 'Y',
      };
    } else {
      param = {
        channelID: this.props.channelInfo.channel_id,
        noticeOpenYn: 'N',
      };
    }
    this.setState({ ...this.state, isNotice: !this.state.isNotice });
    Socket.getApi().channelNoticeSetting(param);
  }

  onCloseVoteModal(e) {
    this.setState({
      messageid: '',
    });
  }

  addBotMessageSend() {
    let _this = this;
    _this.addBotMessage(_this.refs.inputbox.value);
  }

  renderRecentButton() {
    if (this.props.messages.hasNext === 1) {
      let body =
        this.props.messages.newMessageCount > 0 ? (
          <p>
            <span>
              {this.language.newMessageReceive + '(' + this.props.messages.newMessageCount + ')'}
            </span>
            <a className="gorecent" onClick={this.onClickRecentButton}>
              Go to Recent
            </a>
          </p>
        ) : (
          <p>
            <span>
              <a className="gorecent" onClick={this.onClickRecentButton}>
                Go to Recent
              </a>
            </span>
          </p>
        );
      return <div className="recentto recent-newmessage">{body}</div>;
    } else {
      return false;
    }
  }

  renderPresenceList() {
    let list = [];
    if (this.state.presence instanceof Array) {
      list = this.state.presence.map((item, idx) => {
        return (
          <MemberItem
            key={idx}
            inCompany={item.inCompany}
            username={item.user_name}
            userid={item.user_id}
            status={item.status}
            companyCode={item.company_code || ''}
          />
        );
      });
    }

    return (
      <div
        className="channelMember"
        style={{ height: list.length > 0 ? 'auto' : '200px' }}
        onClick={this.clickHandler}
      >
        <div className="channelMemberList">
          <div className="moveChannelList" onClick={this.clickHandler}>
            <a href="#" />
          </div>
          {list}
        </div>
        {!this.props.isMini && (
          <a
            className={this.props.hideDetail ? 'hide-btn left-arrow' : 'hide-btn right-arrow'}
            onClick={this.onClickHide.bind(this)}
          />
        )}
      </div>
    );
  }

  renderAnonymousNotice() {
    return (
      <div className="channelMember anonymous">
        <div className="anonymousChannelNotice">
          <span>{this.props.channelInfo.channel_notice}</span>
        </div>
        {!this.props.isMini && (
          <a
            className={this.props.hideDetail ? 'hide-btn left-arrow' : 'hide-btn right-arrow'}
            onClick={this.onClickHide.bind(this)}
          />
        )}
      </div>
    );
  }

  renderOpenDialog() {
    let channelID = this.props.channelInfo.channel_id + '';
    let isDm = channelID[0] === '5';

    if (
      this.props.explosion &&
      this.props.explosion.tp === 'CHL1031' &&
      this.props.explosion.duration === 0 &&
      this.props.channelInfo.channel_type === 3
    ) {
      return false;
    }

    if (this.props.explosion && this.props.explosion.channel_id === this.props.channelInfo.channel_id) {
      return (
        <ModalContainer>
          <ModalDialog>
            <OpenDialogPop
              onClose={this.onCloseModal.bind(this)}
              channelid={this.props.channelInfo.channel_id}
              channeldelinfo={this.props.explosion}
              tp={this.props.explosion.tp}
              explosionCancel={this.handleChannelDeleteCancel}
              deleteChannel={this.handleChannelDeleteStop}
              isdm={isDm}
            />
          </ModalDialog>
        </ModalContainer>
      );
    } else {
    }
  }

  renderKeywordMsg() {
    return this.state.isKeyword === false ? (
      <ModalContainer>
        <ModalDialog>
          <ConfirmAlert
            msg={this.state.keywordMsg}
            confirm={this.handleConfirm.bind(this)}
            keyDown={this.handleKeyDown.bind(this)}
          />
        </ModalDialog>
      </ModalContainer>
    ) : (
      this.state.addKeyword === true && (
        <ModalContainer>
          <ModalDialog>
            <ConfirmAlert
              msg={this.state.keywordMsg}
              confirm={this.handleConfirm.bind(this)}
              keyDown={this.handleKeyDown.bind(this)}
            />
          </ModalDialog>
        </ModalContainer>
      )
    );
  }

  renderVoteList() {
    let _this = this;
    let list = [];
    let preTitle = 'Q. ';
    let title = '';
    let lastTitle = false;
    if (_this.state.votelist instanceof Array) {
      title = preTitle + _this.state.votelist[0].title.split('\n');
    }
    if (_this.state.votelist.length > 1) {
      let lang = this.language.last2Msg.replace('{VOTENAME}', '');
      lastTitle = lang.replace('{COUNT}', _this.state.votelist.length - 1);
    } else lastTitle = this.language.last1Msg.replace('{VOTENAME}', '');
    return (
      <div className="channelvoteItem" onClick={this.onclickTitle.bind(this, _this.state.votelist[0])}>
        <a>
          <span className="channelvote-title">{title}</span>
          {lastTitle}
        </a>
      </div>
    );
  }

  makeBold(str) {
    var regx = /(\*{2}(?!\*)[\s\S]*?[^\*\*]\*{2}(?!\*))/g;

    var content = str.split(regx);

    var ret = [];
    for (var i = 0; i < content.length; i++) {
      if (content[i].startsWith('**') && content[i].endsWith('**')) {
        ret.push(<b>{content[i].substring(2, content[i].length - 2)}</b>);
      } else {
        ret.push(content[i]);
      }
    }

    return ret;
  }

  makeEm(str) {
    var regx = /(\|{2}(?!\|)[\s\S]*?[^\|\|]\|{2}(?!\|))/g;

    var content = str.split(regx);

    var ret = [];
    for (var i = 0; i < content.length; i++) {
      if (content[i].startsWith('||') && content[i].endsWith('||')) {
        ret.push(<em>{content[i].substring(2, content[i].length - 2)}</em>);
      } else {
        ret.push(content[i]);
      }
    }

    return ret;
  }

  makeBlueEmphasize(str) {
    var regx = /(\({2,4}(?!\()[\s\S]*?[^\(\(]\){2,4}(?!\)))/g;

    var content = str.split(regx);
    var _emphasizeStyle1 = [...this.emphasizeStyle4];
    var _emphasizeStyle2 = [...this.emphasizeStyle2];
    var ret = [];
    for (var i = 0; i < content.length; i++) {
      if (content[i].startsWith('((((( ') && content[i].endsWith(' )))))')) {
        _emphasizeStyle2.fontSize = this.fontSize + 5 + 'px';
        ret.push(<b style={_emphasizeStyle2}>{content[i].substring(5, content[i].length - 5)}</b>);
        // ret.push(<b style={_emphasizeStyle2}>{this.renderLinebreak(content[i].substring(5, content[i].length - 5))}</b>);
      } else if (content[i].startsWith('(((( ') && content[i].endsWith(' ))))')) {
        _emphasizeStyle2.fontSize = this.fontSize + 4 + 'px';
        ret.push(<b style={_emphasizeStyle2}>{content[i].substring(4, content[i].length - 4)}</b>);
        // ret.push(<b style={_emphasizeStyle2}>{this.renderLinebreak(content[i].substring(4, content[i].length - 4))}</b>);
      } else if (content[i].startsWith('((( ') && content[i].endsWith(' )))')) {
        _emphasizeStyle2.fontSize = this.fontSize + 3 + 'px';
        ret.push(<b style={_emphasizeStyle2}>{content[i].substring(3, content[i].length - 3)}</b>);
        // ret.push(<b style={_emphasizeStyle2}>{this.renderLinebreak(content[i].substring(3, content[i].length - 3))}</b>);
      } else if (content[i].startsWith('(( ') && content[i].endsWith(' ))')) {
        _emphasizeStyle2.fontSize = this.fontSize + 1 + 'px';
        ret.push(<b style={_emphasizeStyle1}>{content[i].substring(2, content[i].length - 2)}</b>);
        // ret.push(<b style={_emphasizeStyle1}>{this.renderLinebreak(content[i].substring(2, content[i].length - 2))}</b>);
      } else {
        ret.push(content[i]);
        // ret.push(this.renderLinebreak(content[i]));
      }
    }

    return ret;
  }

  makeRedEmphasize(str) {
    var regx = /(\[{2,4}(?!\[)[\s\S]*?[^\]\]]\]{2,4}(?!\]))/g;

    var content = str.split(regx);
    var _emphasizeStyle1 = [...this.emphasizeStyle2];
    var _emphasizeStyle2 = [...this.emphasizeStyle4];
    var ret = [];
    for (var i = 0; i < content.length; i++) {
      if (content[i].startsWith('[[[[[ ') && content[i].endsWith(' ]]]]]')) {
        _emphasizeStyle1.fontSize = this.fontSize + 5 + 'px';
        ret.push(<b style={_emphasizeStyle1}>{content[i].substring(5, content[i].length - 5)}</b>);
        // ret.push(<b style={_emphasizeStyle1}>{this.renderLinebreak(content[i].substring(5, content[i].length - 5))}</b>);
      } else if (content[i].startsWith('[[[[ ') && content[i].endsWith(' ]]]]')) {
        _emphasizeStyle1.fontSize = this.fontSize + 4 + 'px';
        ret.push(<b style={_emphasizeStyle1}>{content[i].substring(4, content[i].length - 4)}</b>);
        // ret.push(<b style={_emphasizeStyle1}>{this.renderLinebreak(content[i].substring(4, content[i].length - 4))}</b>);
      } else if (content[i].startsWith('[[[ ') && content[i].endsWith(' ]]]')) {
        _emphasizeStyle1.fontSize = this.fontSize + 3 + 'px';
        ret.push(<b style={_emphasizeStyle1}>{content[i].substring(3, content[i].length - 3)}</b>);
        // ret.push(<b style={_emphasizeStyle1}>{this.renderLinebreak(content[i].substring(3, content[i].length - 3))}</b>);
      } else if (content[i].startsWith('[[ ') && content[i].endsWith(' ]]')) {
        _emphasizeStyle2.fontSize = this.fontSize + 1 + 'px';
        ret.push(<b style={_emphasizeStyle2}>{content[i].substring(2, content[i].length - 2)}</b>);
        // ret.push(<b style={_emphasizeStyle2}>{this.renderLinebreak(content[i].substring(2, content[i].length - 2))}</b>);
      } else {
        ret.push(content[i]);
        // ret.push(this.renderLinebreak(content[i]));
      }
    }

    return ret;
  }

  makeCancleLine(str) {
    // 221228 취소선 추가
    // var regx = /(~{2}(?!~)[\s\S]*?[^~~]~{2}(?!~))/g;
    var regx = /(`{2}(?!`)[\s\S]*?[^``]`{2}(?!`))/g;

    var content = str.split(regx);

    var ret = [];
    for (var i = 0; i < content.length; i++) {
      // if (content[i].startsWith('~~') && content[i].endsWith('~~')) {
      if (content[i].startsWith('``') && content[i].endsWith('``')) {
        ret.push(<del>{content[i].substring(2, content[i].length - 2)}</del>);
        // ret.push(<del>{this.renderLinebreak(content[i].substring(2, content[i].length - 2))}</del>);
      } else {
        ret.push(content[i]);
        // ret.push(this.renderLinebreak(content[i]));
      }
    }

    return ret;
  }

  renderMarkdown(data) {
    if (data === null || data === undefined) return;
    // var regx = /(\*{2}(?!\*)[\s\S]*?[^\*\*]\*{2}(?!\*))|(_{2}(?!_)[\s\S]*?[^__]_{2}(?!_))|(\[{2,5}(?!\[)[\s\S]*?[^\]\]]\]{2,5}(?!\]))|(\({2,5}(?!\()[\s\S]*?[^\(\(]\){2,5}(?!\)))/g; //
    // var regx = /(\*{2}(?!\*)[\s\S]*?[^\*\*]\*{2}(?!\*))|(_{2}(?!_)[\s\S]*?[^__]_{2}(?!_))|(~{2}(?!~)[\s\S]*?[^~~]~{2}(?!~))|(\[{2,5}(?!\[)[\s\S]*?[^\]\]]\]{2,5}(?!\]))|(\({2,5}(?!\()[\s\S]*?[^\(\(]\){2,5}(?!\)))/g; // 취소선 추가시 이걸로 적용
    var regx =
      /(\*{2}(?!\*)[\s\S]*?[^\*\*]\*{2}(?!\*))|(\|{2}(?!\|)[\s\S]*?[^\|\|]\|{2}(?!\|))|(`{2}(?!`)[\s\S]*?[^``]`{2}(?!`))|(\[{2,5}(?!\[)[\s\S]*?[^\]\]]\]{2,5}(?!\]))|(\({2,5}(?!\()[\s\S]*?[^\(\(]\){2,5}(?!\)))/g; // 취소선 추가시 이걸로 적용
    // var regx = /(\*{2}(?!\*)[\s\S]*?[^\*\*]\*{2}(?!\*))|(_{2}(?!_)[\s\S]*?[^__]_{2}(?!_))|(`{2}(?!`)[\s\S]*?[^``]`{2}(?!`))|(#{2}(?!#)[\s\S]*?[^##]#{2}(?!#))|(\[{2,5}(?!\[)[\s\S]*?[^\]\]]\]{2,5}(?!\]))|(\({2,5}(?!\()[\s\S]*?[^\(\(]\){2,5}(?!\)))/g; // 취소선 및 밑줄 추가시 이걸로 적용
    var ret = [];

    var content = data.split(regx);
    var _tmp;

    // let _emphasizeStyle1 = this.style('red', 0);
    // _emphasizeStyle1.fontSize = this.fontSize + 3;
    // var _emphasizeStyle11 = _emphasizeStyle1;
    // this.emphasizeStyle1.fontSize = this.fontSize + 4;
    // var _emphasizeStyle12 = this.emphasizeStyle1;
    // this.emphasizeStyle1.fontSize = this.fontSize + 5;
    // var _emphasizeStyle13 = this.emphasizeStyle1;
    // let _emphasizeStyle11 = [];
    // let _emphasizeStyle12 = [];
    // let _emphasizeStyle13 = [];
    // let emphasizeStyle1 = [...this.emphasizeStyle1];
    // this.emphasizeStyle1.fontSize = this.fontSize + 3;
    // _emphasizeStyle11 = [...this.emphasizeStyle1];
    // _emphasizeStyle11.fontSize = this.fontSize + 4;
    // _emphasizeStyle12 = [..._emphasizeStyle11];
    // _emphasizeStyle12.fontSize = this.fontSize + 5;
    // _emphasizeStyle13 = [..._emphasizeStyle12];

    // var _emphasizeStyle2 = this.emphasizeStyle2;
    // this.emphasizeStyle2.fontSize = this.fontSize + 3;
    // var _emphasizeStyle21 = this.emphasizeStyle2;
    // this.emphasizeStyle2.fontSize = this.fontSize + 4;
    // var _emphasizeStyle22 = this.emphasizeStyle2;
    // this.emphasizeStyle2.fontSize = this.fontSize + 5;
    // var _emphasizeStyle23 = this.emphasizeStyle2;

    for (var i = 0; i < content.length; i++) {
      var str = content[i];
      if (str === undefined || str === null) continue;

      if (str.startsWith('**') && str.endsWith('**')) {
        _tmp = str.substring(2, str.length - 2);
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<b>{_tmp}</b>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<b>{_tmp}</b>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<b>{_tmp}</b>);
        // }
        else if (str.indexOf('[[ ') > -1) {
          _tmp = this.makeRedEmphasize(_tmp);
          ret.push(<b>{_tmp}</b>);
        } else if (str.indexOf('(( ') > -1) {
          _tmp = this.makeBlueEmphasize(_tmp);
          ret.push(<b>{_tmp}</b>);
        } else {
          ret.push(<b>{_tmp}</b>);
          // ret.push(<b>{this.renderLinebreak(_tmp)}</b>);
        }
      } else if (str.startsWith('||') && str.endsWith('||')) {
        _tmp = str.substring(2, str.length - 2);
        if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<em>{_tmp}</em>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<em>{_tmp}</em>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<em>{_tmp}</em>);
        // }
        else if (str.indexOf('[[ ') > -1) {
          _tmp = this.makeRedEmphasize(_tmp);
          ret.push(<em>{_tmp}</em>);
        } else if (str.indexOf('(( ') > -1) {
          _tmp = this.makeBlueEmphasize(_tmp);
          ret.push(<em>{_tmp}</em>);
        } else {
          ret.push(<em>{_tmp}</em>);
          // ret.push(<em>{this.renderLinebreak(_tmp)}</em>);
        }
      } else if (str.startsWith('``') && str.endsWith('``')) {
        // 221228 취소선 추가
        _tmp = str.substring(2, str.length - 2);
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<del>{_tmp}</del>);
        } else if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<del>{_tmp}</del>);
        } else if (str.indexOf('##') > -1) {
          // 221228 밑줄 추가
          _tmp = this.makeUnderLine(_tmp);
          ret.push(<del>{_tmp}</del>);
        } else if (str.indexOf('[[ ') > -1) {
          _tmp = this.makeRedEmphasize(_tmp);
          ret.push(<del>{_tmp}</del>);
        } else if (str.indexOf('(( ') > -1) {
          _tmp = this.makeBlueEmphasize(_tmp);
          ret.push(<del>{_tmp}</del>);
        } else {
          ret.push(<del>{_tmp}</del>);
          // ret.push(<del>{this.renderLinebreak(_tmp)}</del>);
        }
      }
      // else if (str.startsWith('##') && str.endsWith('##')) { // 221228 밑줄 추가
      //   _tmp = str.substring(2, str.length - 2);
      //   if (str.indexOf('||') > -1) {
      //     _tmp = this.makeEm(_tmp);
      //     ret.push(<u>{_tmp}</u>);
      //   } else if (str.indexOf('**') > -1) {
      //     _tmp = this.makeBold(_tmp);
      //     ret.push(<u>{_tmp}</u>);
      //   }
      //   else if (str.indexOf('``') > -1) { // 221228 취소선 추가
      //     _tmp = this.makeCancleLine(_tmp);
      //     ret.push(<u>{_tmp}</u>);
      //   }
      //   else if (str.indexOf('[ ') > -1) {
      //     _tmp = this.makeRedEmphasize(_tmp);
      //     ret.push(<u>{_tmp}</u>);
      //   } else if (str.indexOf('( ') > -1) {
      //     _tmp = this.makeBlueEmphasize(_tmp);
      //     ret.push(<u>{_tmp}</u>);
      //   } else {
      //     ret.push(<u>{this.renderLinebreak(_tmp)}</u>);
      //   }
      // }
      else if (str.startsWith('[[[[[ ') && str.endsWith(' ]]]]]')) {
        _tmp = str.substring(5, str.length - 5);
        //_emphasizeStyle1.fontSize = this.fontSize + 5 + 'px';
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<b style={this.emphasizeStyle13}>{_tmp}</b>);
        } else if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<b style={this.emphasizeStyle13}>{_tmp}</b>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<b style={this.emphasizeStyle13}>{_tmp}</b>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<b>{_tmp}</b>);
        // }
        else if (str.indexOf('(( ') > -1) {
          _tmp = this.makeBlueEmphasize(_tmp);
          ret.push(<b style={this.emphasizeStyle23}>{_tmp}</b>);
        } else {
          ret.push(<b style={this.emphasizeStyle13}>{_tmp}</b>);
          // ret.push(<b style={this.emphasizeStyle13}>{this.renderLinebreak(_tmp)}</b>);
        }
      } else if (str.startsWith('[[[[ ') && str.endsWith(' ]]]]')) {
        _tmp = str.substring(4, str.length - 4);
        //_emphasizeStyle1.fontSize = this.fontSize + 4 + 'px';
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<b style={this.emphasizeStyle12}>{_tmp}</b>);
        } else if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<b style={this.emphasizeStyle12}>{_tmp}</b>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<b style={this.emphasizeStyle12}>{_tmp}</b>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<b style={this.emphasizeStyle12}>{_tmp}</b>);
        // }
        else if (str.indexOf('(( ') > -1) {
          _tmp = this.makeBlueEmphasize(_tmp);
          ret.push(<b style={this.emphasizeStyle22}>{_tmp}</b>);
        } else {
          ret.push(<b style={this.emphasizeStyle12}>{_tmp}</b>);
          // ret.push(<b style={this.emphasizeStyle12}>{this.renderLinebreak(_tmp)}</b>);
        }
      } else if (str.startsWith('[[[ ') && str.endsWith(' ]]]')) {
        _tmp = str.substring(3, str.length - 3);
        //_emphasizeStyle1.fontSize = this.fontSize + 3 + 'px';
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<b style={this.emphasizeStyle11}>{_tmp}</b>);
        } else if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<b style={this.emphasizeStyle11}>{_tmp}</b>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<b style={this.emphasizeStyle11}>{_tmp}</b>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<b style={this.emphasizeStyle11}>{_tmp}</b>);
        // }
        else if (str.indexOf('(( ') > -1) {
          _tmp = this.makeBlueEmphasize(_tmp);
          ret.push(<b style={this.emphasizeStyle21}>{_tmp}</b>);
        } else {
          ret.push(<b style={this.emphasizeStyle11}>{_tmp}</b>);
          // ret.push(<b style={this.emphasizeStyle11}>{this.renderLinebreak(_tmp)}</b>);
        }
      } else if (str.startsWith('[[ ') && str.endsWith(' ]]')) {
        _tmp = str.substring(2, str.length - 2);
        //_emphasizeStyle1.fontSize = this.fontSize + 3 + 'px';
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
        } else if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
        // }
        else if (str.indexOf('(( ') > -1) {
          _tmp = this.makeBlueEmphasize(_tmp);
          ret.push(<b style={this.emphasizeStyle4}>{_tmp}</b>);
        } else {
          ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
          // ret.push(<b style={this.emphasizeStyle3}>{this.renderLinebreak(_tmp)}</b>);
        }
      } else if (str.startsWith('((((( ') && str.endsWith(' )))))')) {
        _tmp = str.substring(5, str.length - 5);
        // _emphasizeStyle2.fontSize = this.fontSize + 5 + 'px';
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<b style={this.emphasizeStyle23}>{_tmp}</b>);
        } else if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<b style={this.emphasizeStyle23}>{_tmp}</b>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<b style={this.emphasizeStyle23}>{_tmp}</b>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<b style={this.emphasizeStyle23}>{_tmp}</b>);
        // }
        else if (str.indexOf('[[ ') > -1) {
          _tmp = this.makeRedEmphasize(_tmp);
          ret.push(<b style={this.emphasizeStyle13}>{_tmp}</b>);
        } else {
          ret.push(<b style={this.emphasizeStyle23}>{_tmp}</b>);
          // ret.push(<b style={this.emphasizeStyle23}>{this.renderLinebreak(_tmp)}</b>);
        }
      } else if (str.startsWith('(((( ') && str.endsWith(' ))))')) {
        _tmp = str.substring(4, str.length - 4);
        //_emphasizeStyle2.fontSize = this.fontSize + 4 + 'px';
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<b style={this.emphasizeStyle22}>{_tmp}</b>);
        } else if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<b style={this.emphasizeStyle22}>{_tmp}</b>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<b style={this.emphasizeStyle22}>{_tmp}</b>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<b style={this.emphasizeStyle22}>{_tmp}</b>);
        // }
        else if (str.indexOf('[[ ') > -1) {
          _tmp = this.makeRedEmphasize(_tmp);
          ret.push(<b style={this.emphasizeStyle12}>{_tmp}</b>);
        } else {
          ret.push(<b style={this.emphasizeStyle22}>{_tmp}</b>);
          // ret.push(<b style={this.emphasizeStyle22}>{this.renderLinebreak(_tmp)}</b>);
        }
      } else if (str.startsWith('((( ') && str.endsWith(' )))')) {
        _tmp = str.substring(3, str.length - 3);
        //_emphasizeStyle2.fontSize = this.fontSize + 3 + 'px';
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<b style={this.emphasizeStyle21}>{_tmp}</b>);
        } else if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<b style={this.emphasizeStyle21}>{_tmp}</b>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<b style={this.emphasizeStyle21}>{_tmp}</b>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<b style={this.emphasizeStyle21}>{_tmp}</b>);
        // }
        else if (str.indexOf('[[ ') > -1) {
          _tmp = this.makeRedEmphasize(_tmp);
          ret.push(<b style={this.emphasizeStyle11}>{_tmp}</b>);
        } else {
          ret.push(<b style={this.emphasizeStyle21}>{_tmp}</b>);
          // ret.push(<b style={this.emphasizeStyle21}>{this.renderLinebreak(_tmp)}</b>);
        }
      } else if (str.startsWith('(( ') && str.endsWith(' ))')) {
        _tmp = str.substring(2, str.length - 2);
        //_emphasizeStyle2.fontSize = this.fontSize + 3 + 'px';
        if (str.indexOf('||') > -1) {
          _tmp = this.makeEm(_tmp);
          ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
        } else if (str.indexOf('**') > -1) {
          _tmp = this.makeBold(_tmp);
          ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
        } else if (str.indexOf('``') > -1) {
          // 221228 취소선 추가
          _tmp = this.makeCancleLine(_tmp);
          ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
        }
        // else if (str.indexOf('##') > -1) { // 221228 밑줄 추가
        //   _tmp = this.makeUnderLine(_tmp);
        //   ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
        // }
        else if (str.indexOf('[[ ') > -1) {
          _tmp = this.makeRedEmphasize(_tmp);
          ret.push(<b style={this.emphasizeStyle3}>{_tmp}</b>);
        } else {
          ret.push(<b style={this.emphasizeStyle4}>{_tmp}</b>);
          // ret.push(<b style={this.emphasizeStyle4}>{this.renderLinebreak(_tmp)}</b>);
        }
      } else {
        ret.push(str);
        // ret.push(this.renderLinebreak(str));
      }
    }
    //content = content.replaceAll('\n')
    return ret;
  }

  renderNoticeList(notice, idx, ischk) {
    let lastTitle = false;
    let { image } = global.CONFIG.resource;
    let isDisplaynoti1 = this.props.channelInfo.channel_notice1;
    let isDisplaynoti2 = !this.props.channelInfo.channel_notice2;
    let countChk2 = isDisplaynoti1 && !isDisplaynoti2 ? true : false;
    let countChk1 = !countChk2 && isDisplaynoti1 ? true : false;
    lastTitle = this.renderMarkdown(notice.trim());
    let noticeYn =
      this.props.infosummary.channel_set !== undefined
        ? this.props.infosummary.channel_set.NOTICEYN !== undefined
          ? this.props.infosummary.channel_set.NOTICEYN === 'Y'
            ? true
            : false
          : false
        : false;

    if (lastTitle) {
      return (
        <div className="channelNoticeItem">
          <a>
            <span
              className="channelNotice-title"
              style={{ width: '1020px' }}
              onClick={this.onclickOpenNotice.bind(this, idx)}
            >
              <img src={image + '/ico/ico_notice.png'} />
              {lastTitle.length > 200 ? lastTitle.substring(0, 199) + '....' : lastTitle}
            </span>
          </a>
          {idx === 1 && !noticeYn && ''}
          {idx === 1 && !noticeYn && countChk1 && (
            <span style={{ color: 'red', 'font-weight': 'bold' }}>{'1+'}</span>
          )}
          &nbsp;
          {idx === 1 && !noticeYn && countChk2 && (
            <span style={{ color: 'red', 'font-weight': 'bold' }}>{'2+'}</span>
          )}
          &nbsp;
          {idx === 1 && !noticeYn && (
            <img
              style={{ cursor: 'pointer' }}
              src={image + '/ico/arrow_down.png'}
              onClick={this.onclickNoticeSet.bind(this, 'Y')}
            />
          )}
          &nbsp;&nbsp;
          {idx === 2 && isDisplaynoti2 && (
            <img
              style={{ cursor: 'pointer' }}
              src={image + '/ico/arrow_up.png'}
              onClick={this.onclickNoticeSet.bind(this, 'N')}
            />
          )}
          &nbsp;&nbsp;
          {idx === 3 && (
            <img
              style={{ cursor: 'pointer' }}
              src={image + '/ico/arrow_up.png'}
              onClick={this.onclickNoticeSet.bind(this, 'N')}
            />
          )}
        </div>
      );
    } else false;
  }

  copyChannelID() {
    let copytext = this.props.channelInfo.channel_id + '';
    if (this.is_ie()) {
      window.clipboardData.setData('Text', copytext);
    } else {
      // window.prompt(this.language.copyIt, keyword); //TODO
      const elementId = 'texta';
      const textField = document.createElement('textarea');
      textField.innerText = copytext;
      const parentElement = document.getElementById(elementId);
      parentElement.appendChild(textField);
      textField.select();
      document.execCommand('copy');
      parentElement.removeChild(textField);
    }
  }

  is_ie() {
    if (navigator.userAgent.toLowerCase().indexOf('chrome') !== -1) return false;
    if (navigator.userAgent.toLowerCase().indexOf('msie') !== -1) return true;
    if (navigator.userAgent.toLowerCase().indexOf('windows nt') !== -1) return true;
    return false;
  }

  handleConfirm(e) {
    this.setState({ isAll: false, isKeyword: true, addKeyword: false });
  }

  handleKeyDown(e) {
    if (e.keyCode === 13) {
      this.setState({ isAll: false, isKeyword: true, addKeyword: false });
    }
  }

  tmsLimitedPeople() {
    return (
      <ModalContainer>
        <ModalDialog>
          <TmsLimitMsg
            msg={this.state.tmsLimitMsg}
            confirm={this.handleConfirm.bind(this)}
            keyDown={this.handleKeyDown.bind(this)}
          />
        </ModalDialog>
      </ModalContainer>
    );
  }

  render() {
    let commandList =
      this.state.command.list.length > 0 ? (
        <CommandList
          profile={this.props.profile}
          command={this.state.command}
          onCommand={this.setCommandCursor}
          onSelectedCommand={this.selectCommand}
          onSelectCompany={this.setCommandCompanyCode}
          Height={this.height}
          companyCode={this.commandCompanyCode}
        />
      ) : (
        false
      );

    let mentionList =
      this.state.mention.list.length > 0 ? (
        <MentionList
          mention={this.state.mention}
          onMention={this.setMentionCursor}
          onSelectedMention={this.selectMention}
          Height={this.height}
          target={'mention'}
        />
      ) : (
        false
      );

    let spacesList =
      this.state.spacesList.list.length > 0 ? (
        <MentionList
          mention={this.state.spacesList}
          onMention={this.setSpacesListCursor}
          onSelectedMention={this.selectSpacesList}
          Height={this.height}
          target={'spacesList'}
        />
      ) : (
        false
      );

    let categoriesList =
      this.state.categoriesList.list.length > 0 ? (
        <MentionList
          mention={this.state.categoriesList}
          onMention={this.setCategoriesListCursor}
          onSelectedMention={this.selectCategoriesList}
          Height={this.height}
          target={'categoriesList'}
        />
      ) : (
        false
      );

    let tasksList =
      this.state.tasksList.list.length > 0 ? (
        <MentionList
          mention={this.state.tasksList}
          onMention={this.setTasksListCursor}
          onSelectedMention={this.selectTasksList}
          Height={this.height}
          target={'tasksList'}
          inputText={this.refs.inputbox.value}
        />
      ) : (
        false
      );

    let historyList =
      this.openHistory && this.state.history.list.length > 0 && this.state.openHistoryList ? (
        <HistoryList
          profile={this.props.profile}
          history={this.state.history}
          onHistory={this.setHistoryCursor}
          onSelectedHistory={this.selectHistory}
          Height={this.height}
        />
      ) : (
        false
      );

    let termList =
      this.props.termlist.result && this.props.termlist.result.length > 0 ? (
        <TermList
          list={this.props.termlist.result}
          onTermClick={this.onTermClick.bind(this)}
          onClose={this.onCloseMessageTerm.bind(this)}
          Height={this.height}
        />
      ) : (
        false
      );

    let translist =
      this.props.orgcontent !== false ? (
        <TransList
          typelist={this.props.transtypelist}
          content={this.props.orgcontent}
          list={this.props.transdata}
          onClose={this.onCloseTransContent.bind(this)}
          Height={this.height}
          buttonView={this.transType}
          // buttonView={true}
          inputcontent={this.messageInput.bind(this)}
        />
      ) : (
        false
      );

    if (this.props.orgcontent === false) {
      this.transType = false;
    }

    let writeList =
      this.props.writting.length > 0 && this.state.openHistoryList === false ? (
        <WrittingList writer={this.props.writting} Height={this.height} />
      ) : (
        false
      );
    let presence = this.renderPresenceList();
    let votlist = this.state.votelist.length > 0 ? this.renderVoteList() : false;
    let noticelist = this.props.channelInfo.channel_notice
      ? this.renderNoticeList(this.props.channelInfo.channel_notice, 1, true)
      : false;
    let noticelist1 = this.props.channelInfo.channel_notice1
      ? this.renderNoticeList(this.props.channelInfo.channel_notice1, 2, false)
      : false;
    let noticelist2 = this.props.channelInfo.channel_notice2
      ? this.renderNoticeList(this.props.channelInfo.channel_notice2, 3, false)
      : false;
    let noticeYn =
      this.props.infosummary.channel_set !== undefined
        ? this.props.infosummary.channel_set.NOTICEYN !== undefined
          ? this.props.infosummary.channel_set.NOTICEYN === 'Y'
            ? true
            : false
          : false
        : false;
    let fileSeting = this.language.uploadFileSetup;
    let { image } = global.CONFIG.resource;
    let modal = false;
    let isAnonymousChannel = this.props.channelInfo.channel_type === 3;
    let isHytubeChannel =
      this.props.channelInfo.sysName === 'HYTUBE'
        ? true
        : this.props.channelInfo.channel_type === 5
        ? true
        : false;
    let isHiFeedbackYn = false;
    let isHyfb = this.props.channelInfo.sysName === 'HYFB3' ? true : false;
    let isNickCheck = this.props.infosummary.nick_check === true;
    let languageType = global.CONFIG.languageType;
    let border = this.props.writting.length > 0 ? '1px solid #3bbdfe' : '';
    let isSysop =
      (this.props.channelInfo.channel_sysop_id instanceof Array &&
        this.props.channelInfo.channel_sysop_id.indexOf(this.props.profile.userID) > -1) ||
      global.CONFIG.other.isSystemAdmin === 'Y';

    let isDm = (this.props.infosummary.channel_info.channel_id + '')[0] === '5';
    let is1on1Dm =
      this.props.infosummary.channel_info.flag !== undefined &&
      this.props.infosummary.channel_info.flag !== null &&
      this.props.infosummary.channel_info.flag === 'N';
    let successorInfo =
      this.props.infosummary.successorInfo !== undefined && this.props.infosummary.successorInfo !== null
        ? this.props.infosummary.successorInfo.replace('\\\\\\n', '\n').split('\n')
        : '';

    let images = global.CONFIG.resource.botimage;
    let botimagesrc = false;

    if (this.props.botlist.length > 1) {
      botimagesrc = image + '/chat/chatbot_icon.png';
    } else if (this.props.botlist.length === 1) {
      botimagesrc = images + this.props.botlist[0].BOT_CIRCLE_IMAGE_PATH_SMALL;
    }

    if (isAnonymousChannel || isHytubeChannel) presence = false; //this.renderAnonymousNotice();
    let isIboard = false;

    if (global.externalParam) {
      let { type } = global.externalParam;
      if (type === 'Iboard' || type === 'tms' || type === 'HiFeedback') {
        isIboard = true;
      }
      if (type === 'HiFeedback') {
        isHiFeedbackYn = true;
      }
    }

    if (isHytubeChannel || isIboard) {
      presence = false;
    }

    switch (this.state.openLayerPopup) {
      case 'INVITE':
        modal = (
          <AddMember
            channel={this.props.channelInfo}
            closeModal={this.setLayerPopup.bind(this, '')}
            title={'Invite'}
            isLayer={true}
            addMemberModal={true}
          />
        );
        break;
      case 'VOTE':
        if (isAnonymousChannel || isHytubeChannel) {
          if (isNickCheck && !this.state.openPopupFlag) {
            modal = (
              <AnonymousSetting
                channelinfo={this.props.channelInfo}
                closeModal={this.setLayerAnonymousPopup.bind(this, '')}
                title={this.language.anonymousSettingLanguage}
                isLayer={true}
                //emoticon={this.props.emoticon}
                callback={this.callback}
              />
            );
            break;
          } else if (this.state.openPopupFlag) {
            modal = (
              <EditVote
                channelid={this.props.channelInfo.channel_id}
                channeltype={this.props.channelInfo.channel_type}
                closeModal={this.setLayerPopup.bind(this, '')}
                title={'VOTE'}
                isLayer={true}
              />
            );
            break;
          } else {
            modal = (
              <EditVote
                channelid={this.props.channelInfo.channel_id}
                channeltype={this.props.channelInfo.channel_type}
                closeModal={this.setLayerPopup.bind(this, '')}
                title={'VOTE'}
                isLayer={true}
              />
            );
            break;
          }
        } else {
          modal = (
            <EditVote
              channelid={this.props.channelInfo.channel_id}
              channeltype={this.props.channelInfo.channel_type}
              closeModal={this.setLayerPopup.bind(this, '')}
              title={'VOTE'}
              isLayer={true}
            />
          );
          break;
        }
      case 'ATTACH':
        modal = (
          <SelectFileCategory
            isAnonymousChannel={this.props.channelInfo.channel_type === 3}
            channelid={this.props.channelInfo.channel_id}
            messageids={this.state.messageids}
            closeModal={this.setLayerPopup.bind(this, '')}
            title={fileSeting}
            isLayer={true}
          />
        );
        break;
      case 'GIPHY':
        modal = (
          <Giphy
            closeModal={this.setLayerPopup.bind(this, '')}
            channelid={this.props.channelInfo.channel_id}
            // giphySelected={this.giphyAdd.bind(this)}
            docm_search={this.props.channelInfo.docm_search}
            doc_search={this.props.channelInfo.doc_search}
            keyword={this.giphyKeyword}
            title={this.language.BizWorksGIFSearch}
            isLayer={true}
          />
        );
        break;
      case '':
        this.giphyKeyword = '';
        break;
      case 'ANONYMOUS':
        if (isNickCheck) {
          modal = (
            <AnonymousSetting
              channelinfo={this.props.channelInfo}
              closeModal={this.setLayerAnonymousPopup.bind(this, '')}
              title={this.language.anonymousSettingLanguage}
              isLayer={true}
              callback={this.callback}
            />
          );
          break;
        }

      default:
        break;
    }

    if (this.state.messageid !== '' && this.state.count === 1) {
      let voteTitle = this.state.isopinion ? 'OPINION' : 'VOTE';
      modal = (
        <ViewVote
          title={voteTitle}
          closeModal={this.onCloseVoteModal.bind(this)}
          channelid={this.props.channelInfo.channel_id}
          messageid={this.state.messageid}
          channelinfo={this.props.channelInfo}
          isLayer={true}
        />
      );
    } else if (this.state.messageid !== '' && this.state.count > 1) {
      modal = (
        <VoteList
          title={'VOTE'}
          closeModal={this.onCloseVoteModal.bind(this)}
          channelid={this.props.channelInfo.channel_id}
          channeltype={this.props.channelInfo.channel_type}
          status={1}
          isLayer={true}
          layerFree={true}
        />
      );
    }
    let anomy = false;
    let userid = this.props.profile.userID;

    if (this.props.channelInfo.channel_sysop_id) {
      let idx = this.props.channelInfo.channel_sysop_id.findIndex((m) => m === userid);
      if (idx > -1 && (isAnonymousChannel || isHytubeChannel)) {
        anomy = true;
      }
    }
    let imgname = false;

    if (languageType === '3') {
      imgname = '/chat/chat_bot3.png';
    } else if (languageType === '4') {
      imgname = '/chat/chat_bot4.png';
    } else imgname = '/chat/chat_bot.png';

    let isChatbotTester = true; //18-06-14 배포시 챗봇버튼 허용인원
    // if (
    //   this.props.profile.deptCode === '10115722' ||
    //   this.props.profile.deptCode === '50061910' ||
    //   this.props.profile.deptCode === '50061908' ||
    //   this.props.profile.deptCode === '50061909' ||
    //   this.props.profile.deptCode === '50078282' ||
    //   this.props.profile.deptCode === '50061912' ||
    //   this.props.profile.uniqueName === 'X0104419' ||
    //   this.props.profile.uniqueName === 'I0100750' ||
    //   this.props.profile.uniqueName === 'X0005251' ||
    //   this.props.profile.uniqueName === 'X0100134' ||
    //   this.props.profile.uniqueName === 'X0100947' ||
    //   this.props.profile.uniqueName === 'X0102255' ||
    //   this.props.profile.uniqueName === 'I0100748' ||
    //   this.props.profile.uniqueName === 'I0100746' ||
    //   this.props.profile.uniqueName === 'I0100136' ||
    //   this.props.profile.uniqueName === 'I0100176' ||
    //   this.props.profile.uniqueName === 'X0007895'
    // ) {
    //   isChatbotTester = true;
    // }

    let divId = this.props.isMini ? 'chatWarpM' : 'chatWarp';
    let chatClass = this.props.isMini ? 'minichat' : 'chat';
    let isHiFeedback = false;
    let freezingAdminMessage = this.language.BizWorksFreezingAdminMessage.split('\n');

    const { channelInfo } = this.props;
    let limitSendingMsgOvertimeStr = '';
    let limitSendingMsgOvertimeStrArr = [];

    // if(channels[this.props.channelInfo.channel_id] !== undefined){
    if (
      channelInfo.limitSendingMsgOvertime !== null &&
      channelInfo.limitSendingMsgOvertime !== undefined
    ) {
      let limitSendingMsgOvertimeArr = channelInfo.limitSendingMsgOvertime.split('|');
      let startTime = limitSendingMsgOvertimeArr[0];
      let endTime = limitSendingMsgOvertimeArr[1];
      let afterTime = limitSendingMsgOvertimeArr[2];
      // resveMsgNoti20StartStr = this.language.resveMsgNoti20.replace('{STARTTIME}', startTime);
      limitSendingMsgOvertimeStr = this.language.limitSendingMsgOvertime
        .replace('{STARTTIME}', startTime)
        .replace('{ENDTIME}', endTime)
        .replace('{AFTERTIME}', afterTime);
      limitSendingMsgOvertimeStrArr = limitSendingMsgOvertimeStr.split('\\n');
    }
    // }

    if (global.externalParam) {
      let { type } = global.externalParam;
      if (type === 'HiFeedback') {
        isHiFeedback = true;
      }
    }

    return (
      <div id={divId} className={this.props.cls}>
        {!this.props.isMini ? (
          <ChatTop
            dmchannels={this.props.dmchannels}
            // mobile={this.state.mobile}
            alarm={this.state.alarm}
            channelInfo={this.props.channelInfo}
            infosummary={this.props.infosummary}
            userid={this.props.profile.userID}
            searchArea={this.onChangesearchArea}
            backgroundcolor={
              this.props.infosummary.channel_set !== undefined
                ? this.props.infosummary.channel_set.COLOR_BACK
                : '#ffffff'
            }
            //fontcolor ={this.props.infosummary.channel_set !== undefined && this.props.infosummary.channel_set.CHANNELID !== -1 ? this.props.infosummary.channel_set.COLOR_FONT : global.CONFIG.other.fontColor}
          />
        ) : (
          !isHiFeedback && (
            <MiniChatTop
              //!this.props.isHytube && <MiniChatTop // 제목삭제
              dmchannels={this.props.dmchannels}
              // mobile={this.state.mobile}
              alarm={this.state.alarm}
              channelInfo={this.props.channelInfo}
              userid={this.props.profile.userID}
              searchArea={this.onChangesearchArea}
              backgroundcolor={
                this.props.infosummary.channel_set !== undefined
                  ? this.props.infosummary.channel_set.COLOR_BACK
                  : '#ffffff'
              }
              //fontcolor ={this.props.infosummary.channel_set !== undefined && this.props.infosummary.channel_set.CHANNELID !== -1 ? this.props.infosummary.channel_set.COLOR_FONT : global.CONFIG.other.fontColor}
            />
          )
        )}

        <div className="chatCont" id="widget" style={isHiFeedback ? { top: '0px' } : {}}>
          <div
            className={chatClass}
            style={this.props.hideDetail || this.props.isMini ? { right: '0px' } : {}}
          >
            {(!isHytubeChannel || !this.props.isHytube) && presence}
            {/* <div id="scrollTarget"> */}
            {noticelist} {/*외부 iframe Hytube 에서도 채널 공지 보이도록 수정 2022-09-22*/}
            {noticeYn && noticelist1} {/*외부 iframe Hytube 에서도 채널 공지 보이도록 수정 2022-09-22*/}
            {noticeYn && noticelist2} {/*외부 iframe Hytube 에서도 채널 공지 보이도록 수정 2022-09-22*/}
            {!this.props.isHytube && votlist}
            {this.props.infosummary.isFreezing === 'true' && isSysop && (
              <div className="freezingMsg">
                <div>
                  <span>{freezingAdminMessage[0]}</span>
                  <br />
                  <span>{freezingAdminMessage[1]}</span>
                </div>
              </div>
            )}
            {this.props.infosummary.bot_notice1 && (
              <LinkParserToJsx link={this.props.infosummary} languageType={languageType} />
            )}
            {/* 202308 근태공유 1:1DM 문구추가 */}
            {isDm &&
              is1on1Dm &&
              this.props.infosummary.successorInfo !== undefined &&
              this.props.infosummary.successorInfo !== null &&
              this.props.infosummary.successorInfo !== '' && (
                <div className="freezingMsg" style={{ visibility: 'visible' }}>
                  <div>
                    <span>
                      <span>{successorInfo[0]}</span>
                      <br />
                      <span>{successorInfo[1]}</span>
                    </span>
                  </div>
                </div>
              )}
            {/* {this.props.infosummary.isFreezing === "true" && !isSysop && (
              <div className="freezingMsg">
                <div>
                  <span>
                    {this.language.BizWorksNotificationFreezingInputMsg4}
                  </span>
                  <br />
                  <span>
                    {this.language.BizWorksNotificationFreezingInputMsg5}
                  </span>
                </div>
              </div>
            )} */}
            {/* {channels[this.props.channelInfo.channel_id] !== undefined && */}
            {/* { 예약 메시지 1차 배포 제외로 인해 주석 처리 (메시지 발송 제한) 2022-08-10
              channelInfo.limitSendingMsgOvertime !== undefined && 
              channelInfo.limitSendingMsgOvertime !== null && ( 
              <div className="freezingMsg">
                <div>
                  <span>
                    {limitSendingMsgOvertimeStrArr[0]}
                  </span>
                  <br />
                  <span>
                    {limitSendingMsgOvertimeStrArr[1]}
                  </span>
                </div>
              </div>
            )} */}
            {/* </div> */}
            <div
              className="chatW"
              onDragEnter={this.onDragEnter}
              onDragOver={this.onDragOver}
              onDragLeave={this.onDragLeave}
              onDrop={this.onDrop}
            >
              <XHRUploader
                url={
                  global.CONFIG.legacy.edmsHost +
                  '/edms/servlet/ReceiveFileBwp?mode=bwp&folder_id=&ax=' +
                  global.CONFIG.login.uniquename
                }
                onCompleteUpload={this.onCompleteUpload.bind(this)}
                maxFiles={-1}
                isNoticeChannel={this.noticechannel}
              >
                <div
                  className="chatlist"
                  id="chatlist"
                  ref="chatlist"
                  //style={{ backgroundColor: this.props.infosummary.channel_set !== undefined ? this.props.infosummary.channel_set.COLOR_BACK : '#ffffff' }, {width: this.props.isHytube && (!this.props.isIboard || !this.props.isHiFeedback) ? '411px' : ''}} 2021.08.09 Iboard 메시지영역고정제외(고수진TL요청)
                  style={{
                    backgroundColor:
                      this.props.infosummary.channel_set !== undefined
                        ? this.props.infosummary.channel_set.COLOR_BACK
                        : '#ffffff',
                    width:
                      this.props.isHytube &&
                      !this.props.isIboard &&
                      !this.props.isTms &&
                      !this.props.isHiFeedback
                        ? '411px'
                        : '',
                  }}
                >
                  <div>{this.renderRecentButton()}</div>
                  {this.state.isShowTotorial && !isHiFeedback && (
                    <TutorialView
                      channelid={this.props.channelInfo.channel_id}
                      languageType={this.props.profile.languageType}
                    />
                  )}
                  <MessageList
                    channelinfo={this.props.infosummary}
                    openMessage={this.state.openMessageList}
                    channelid={this.props.channelInfo.channel_id}
                    messages={this.props.messages}
                    userid={this.props.profile.userID}
                    companycode={this.props.profile.companyCode}
                    action={this.props.action}
                    onAddMention={this.setMentionToInputBox.bind(this)}
                    openDetail={this.openDetail}
                    openPopupFlag={this.state.openPopupFlag}
                    openMessageTerm={this.openMessageTerm.bind(this)}
                    fontcolor={
                      this.props.infosummary.channel_set !== undefined &&
                      this.props.infosummary.channel_set.CHANNELID !== -1
                        ? this.props.infosummary.channel_set.COLOR_FONT
                        : global.CONFIG.other.fontColor
                    }
                  />
                </div>
                {this.state.openApp && (
                  <AppList
                    app={this.props.app}
                    profile={this.props.profile}
                    channelid={this.props.channelInfo.channel_id}
                    channelinfo={this.props.channelInfo} //추가
                    onClose={this.onCloseApp.bind(this)}
                    Height={this.height}
                  />
                )}
                {this.state.openEmoticon && (
                  <EmoticonList
                    emoticon={this.props.emoticon}
                    open={this.state.openEmoticon}
                    onClose={this.onCloseEmoticon.bind(this)}
                    emoticonSelected={this.emoticonAdd.bind(this)}
                    selectEmoticonByGropIDPC={this.selectEmoticonByGropIDPC.bind(this)}
                    Height={this.height}
                  />
                )}
                {/* 예약메시지 미적용으로 주석 처리 */}
                {/*this.state.openReservationMessage && (
                  <AddReservationMessage
                    channelInfo={this.props.channelInfo}
                    infosummary={this.props.infosummary}
                    command={this.props.command}
                    profile={this.props.profile}
                    inputbox={this.state.inputboxValue}
                    open={this.state.openReservationMessage}
                    onClose={this.onCloseReservationMessage.bind(this)}
                    />
                )*/}
                {this.state.openChat && (
                  <ChatBotList
                    botlist={this.props.botlist}
                    open={this.state.openChat}
                    onClose={this.onCloseChat.bind(this)}
                    Height={this.height}
                    chatbotselected={this.chatbotchannel.bind(this)}
                  />
                )}

                {this.state.isShowChatbotNotice && (
                  <div className="chatbotmenu" onClick={this.onCloseChatbotNotice}>
                    <div className="chatbotcontainer" ref="chatbotcontainer">
                      <img src={image + imgname} />
                    </div>
                  </div>
                )}
                {termList}
                {!(isHyfb && isHiFeedbackYn) && (
                  <div className="chatinput on" style={{ border: border }} ref="chatinput">
                    {!this.props.isMini && !(isAnonymousChannel || isHytubeChannel) && (
                      <div className="chatApp">
                        <img
                          className="app"
                          src={image + '/chat/btn-plus.png'}
                          onClick={this.onClickApp.bind(this)}
                          role="presentation"
                        />
                      </div>
                    )}
                    <div id="texta" className="texta">
                      <textarea
                        rows="2"
                        cols="20"
                        style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                        placeholder={
                          this.noticechannel
                            ? this.language.chatInputNoticeWindow
                            : this.anonymousFreezing
                            ? this.language.BizWorksFreezingMessage
                            : isAnonymousChannel || isHytubeChannel || this.props.isMini
                            ? this.language.chatInputAnnoymousWindow
                            : this.language.chatInputWindow
                        }
                        ref="inputbox"
                        onChange={this.onChangeInputBox}
                        onKeyDown={this.onKeyDownEvent}
                        onKeyUp={this.onKeyUpEvent}
                        onPaste={this.onPasteEvent}
                        disabled={this.disabled}
                      />
                      {(this.props.isHytube || isHytubeChannel) && (
                        <div className="inputBtns">
                          <img
                            src={image + '/chat/icon-vote.png'}
                            onClick={this.setLayerPopup.bind(this, 'VOTE')}
                            role="presentation"
                          />
                          <img
                            src={image + '/chat/btn-smile.png'}
                            onClick={this.onClickEmoticon.bind(this)}
                            role="presentation"
                          />
                          <img
                            src={image + '/chat/giphyIcon.png'}
                            onClick={this.setLayerPopup.bind(this, 'GIPHY')}
                            role="presentation"
                          />
                        </div>
                      )}
                      {!this.props.isMini && !isHytubeChannel && (
                        <div className="inputBtns">
                          {anomy && (
                            <img
                              src={image + '/chat/icon_cubot.png'}
                              onClick={this.addBotMessageSend.bind(this)}
                              role="presentation"
                            />
                          )}
                          {isChatbotTester && this.props.botlist.length > 0 && (
                            <img src={botimagesrc} onClick={this.onClickChatbot} role="presentation" />
                          )}
                          <img
                            src={image + '/chat/icon-trans.png'}
                            onClick={this.messgeTrans.bind(this)}
                            role="presentation"
                          />
                          <img
                            src={image + '/chat/icon-vote.png'}
                            onClick={this.setLayerPopup.bind(this, 'VOTE')}
                            role="presentation"
                          />
                          <img
                            src={image + '/chat/btn-smile.png'}
                            onClick={this.onClickEmoticon.bind(this)}
                            role="presentation"
                          />
                          <img
                            src={image + '/chat/giphyIcon.png'}
                            onClick={this.setLayerPopup.bind(this, 'GIPHY')}
                            role="presentation"
                          />
                          {/* { // 예약 메시지 부분 제외, 예약 메시지 반영 시 해당 부분 주석 처리 해제 필요 함
                          (
                            // 예약메시지 공지채널, 하이피드백채널 예약 가능하게 수정, 챗봇 과의 DM 예약 메시지 제외 22-07-11
                          (this.props.channelInfo.channel_type !== 3 && ( (this.props.channelInfo.channel_type === 0 || this.props.channelInfo.channel_type === 1 || this.props.channelInfo.channel_type === 4) && !this.disabled) &&
                          (!this.props.isHytube && !isHytubeChannel)) ||
                          (this.props.channelInfo.channel_type === undefined && this.props.channelInfo.chatbot !== true)
                          ) &&
                        <img src={image + '/chat/btn_reservation.png'} onClick={this.onClickReservationMessage.bind(this)} role="presentation" /> 
                        } */}
                        </div>
                      )}
                      {this.state.openMention && !(isAnonymousChannel || isHytubeChannel) && mentionList}

                      {this.state.openSpacesList &&
                        !(isAnonymousChannel || isHytubeChannel) &&
                        spacesList}

                      {this.state.openCategoriesList &&
                        !(isAnonymousChannel || isHytubeChannel) &&
                        categoriesList}

                      {this.state.openTasksList && !(isAnonymousChannel || isHytubeChannel) && tasksList}
                    </div>
                    {writeList}
                    {this.state.openCommand &&
                      !isAnonymousChannel &&
                      !this.props.isMini &&
                      commandList}{' '}
                    {/* 하이튜브 채널 일 시 커맨드 보이도록 수정 */}
                    {historyList}
                    {translist}
                  </div>
                )}
              </XHRUploader>
            </div>
          </div>
          {!this.props.isMini && <DetailView searchArea={this.state.searchArea} />}
          {this.renderOpenDialog()}
          {this.renderKeywordMsg()}
          {this.state.isAll === 'Y' ? this.tmsLimitedPeople() : false}
        </div>

        {modal}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    messages: state.messages,
    linkeddata: state.messages.linkedData,
    channelInfo: state.channel.infosummary.channel_info,
    infosummary: state.channel.infosummary,
    selectedId: state.uiSetting.detail_selected,
    profile: state.profile.profile,
    command: state.uiSetting.command,
    action: state.uiSetting.message_action,
    app: state.uiSetting.app,
    emoticon: state.uiSetting.emoticon,
    hideDetail: state.uiSetting.hide_detail,
    presencelist: state.channel.presenceList,
    presenceChannelId: state.channel.presenceChannelId,
    currentChannel: state.channel.currentChannel,
    closeLayerPopup: state.channel.closeLayerPopup,
    dmchannels: state.channel.dmchannels,
    explosion: state.channel.explosionchannellist,
    writting: state.messages.writting,
    termlist: state.uiSetting.termlist,
    transdata: state.uiSetting.transdata,
    orgcontent: state.uiSetting.orgcontent,
    // translist: state.uiSetting.translist,
    transtypelist: state.uiSetting.transtypelist,
    botlist: state.uiSetting.botlist,
    categorylist: state.uiSetting.categorylist,
    spacelist: state.uiSetting.spacelist,
    tasklist: state.uiSetting.tasklist,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    clickDetailTabItem: (id) => {
      dispatch(actions.clickDetailTabItem(id));
    },
    tmsListOnOff: (flag) => {
      dispatch(actions.tmsListOnOff(flag));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ChatView);
