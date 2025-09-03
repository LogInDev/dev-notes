import React, { Component, createRef } from 'react';
import slimscroll from 'slimscroll';
import * as Socket from '../../../socket';
import * as actions from '../../../actions';
import * as Store from 'GlobalStore';
import { connect } from 'react-redux';
import { executeSearch, hideDetailArea, clickDetailTabItem, tmsListOnOff } from '../../../actions';
import AICommandList from './autocomplete/AICommandList';
import MessageList from '../messages/MessageList';

class AIView extends Component {
  constructor(props) {
    super(props);
    let language = global.CONFIG.language || {};

    this.language = {
      copied: language['BizworksClipboardCopied'] || '클립보드에 복사되었습니다.',
    };

    this.state = {
      selectedFile: null,
      query: '',
      command: {
        list: [],
        cursor: 0,
      },
      openCommand: false
    };

    this.fileInputRef = createRef();
    this.wrapperRef = createRef();
    this.termCopyRef = createRef();

    this.loadMore = this.loadMore.bind(this);
    this.onSlimscroll = this.onSlimscroll.bind(this);
    this.openDetail = this.openDetail.bind(this);

    // ✅ 스크롤 제어/로그용
    this.listId = 'aiview';         // 실제 DOM id와 일치
    this.listEl = null;
    this.listRef = createRef();
    this.slimscroll = null;
    this.handleNativeScroll = this.handleNativeScroll.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);

