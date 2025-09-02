import React, {Component, createRef} from 'react';
import slimscroll from 'slimscroll';
import { connect } from 'react-redux';
import { executeSearch, hideDetailArea } from '../../../actions';
import AICommandList from './autocomplete/AICommandList';

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
    }

    this.fileInputRef = createRef();
    this.wrapperRef = createRef();
    this.termCopyRef = createRef(); // 문자열 ref 제거

    this.loadMore = this.loadMore.bind(this);
    this.onSlimscroll = this.onSlimscroll.bind(this);

    this.scrollTop = 0;
    this.isUpdate = false;
    this.listId = 'aithread';
    this.listEl = null;
    this.slimscroll = null;
  }

  componentDidMount(){
    this.listEl = document.getElementById(this.listId);
    if (this.listEl) {
      this.listEl.addEventListener('slimscroll', this.onSlimscroll);
    }
    this.initScroll();

    document.addEventListener('keydown', this.handleKeyDownClose);
  }

  componentWillUnmount() {
    if (this.listEl) {
      this.listEl.removeEventListener('slimscroll', this.onSlimscroll);
      this.listEl = null;
    }
    this.destroySlimscroll();

    document.removeEventListener('keydown', this.handleKeyDownClose);

  }

  componentDidUpdate(prevProps) {
    if (prevProps.dmusers 
      && (prevProps.dmusers.searchtext !== 
          (this.props.dmusers && this.props.dmusers.searchtext))) {
      this.scrollTop = 0;
      this.isUpdate = true;
    }

    if (this.isUpdate) {
      this.initScroll();
      this.isUpdate = false;
    }
  }

  initScroll() {
    this.destroySlimscroll();

    const target = document.getElementById(this.listId);
    if (!target) return;

    this.slimscroll = new slimscroll({
      idSelector : '#aiview',             
      height: 'calc(100% - 50px)',      
      scrollTo: this.scrollTop,
      // allowPageScroll: false,
    });

    if (typeof this.slimscroll.init === 'function') {
      this.slimscroll.init();
    }
  }

  destroySlimscroll() {
    if (!this.slimscroll) return;
    if (typeof this.slimscroll.destroy === 'function') {
      this.slimscroll.destroy();
    } else if (typeof this.slimscroll.teardown === 'function') {
      this.slimscroll.teardown();
    }
    this.slimscroll = null;
  }

  onSlimscroll(e) {
    this.scrollTop = (e.target && e.target.scrollTop) ;

    // 필요 조건에 맞게 트리거 (예: 끝에 가까울 때만 등)
    // if (this.scrollTop > 0) this.loadMore(userlist.length);
  }

  loadMore(listcount) {
    console.log('--------AI THREAD 리스트 업데이트------------')
    this.isUpdate = true;
  }

  handleFileChange = (event) =>{
    const file = event.target.files[0]; // 선택된 파일 가져오기
    if (file) {
      console.log('선택된 파일:', file);
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'pdf' || fileExtension === 'docx') {
        console.log('PDF 또는 DOCX 파일입니다:', file);
        this.setState({ selectedFile: file });
      } else {
        alert('PDF 또는 DOCX 파일만 업로드할 수 있습니다.');
        event.target.value = null;
      }
    }
  }

  searchQuery = () =>{
    this.props.executeSearch(this.wrapperRef.current.value);
    this.setState({query:''})
  }

  handleKeyDown = (event) => {
    let _KEY = { ENTER: 13, ESC: 27, UP: 38, DOWN: 40, BACK: 8, TAB: 9, SPACE: 32 };
    let inputKeyCode = event.keyCode;
    let inputValue =  event.target.value
    if (inputKeyCode === _KEY.ENTER) {
      event.preventDefault();
      this.searchQuery(inputValue); 
    }
    if (inputKeyCode === _KEY.ESC) {
      this.setState({
        openCommand: false,
      });
    }
  }

  // 단축키 등록
  handleKeyDownClose = (event) => {
    if(event.ctrlKey && event.key === 'e'){
      event.preventDefault();
      this.props.hideDetailArea();
    }
  }

  // Command List
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

      // if(selectedCommand.command === 'Hygpt'){
      //   this.props.clickDetailTabItem('hygpt');
      // }
    }
  }

  setCommandCompanyCode(companyCode) {
    this.commandCompanyCode = companyCode;
    // this.searchCommand(this.refs.inputbox.value);
  }

  onChangeInputBox = (e) =>{
    let _text = e.target.value; 
    console.log('input변동----', _text)
    this.setState({ query: _text});
    this.searchCommand(_text);
  }

  searchCommand = (text) =>{
    if(text.indexOf('') === 0){
      this.setState({ openCommand: false});
    }
    if(text.indexOf('#') === 0){
      this.setState({ openCommand: true});
    }
  }

  onMouseDownTerm = async (e) => {
    e.preventDefault()
    // let rightclick;
    // if (e.which) rightclick = e.which === 3;
    // else if (e.button) rightclick = e.button === 2;

    // if(!rightclick) return;

    console.log('copy된거 -------', e.target)
    const copytext = e.target && e.target.innerText ? e.target.innerText : '';
    console.log('copy된거 -------', copytext)
    if(!copytext) return;

    // let textarea = document.createElement('textarea');
    // textarea.textContent = copytext;
    // document.body.appendChild(textarea);

    // let selection = document.getSelection();
    // let range = document.createRange();
    // range.selectNode(textarea);

    // selection.removeAllRanges();
    // selection.addRange(range);

    // // console.log('copy success', document.execCommand('copy'));
    // document.execCommand('copy');
    // selection.removeAllRanges();

    // document.body.removeChild(textarea);
    

    const ok = await this.copyTextInactiveDoc(copytext, e);
    // 같은 문서에 렌더된 토스트를 표시
    const layer = this.termCopyRef.current;
    if(ok && layer && copytext){
      layer.className = 'termcopylayer2 active';
      setTimeout(() => {
        if (this.termCopyRef.current) {
          console.log('우클릭 팝업')
          this.termCopyRef.current.className = 'termcopylayer2 active fadeout';
        }
      }, 1000);
    }
  }

  copyTextInactiveDoc = async (text, e) =>{
    console.log('copyu====defaultView : ', document.defaultView )
    console.log('copyu====window : ', window )
    const win = window;

    try{
      const nav = win.navigator;
      const isSecure = (typeof win.isSecureContext === 'boolean') ? win.isSecureContext : true;
      if(nav && nav.clipboard && isSecure){
        await nav.clipboard.writeText(text);
        return true;
      }
    }catch(error){
      console.log('copyTextInactiveDoc-----', error.message)
    }
  }

  render(){
    let { image } = global.CONFIG.resource;
    const { query, selectedFile, openCommand } = this.state;
    const { setColor, queryId } = this.props
    const { background, font } = setColor;

    let border = this.props.writting.length > 0 ? '1px solid #3bbdfe' : '';



    return(
          <div className={this.props.hideDetail ? 'hidden' :'right' }
            style={{
              display : 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              padding: '15px',
              height: '100%',
              backgroundColor: background  // 설정으로 변경
            }}
          >
            {/* AI Panel 상단 */}
              <div style={{height:'5%'}}>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 'bold'
                  }}
                >✨AI 결과 </span>
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderTop: '1px solid #8c8c8c',
                    margin: '20px auto',
                  }}
                />
              </div>
            {/* 검색 결과 및 질의 입력*/}
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
                  id='aiview'
                  style={{
                    fontSize:'15px',
                    lineHeight: '1.5',
                    color: font // 설정으로 변경
                  }}>
                  <div 
                    // onContextMenu={(e) => e.preventDefault()} onMouseDown={this.onMouseDownTerm}
                    onContextMenu={this.onMouseDownTerm}
                  >
                  PopupID : {queryId} <br />
                  </div>
                  <br />
                  <div onContextMenu={this.onMouseDownTerm}>
                  안녕하세요 <br />
                  Pizza입니다. <br />
                  무엇을 도와드릴까요? <br />
                  <br />
                  현재 테스트 진행중입니다.
                  </div>
                  <br />
                  {Array.from({ length: 80 }).map((_, i) => 
                  <div 
                    onContextMenu={this.onMouseDownTerm}
                    key={i}
                  >
                    row {i + 1}
                  </div>)}
                </div>  

              {/* 복사 완료 토글 */}
              <div className="termcopylayer2 active fadeout" style={{left:'38%', right:'0'}} ref={this.termCopyRef}>
                <span className="termcopymsg">{this.language.copied}</span>
              </div>

              {/* 입력 영역 */}
                {/* 사용자가 참여한 채널 리스트 */}
                <div className="chatinput on" >
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
                      style={{display:"none"}}
                    />   
                    {selectedFile && (
                        <div>선택된 파일: {selectedFile.name}</div> 
                      )}
                      <textarea
                            ref={this.wrapperRef}
                            rows="2"
                            cols="20"
                            style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: 'calc(100% - 40px)' }}
                            placeholder='검색어를 입력하세요' 
                            name="queryInput"
                            value={query}
                            onChange={this.onChangeInputBox}
                            onClick={(e) => e.preventDefault()}
                            onKeyDown={this.handleKeyDown}
                      />
                      <div className="inputBtns" onClick={this.searchQuery}>
                        <i className="icon-magnifier" />
                      </div>
                  </div>
                  {openCommand &&
                    <AICommandList
                    profile={this.props.profile}
                    command={this.props.command}
                    onCommand={this.setCommandCursor}
                    onSelectedCommand={this.selectCommand}
                    onSelectCompany={this.setCommandCompanyCode}
                    Height={this.height}
                    companyCode={this.props.profile.companyCode}
                  />}
                </div>
              </div>
          </div>              
      )
  }
}

const mapStateToProps = (state) => {
  return {
    hideDetail: state.uiSetting.hide_detail,
    setColor: state.aiAssistant.color,
    queryId: state.aiAssistant.queryId,
    // command 추가
    command: state.uiSetting.command,
    profile: state.profile.profile,
    writting: state.messages.writting,
  };
};

export default  connect(mapStateToProps, { executeSearch, hideDetailArea })(AIView);
