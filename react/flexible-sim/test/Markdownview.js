import React, {Component} from 'react';
import PopupBase from './PopupBase.js';
import slimscroll from 'util/slimscroll';
import * as Store from 'GlobalStore';
import { detectSource } from 'util/detectEnv';
import * as Socket from 'socket';
import airunner from '../../ajax/airunner.js';
import ReactMarkdown from 'react-markdown';

class MarkdownViewer extends Component {
  constructor(props) {
    super(props);

    let language = global.CONFIG.language || {};

    this.language = {
      moveMsg: language['BizWorksSelectCopyMessageMsg'] || '이동하실 채널을 선택하여 주세요.',
      channel: language['BizWorksChannel'] || '채널',
      chatRoom: language['DMChannel'] || '대화방',
      copyMsg: language['BizWorksSearchCopyMessageMsg'] || '해당 메세지를 복사 할 대화방을 검색하세요.',
      save: language['ButtonSave'] || '저장',
      cancel: language['ButtonCancel'] || '취소',
      close: language['ButtonClose'] || '닫기'
    };

    let paramtemp = {};
    if (this.props.location) {
      if (this.props.location.search) {
        let params = this.props.location.search.substring(1).split('&');
        params.map((param, idx) => {
          let [key, value] = param.split('=');
          paramtemp[key.toLowerCase()] = value || '';
          return true;
        });
      }
    }

    if (global.externalParam) {
      for (let key in global.externalParam) {
        paramtemp[key.toLowerCase()] = global.externalParam[key];
      }
    }

    for (let prop in this.props) {
      if (prop !== 'location') {
        paramtemp[prop.toLowerCase()] = this.props[prop];
      }
    }

    this.params = paramtemp;

    this.richMsg = '';

    const auto = detectSource();

    this.state = {
      markdownText: "로딩 중...",
      isLoading: true,
      isBrowser: !auto.isAnyWebView,
    };

    this.airunner = new airunner();
    this.onClickCancel = this.onClickCancel.bind(this);

  }

