import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { executeSearch } from '../../actions';
import AICommandList from '../views/chat/autocomplete/AICommandList'

const defaultProps = {
  isPopup: false,
  setColor: { background: '#fff', font: '#111' },
  height: '95%',
};

class AIViewPopup extends Component {
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

    this.aiviewRef = createRef();
    this.fileInputRef = createRef();
    this.wrapperRef = createRef();
    this.termCopyRef = createRef(); 

    this.isFirst = true;
    this.scrollBottom = -1;
    this.scrollTop = -1;
    this.preScroll = -1;
    this.preScrollBottom = -1;
    this.preScrollTop = -1;
    this.prevScrollHeight = -1;
    this.precurrentScrollTop = -1;
    this.isModify = false;

    this._onScroll = this._onScroll.bind(this);
    this._bootstrapFromClick = this._bootstrapFromClick.bind(this);
    this.moveScroll = this.moveScroll.bind(this);
    this.initScrollParam = this.initScrollParam.bind(this);
  }

  componentDidMount() {
    this.attachScrollFromPopupWindow();

    if (!this._scrollEl) {
      this._retry1 = requestAnimationFrame(() => {
        this.attachScrollFromPopupWindow();
        if (!this._scrollEl) this._retry2 = requestAnimationFrame(() => this.attachScrollFromPopupWindow());
      });
    }
  }

  componentWillUnmount() {
    if (this._scrollEl) this._scrollEl.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('click', this._bootstrapFromClick, true);
    cancelAnimationFrame && cancelAnimationFrame(this._retry1);
    cancelAnimationFrame && cancelAnimationFrame(this._retry2);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.popupId !== this.props.popupId ) {
      this.scrollBottom = 0;
      this.scrollTop = -1;
      this.initScrollParam();

      this.detachScroll();
      this.attachScrollFromPopupWindow(this.props.popupId);
    }
  }

  detachScroll() {
    if (this._scrollEl) this._scrollEl.removeEventListener('scroll', this._onScroll);
    this._scrollEl = null;
  }

  attachScrollFromPopupWindow(p = this.props) {
    const { popupWindow, popupId } = p;
    const refEl = this.aiviewRef.current;
    if (!popupWindow || popupWindow.closed) return;

    const doc = popupWindow.document;
    
    const el = doc.getElementById('aiviewMsg-' + popupId) || refEl;
    if (!el) return;

    this._doc = doc;
    this._win = doc.defaultView;
    this._scrollEl = el;

    console.log('[AIViewPopup] bind in popup?', this._doc !== window.document, 'id=', 'aiviewMsg-' + popupId);

    this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
    this._scrollEl.scrollTop = this._scrollEl.scrollHeight;
  }

  _bootstrapFromClick(e) {
    if (this._doc && this._scrollEl) {
      window.removeEventListener('click', this._bootstrapFromClick, true);
      return;
    }
    const doc = e.target && e.target.ownerDocument;
    console.log('ownerDocument---------', doc)
    if (!doc || doc === window.document) return;

    const el = doc.getElementById('aiviewMsg-' + this.props.popupId);
    if (!el) return;

    this._doc = doc;
    this._win = doc.defaultView;
    this._scrollEl = el;
    this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
    this._scrollEl.scrollTop = this._scrollEl.scrollHeight;

    console.log('[AIViewPopup] bootstrapped via click. popup?', this._doc !== window.document);
    window.removeEventListener('click', this._bootstrapFromClick, true);
  }

  _onScroll(e) {
    const target = this._scrollEl || e.currentTarget || e.target;
    const top = target.scrollTop || 0;
    const view = target.clientHeight || target.offsetHeight || 0;
    const height = target.scrollHeight || 0;

    console.log('[AIViewPopup]', this.props.popupId, 'scroll =', { top, view, height });

    if (top === 0) {
      // loadPrev()
    } else if (Math.round(top + view) >= height) {
      // loadNext()
    }
  }

  getScrollEl() {
    return this._scrollEl || this.aiviewRef.current || null;
  }

  initScrollParam() {
    this.preTop = undefined;
    this.preBottom = undefined;
  }

  moveScroll(height) {
    const node = this.getScrollEl();
    if (!node) return;
    node.scrollTop = typeof height === 'number' ? height : node.scrollHeight;
    this.prevScrollHeight = node.scrollHeight;
    this.precurrentScrollTop = node.scrollTop;
    if (this.isFirst) this.isFirst = false;
    this.scrollBottom = -1;
    this.scrollTop = -1;
  }

  handleFileChange = (event) =>{
    const file = event.target.files[0];
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

  searchQuery = () => {
    const v = (this.state.query || '').trim();
    if (!v) return;
    this.props.executeSearch(v);
    this.setState({ query: '' });
  };

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

  onChangeInputBox = (e) =>{
    let _text = e.target.value; 
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
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
      e.nativeEvent.stopImmediatePropagation();
    }

    const copytext = e.target && e.target.innerText ? e.target.innerText : '';
    if(!copytext) return;

    const ok = await this.copyTextInactiveDoc(copytext, e);

    const layer = this.termCopyRef.current;
    if(ok && layer && copytext){
      layer.className = 'termcopylayer2 active';
      setTimeout(() => {
        if (this.termCopyRef.current) {
          this.termCopyRef.current.className = 'termcopylayer2 active fadeout';
        }
      }, 1000);
    }
  }

  copyTextInactiveDoc = async (text, e) =>{
    const doc = (e && e.target && e.target.ownerDocument) || this._doc || document;
    const win =  doc.defaultView || window;

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

  render() {
    let { image } = global.CONFIG.resource;
    const { query, selectedFile, openCommand } = this.state;
    const { height, popupId } = this.props;

    return (
      <div id="root" data-allow-copy-toast>
        <div
          className={'right' }
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '15px',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#fff'
          }}
        >
          <div style={{ height: '5%' }}>
            <span style={{ fontSize: 15, fontWeight: 'bold' }}>✨AI 결과</span>
            <div style={{ backgroundColor: '#fff', borderTop: '1px solid #8c8c8c', margin: '20px auto' }} />
          </div>

           <div
            className="chatW"
            style={{
              display: 'flex',
              marginTop: 10,
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: 1,
              height: height - 55 + 'px'
            }}
          >
            <div
              ref={this.aiviewRef}
              id={`aiviewMsg-${popupId}`}       
              className="aiview"
              style={{
                fontSize: 15,
                lineHeight: 1.5,
                color: '#111',
                height: '86%',
                overflowY: 'auto',
              }}
            >
              <div onContextMenu={this.onMouseDownTerm}>
                PopupID : {popupId} <br />
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

            <div className="termcopylayer2 active fadeout" ref={this.termCopyRef}>
              <span className="termcopymsg">{this.language.copied}</span>
            </div>

            <div className="chatinput on" >
              <div className="chatApp">
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
      </div>
    );
  }
}

AIViewPopup.defaultProps = defaultProps;

const mapStateToProps = (state) => ({
  hideDetail: state.uiSetting.hide_detail,
  setColor: state.aiAssistant.color,
});
export default connect(mapStateToProps, { executeSearch })(AIViewPopup);