    this.scrollTop = 0;
    this.isUpdate = false;
  }

  componentDidMount() {
    // DOM 참조
    this.listEl = document.getElementById(this.listId);

    if (this.listEl) {
      // slimscroll 커스텀 이벤트 (기존 유지)
      this.listEl.addEventListener('slimscroll', this.onSlimscroll);
      // ✅ native scroll 이벤트로 실시간 스크롤 로그
      this.listEl.addEventListener('scroll', this.handleNativeScroll, { passive: true });
    }

    // slimscroll 초기화
    this.initScroll();

    // ✅ 초기 렌더 직후 맨 아래로 이동
    requestAnimationFrame(() => this.scrollToBottom());

    // 단축키
    document.addEventListener('keydown', this.handleKeyDownClose);
  }

  componentWillUnmount() {
    if (this.listEl) {
      this.listEl.removeEventListener('slimscroll', this.onSlimscroll);
      this.listEl.removeEventListener('scroll', this.handleNativeScroll);
      this.listEl = null;
    }
    this.destroySlimscroll();

    document.removeEventListener('keydown', this.handleKeyDownClose);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.dmusers &&
      (prevProps.dmusers.searchtext !== (this.props.dmusers && this.props.dmusers.searchtext))
    ) {
      this.scrollTop = 0;
      this.isUpdate = true;
    }

    if (this.isUpdate) {
      this.initScroll();
      // ✅ 업데이트 후에도 하단 고정
      requestAnimationFrame(() => this.scrollToBottom());
      this.isUpdate = false;
    }
  }

  // ✅ slimscroll 초기화
  initScroll() {
    this.destroySlimscroll();

    const target = document.getElementById(this.listId);
    if (!target) return;

    this.slimscroll = new slimscroll({
      idSelector: '#aiview',
      height: 'calc(100% - 50px)',
      scrollTo: this.scrollTop, // 초기엔 0, 이후 유지
      // allowPageScroll: false,
    });

    if (typeof this.slimscroll.init === 'function') {
      this.slimscroll.init();
    }
  }

  // ✅ slimscroll 해제
  destroySlimscroll() {
    if (!this.slimscroll) return;
    if (typeof this.slimscroll.destroy === 'function') {
      this.slimscroll.destroy();
    } else if (typeof this.slimscroll.teardown === 'function') {
      this.slimscroll.teardown();
    }
    this.slimscroll = null;
  }

  // ✅ slimscroll 커스텀 이벤트 (기존 유지)
  onSlimscroll(e) {
    this.scrollTop = (e.target && e.target.scrollTop);
    const target = e.target;
    const top = target.scrollTop || 0;
    const view = target.clientHeight || target.offsetHeight || 0;
    const height = target.scrollHeight || 0;
    console.log('[AIView] (slimscroll) scroll =', { top, view, height });
  }

  // ✅ native scroll 이벤트: 실시간 값 출력
  handleNativeScroll(e) {
    const t = e.target;
    this.scrollTop = t.scrollTop || 0;
    const top = t.scrollTop || 0;
    const view = t.clientHeight || t.offsetHeight || 0;
    const height = t.scrollHeight || 0;
    console.log('[AIView] (native) scroll =', { top, view, height });
  }

  // ✅ 맨 아래로 이동
  scrollToBottom() {
    const el = this.listRef?.current || document.getElementById(this.listId);
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    this.scrollTop = el.scrollTop || 0;
    console.log('[AIView] init scrollToBottom =', {
      top: el.scrollTop, view: el.clientHeight, height: el.scrollHeight
    });
  }

  loadMore(listcount) {
    console.log('--------AI THREAD 리스트 업데이트------------');
    this.isUpdate = true;
  }

  handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'pdf' || fileExtension === 'docx') {
        this.setState({ selectedFile: file });
      } else {
        alert('PDF 또는 DOCX 파일만 업로드할 수 있습니다.');
        event.target.value = null;
      }
    }
  };

  searchQuery = () => {
    this.props.executeSearch(this.wrapperRef.current.value);
    this.setState({ query: '' });
  };

  handleKeyDown = (event) => {
    let _KEY = { ENTER: 13, ESC: 27, UP: 38, DOWN: 40, BACK: 8, TAB: 9, SPACE: 32 };
    let inputKeyCode = event.keyCode;
    let inputValue = event.target.value;
    if (inputKeyCode === _KEY.ENTER) {
      event.preventDefault();
      this.searchQuery(inputValue);
      // 새 메시지 전송 후 하단 고정하고 싶다면:
      requestAnimationFrame(() => this.scrollToBottom());
    }
    if (inputKeyCode === _KEY.ESC) {
      this.setState({ openCommand: false });
    }
  };

  // 단축키 등록
  handleKeyDownClose = (event) => {
    if (event.ctrlKey && event.key === 'e') {
      event.preventDefault();
      this.props.hideDetailArea();
    }
  };

  // Command List 이동
  setCommandCursor(_cursor) {
    let { list, cursor } = this.state.command;
    cursor = (_cursor + list.length) % list.length;
    this.setState({ ...this.state, command: { list: list, cursor: cursor } });
  }

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
    }
  }

  setCommandCompanyCode(companyCode) {
    this.commandCompanyCode = companyCode;
  }

  onChangeInputBox = (e) => {
    let _text = e.target.value;
    this.setState({ query: _text });
    this.searchCommand(_text);
  };

  searchCommand = (text) => {
    if (text.indexOf('') === 0) {
      this.setState({ openCommand: false });
    }
    if (text.indexOf('#') === 0) {
      this.setState({ openCommand: true });
    }
  };

  onContextMenuTerm = async (e) => {
    e.preventDefault();

    const ok = await this.copyTextInactiveDoc(e);

    const layer = this.termCopyRef.current;
    if (ok && layer) {
      layer.className = 'termcopylayer2 active';
      setTimeout(() => {
        if (this.termCopyRef.current) {
          this.termCopyRef.current.className = 'termcopylayer2 active fadeout';
        }
      }, 1000);
    }
    e.stopPropagation();
    const ne = e.nativeEvent;
    if (ne && typeof ne.stopImmediatePropagation === 'function') {
      ne.stopImmediatePropagation();
    }
  };

  copyTextInactiveDoc = async (e) => {
    const win = window;
    try {
      const nav = win.navigator;
      const isSecure = (typeof win.isSecureContext === 'boolean') ? win.isSecureContext : true;
      if (nav && nav.clipboard && isSecure) {
        const text = e.target && e.target.innerText ? e.target.innerText : '';
        if (!text) return;
        await nav.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.log('copyTextInactiveDoc-----', error.message);
    }
  };

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

  openDetail(messageid) {
    const store = Store.getStore();
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

  setMentionToInputBox(mention) {
    let isAnonymousChannel = this.props.channelInfo.channel_type === 3;

    if (!isAnonymousChannel) {
      this.refs.inputbox.value += mention + ' ';
      this.refs.inputbox.focus();
    }
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

  render() {
    let { image } = global.CONFIG.resource;
    const { query, selectedFile, openCommand } = this.state;
    const { setColor, queryId } = this.props;
    const { background, font } = setColor;

    let border = this.props.writting.length > 0 ? '1px solid #3bbdfe' : '';

    return (
      <div
        className={this.props.hideDetail ? 'hidden' : 'right'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '15px',
          height: '100%',
          backgroundColor: background
        }}
      >
        {/* AI Panel 상단 */}
        <div style={{ height: '5%' }}>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 'bold'
            }}
          >
            ✨AI 결과
          </span>
          <div
            style={{
              backgroundColor: '#fff',
              borderTop: '1px solid #8c8c8c',
              margin: '20px auto',
            }}
          />
        </div>

        {/* 검색 결과 및 질의 입력 */}
        <div
          className="chatW"
          style={{
            display: 'flex',
            marginTop: '10px',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: '1',
            height: '95%'
          }}
        >
          {/* 검색 결과 */}
          <div
            id="aiview"
            ref={this.listRef}     // ✅ 스크롤 DOM 참조
            className="chatlist"
            style={{
              fontSize: '15px',
              lineHeight: '1.5',
              color: font
            }}
          >
            <div onContextMenu={this.onContextMenuTerm}>
              PopupID : {queryId} <br />
            </div>
            <br />
            <div onContextMenu={this.onContextMenuTerm}>
              안녕하세요 <br />
              Pizza입니다. <br />
              무엇을 도와드릴까요? <br />
              <br />
              현재 테스트 진행중입니다.
            </div>
            <br />
            <div>{this.renderRecentButton()}</div>
            <MessageList
              channelinfo={this.props.infosummary}
              openMessage={true}
              channelid={this.props.channelInfo.channel_id}
              messages={this.props.messages}
              userid={this.props.profile.userID}
              companycode={this.props.profile.companyCode}
              action={this.props.action}
              onAddMention={this.setMentionToInputBox.bind(this)}
              openDetail={this.openDetail}
              openPopupFlag={false}
              openMessageTerm={this.openMessageTerm.bind(this)}
              fontcolor={
                this.props.infosummary.channel_set !== undefined &&
                this.props.infosummary.channel_set.CHANNELID !== -1
                  ? this.props.infosummary.channel_set.COLOR_FONT
                  : global.CONFIG.other.fontColor
              }
            />
          </div>

          {/* 복사 완료 토글 */}
          <div className="termcopylayer2 active fadeout" style={{ left: '38%', right: '0' }} ref={this.termCopyRef}>
            <span className="termcopymsg">{this.language.copied}</span>
          </div>

          {/* 입력 영역 */}
          <div className="chatinput on">
            <div className="chatApp">
              {/* 질의문 입력 및 파일 추가 */}
              <img
                className="app"
                src={image + '/chat/btn-plus.png'}
                onClick={() => this.fileInputRef.current.click()}
                role="presentation"
              />
            </div>
            <div id="texta" className="texta">
              <input
                type="file"
                accept=".pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={this.handleFileChange}
                ref={this.fileInputRef}
                style={{ display: "none" }}
              />
              {selectedFile && (
                <div>선택된 파일: {selectedFile.name}</div>
              )}
              <textarea
                ref={this.wrapperRef}
                rows="2"
                cols="20"
                style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: 'calc(100% - 40px)' }}
                placeholder="검색어를 입력하세요"
                name="queryInput"
                value={query}
                onChange={this.onChangeInputBox}
                onClick={(e) => e.preventDefault()}
                onKeyDown={this.handleKeyDown}
              />
              <div
                className="inputBtns"
                onClick={() => {
                  this.searchQuery();
                  // 버튼 클릭 전송 후 하단 고정
                  requestAnimationFrame(() => this.scrollToBottom());
                }}
                style={{
                  fontSize: '18px',
                  paddingTop: '4px',
                }}
              >
                <i className="icon-magnifier" />
              </div>
            </div>
            {openCommand && (
              <AICommandList
                profile={this.props.profile}
                command={this.props.command}
                onCommand={this.setCommandCursor}
                onSelectedCommand={this.selectCommand}
                onSelectCompany={this.setCommandCompanyCode}
                Height={this.height}
                companyCode={this.props.profile.companyCode}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    hideDetail: state.uiSetting.hide_detail,
    setColor: state.aiAssistant.color,
    queryId: state.aiAssistant.queryId,
    command: state.uiSetting.command,
    profile: state.profile.profile,
    writting: state.messages.writting,
    messages: state.messages,
    channelInfo: state.channel.infosummary.channel_info,
    infosummary: state.channel.infosummary,
    action: state.uiSetting.message_action,
  };
};

export default connect(
  mapStateToProps,
  { executeSearch, hideDetailArea, clickDetailTabItem, tmsListOnOff }
)(AIView);