  componentDidMount(){
    let _this = this;

    _this.raf = requestAnimationFrame(() => {
      _this.slimscroll = new slimscroll({
        idSelector: '.sourceBody',
        width: '100%',
        height: '100%' 
        // ...(this.state.isBrowser ? { width: '800px' } : {width: '100%'}),
        // ...(this.state.isBrowser ? { height: '450px' } : {height: '100%'}) 
      });              
      _this.slimscroll.init();
    });

    let finalMarkdown = "해당 메시지는 마크다운 뷰어를 지원하지 않는 내용이 포함되어 있습니다. 관리자에게 문의하세요.";

    if(this.params.threadid){
      console.log('MardkdownViewer params.thread_id-------', this.params)
      const thread_id = this.params.threadid;
      const message_id = this.params.messageid;
      this.airunner.selectAIRichmessage(Number(thread_id), message_id).then((res) => {
        const rich = res.richnotification.content;
        let contentRaw = _this.transformDataToMarkdown(rich);

        if (contentRaw !== undefined && contentRaw !== null && contentRaw !== '') {
          finalMarkdown = contentRaw;
        }

        _this.setState({
          markdownText: finalMarkdown,
          isLoading: false
        });
      })
      .catch(error => {
        console.error("마크다운 데이터를 불러오는 중 오류 발생:", error);
        _this.setState({
          markdownText: "데이터를 불러오는 중 오류가 발생했습니다.",
          isLoading: false
        });
      });
    }else if(this.props.content){
      const rich = this.props.content.content;
      let contentRaw = this.transformDataToMarkdown(rich);
      if (contentRaw !== undefined && contentRaw !== null && contentRaw !== '') {
        finalMarkdown = contentRaw;
      }
      _this.setState({
        markdownText: finalMarkdown,
        isLoading: false
      });
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    try {
      new slimscroll({ destroy: true, idSelector: '.sourceBody' }).init();
    } catch (e) {}
  }

  renderHeader = () => {
    let { image } = global.CONFIG.resource;

    return (
      <header className="card-header">
        <div className="header-title-group">
          <img src={`${image}/aiassistant/markdown_title.png`} alt="Document icon" className="header-icon" />
          <h2 className="card-title">{this.props.headerTitle}</h2>
        </div>
        <button className="close-button" onClick={this.onClickCancel}>
          <img src={`${image}/aiassistant/close_btn.png`} alt="Close icon" />
        </button>
      </header>
    );
  }

  transformDataToMarkdown = (rich) =>{
    const allAggregatedChunks = [];
    const masterDedup = new Set(); 
    const normalize = (s) => {
      if (!s) return '';
      let str = String(s).trim();
      if (!str) return '';
      if (str.startsWith('||') && str.endsWith('||')) return ''; 
      return str;
    };
    const dedent = (s) => {
      const lines = s.replace(/\r/g, '').split('\n');
      const indents = lines
      .filter(l => l.trim().length)
      .map(l => l.match(/^\s*/)[0].length);
      const min = indents.length ? Math.min(...indents) : 0;
      return lines.map(l => l.slice(min)).join('\n').trim();
    };

    rich.forEach((content) => {
      let { body } = content;
      const chunks = [];
      
      body.row.forEach((row, _idx) => {
        (row.column || []).forEach(col => {
          if (col && col.type === 'label' && col.control && Array.isArray(col.control.text)) {
            col.control.text.forEach(t => {
              const n = normalize(t);
              if (n && !masterDedup.has(n)) {
                masterDedup.add(n);
                chunks.push(n);
              }
            });
          }
        });
      });

      allAggregatedChunks.push(...chunks);
    });

    return dedent(allAggregatedChunks.join('\n\n'))
      .replace(/\u00A0|\u3000/g, ' ')
      .replace(/^\s{2,}/gm, ''); 
  }

  renderBody = (idx) => {
    const { markdownText, isLoading } = this.state;
    
    if (isLoading) {
      return <div className="sourceBody">데이터를 불러오는 중...</div>;
    }

    return(
      // <main className="card-body sourceContent" style={this.state.isBrowser ? {} : {width: '100%'}}>
      // <div className="card-body sourceContent" style={{width: '100%', display: 'block'}}>
        <div className="sourceBody markdown-body" style={{height: '100%', display: 'block'}}>
          <ReactMarkdown
            children={markdownText}
            linkTarget="_blank"
            linkRel="noopener noreferrer"
          />
        </div>
      // </div>
    )
  }

  closeModal=()=> {
    if (typeof this.props.closeModal === 'function') {
      this.props.closeModal();
    }
  }

  onClickCancel(e) {
    if (window && window.external && 'CallbackWindow' in window.external) {
      window.external.CallbackWindow('PopupBrowserClose');
      
      (async function()
      {
        await CefSharp.BindObjectAsync("cefSharpAPI"); // eslint-disable-line
        cefSharpAPI.callbackWindow('PopupBrowserClose'); // eslint-disable-line
      })();
    } 
    // if (CefSharp) { // eslint-disable-line
    //   window.external.CallbackWindow('PopupBrowserClose');
      
    //   (async function()
    //   {
    //     await CefSharp.BindObjectAsync("cefSharpAPI"); // eslint-disable-line
    //     cefSharpAPI.callbackWindow('PopupBrowserClose'); // eslint-disable-line
    //   })();
    // }

    else if (typeof this.props.closeModal === 'function') {
      (async function()
      {
        await CefSharp.BindObjectAsync("cefSharpAPI"); // eslint-disable-line
        cefSharpAPI.callbackWindow('PopupBrowserClose'); // eslint-disable-line
      })();
      this.props.closeModal();
    } else {
      if (this.params.voteurl !== undefined) {
        window.location.reload();
      } 
      else{
        if (CefSharp) { // eslint-disable-line
          //   CefSharp.PostMessage(JSON.stringify('sendMessageToClose')); // eslint-disable-line
          (async function()
          {
            await CefSharp.BindObjectAsync("cefSharpAPI"); // eslint-disable-line
            cefSharpAPI.callbackWindow('PopupBrowserClose'); // eslint-disable-line
          })();
        }
      }
    }
  }

  renderFooter = () => {
    let { image } = global.CONFIG.resource;

    return(
      <footer className="card-footer">
        <div className="disclaimer">
          <img src={`${image}/aiassistant/markdown_info.png`} alt="Information icon" className="disclaimer-icon" />
          <span className="disclaimer-text">해당 답변은 AI가 생성한 답변으로, 정확하지 않을 수 있습니다.</span>
        </div>
      </footer>
    )
  }

  render() {
    let header = this.props.headerTitle ? this.renderHeader() : '';
    let body = this.renderBody();
    let footer = this.renderFooter();

    return (
      <section id="markdown-view" 
        className="markdown-view-section has-markdown" 
        style={{height:'100%'}}
      >
        <div className="markdown-view-card" style={{width:'100%', height:'100%'}}>
          {header}
          {body}
          {footer}
      </div>
    </section>
    );
  }
}

export default MarkdownViewer;
