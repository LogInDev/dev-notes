import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setAIQueryId, clickDetailTabItem } from '../../../actions/index';
import NewWindow from 'react-new-window';
import { Provider } from 'react-redux';
import store from '../../../index.js'
import AIViewPopup from '../../popup/AIViewPopup'
import slimscroll from 'slimscroll';

class AIThreadList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      openPopups : [],
      currentId : '0',
      nextNum : 0,
      popupWindow: {}
    }

    this.loadMore = this.loadMore.bind(this);
    this.onSlimscroll = this.onSlimscroll.bind(this);

    this.scrollTop = 0;
    this.isUpdate = false;
    this.listId = 'aithread';
    this.listEl = null;
    this.slimscroll = null;

    this.popHeight = 700;
    this.popWidth = 900;
    
  }
 
  componentDidMount(){
    this.listEl = document.getElementById(this.listId);
    if (this.listEl) {
      this.listEl.addEventListener('slimscroll', this.onSlimscroll);
    }
    this.initScroll();
  }

  componentWillUnmount() {
    if (this.listEl) {
      this.listEl.removeEventListener('slimscroll', this.onSlimscroll);
      this.listEl = null;
    }
    this.destroySlimscroll();
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
      idSelector : '#aithread',             
      height: '100%',      
      scrollTo: this.scrollTop,
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
    if (this.scrollTop > 224) this.loadMore(10);
  }

  loadMore(listcount) {
    console.log('--------AI THREAD 리스트 업데이트------------')
    this.setState({nextNum:listcount})
    this.isUpdate = true;
  }

  openAIView=(e)=>{
    this.props.clickDetailTabItem('aiview');
    
    const id = e.currentTarget.dataset.id;
    this.props.setAIQueryId(id);
    this.setState({ currentId: id });
  }
 
  openAIPopup = (e) => {
  e.preventDefault();
  e.stopPropagation();

  const id = String(e.currentTarget.dataset.id);

  // 이미 열려있으면 포커스
  const win = this.state.popupWindow[id];
  if (win && !win.closed) {
    try { win.focus(); } catch (err) { console.error('openAIPopup focus', err.message); }
    return;
  }

  // 우클릭 이벤트가 완전히 끝난 다음에 팝업을 열도록 다음 틱으로 미룸
  // 그리고 "초기 컨텍스트메뉴 무시" 타임스탬프를 같이 넘길 준비
  const SUPPRESS_MS = 300;
  const suppressUntil = Date.now() + SUPPRESS_MS;

  // 상태 변경은 즉시 하고, 렌더링-포털 연결은 다음 프레임에서
  this.props.setAIQueryId(id);
  this.setState((s) => ({
    openPopups: s.openPopups.indexOf(id) >= 0 ? s.openPopups : [...s.openPopups, id],
    currentId: id,
    __suppressUntil: { ...(s.__suppressUntil || {}), [id]: suppressUntil }
  }), () => {
    // 아무 것도 안 해도 되지만, 필요하다면 requestAnimationFrame 한 번 더
    // requestAnimationFrame(() => {});
  });
};

  closePopup = (id) => {
    this.setState((s) => {
      const win = s.popupWindow[id];
      if (win && !win.closed) {
        try { 
          win.close(); 
        } catch(e) {
          console.error('closePopup---------', e.message)
        }
      }
      const nextMap = { ...s.popupWindow };
      delete nextMap[id];
      return {
        popupWindow: nextMap,
        openPopups: s.openPopups.filter((x) => x !== id),
      };
    });
  };

  getPopupFeatures = (index) => {
    const baseLeft = 120;
    const baseTop = 80;
    const step = 30;
    return {
      width: this.popWidth,
      height: this.popHeight,
      left: baseLeft + index * step,
      top: baseTop + index * step,
      menubar: 'no', 
      toolbar: 'no'
    };
  };

  handleOpen = (id, win) => {
  this.setState((s) => ({
    popupWindow: { ...s.popupWindow, [id]: win },
  }), () => {
    try {
      const doc = win.document;
      const stylesheets = [
        '/css/lineico/simple-line-icons.css',
        '/css/reset.css',
        '/css/style.css',
      ];
      stylesheets.forEach(url => {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        doc.head.appendChild(link);
      });

      // ★ 팝업 문서에 "초기 contextmenu 무시" 타임스탬프 주입
      const suppressUntil =
        (this.state.__suppressUntil && this.state.__suppressUntil[id]) || (Date.now() + 250);
      win.__suppressContextMenuUntil = suppressUntil;

      // 안전하게 타임아웃 지나면 플래그 해제
      setTimeout(() => {
        try { win.__suppressContextMenuUntil = 0; } catch(_) {}
      }, Math.max(0, suppressUntil - Date.now() + 50));
    } catch (e) {
      console.error('팝업 스타일/플래그 주입 실패:', e.message);
    }
  });
};


  handlePopupUnload = (id) =>{
    this.setState((s) => {
      const nextMap = { ...s.popupWindow };
      delete nextMap[id];
      return {
        popupWindow: nextMap,
        openPopups: s.openPopups.filter((x) => x !== id),
      };
    });
  }

  render() {
    const { openPopups, currentId, nextNum, popupWindow } = this.state
    const arr = Array.from({length:10}, (_,i) => (i * nextNum)+1);
    return (
      <div style={{height:'calc(100% - 30px)'}}>
        <ul
          className="list2"
          id='aithread'
          data-no-copy-toast
          onContextMenuCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
              e.nativeEvent.stopImmediatePropagation();
            }
          }}
        >
          {arr.map((_, idx) => {
              return (
                <li data-id={idx} key={idx}
                  onClick={this.openAIView}
                  onContextMenu={this.openAIPopup}  
                >
                  <div className="con">
                    <div className="arrow_box">channelName</div>
                      <a 
                        className={currentId === String(idx) ? 'on' : ''} title='channelName' 
                      >
                        <span>channelName - {idx}</span>
                        <span>data.last_message</span>
                      </a>
                  </div>
                </li>
              )})
          }
        </ul>

        {openPopups.map((id, i) => (
          <NewWindow
            key={id}
            title={`AI Assistant #${id}`}
            features={this.getPopupFeatures(i)}
            onUnload={() => this.handlePopupUnload(id)}
            onOpen={(win) => this.handleOpen(id, win)}  
          >
            <Provider store={store}>
              <AIViewPopup 
                popupId={String(id)}
                popupWindow={popupWindow[id]}
                height={this.popHeight}
                onClose={() => this.closePopup(id)} 
              />
            </Provider>
          </NewWindow>  
        ))
      }

      </div>
    );
  }
}

export default connect(null, { setAIQueryId, clickDetailTabItem })(AIThreadList);