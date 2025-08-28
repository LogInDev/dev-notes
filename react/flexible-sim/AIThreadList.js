import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setAIQueryId, clickDetailTabItem } from '../../../actions/index';
import NewWindow from 'react-new-window';
import { Provider } from 'react-redux';
import store from '../../../index.js'
import AIView from '../chat/AIView'
import AIViewPopup from '../../popup/AIViewPopup'
import slimscroll from 'slimscroll';

class AIThreadList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      openPopups : [],
      currentId : '0',
      nextNum : 0,
      popupWin: null
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

    console.log('scrollTop--------------', this.scrollTop)
    // 필요 조건에 맞게 트리거 (예: 끝에 가까울 때만 등)
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
 
  openAIPopup=(e)=>{
    e.preventDefault();

    const { popupWindow } = this.state;
    if(popupWindow && !popupWindow.closed) {
      popupWindow.focus();
      return;
    }
    const id = e.currentTarget.dataset.id;
    this.props.setAIQueryId(id);

    this.setState((s) => ({
      openPopups: s.openPopups.indexOf(id) >= 0 ? s.openPopups : [...s.openPopups, id],
      currentId: id
    }));
  }

  closePopup = (id) => {
    this.setState((s) => ({ openPopups: s.openPopups.filter((x) => x !== id) }));
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

  handleOpen = (win) => {
    this.setState({ popupWin: win }, ()=>{
      try{
          const doc = win.document;
          const style = doc.createElement('style')
          style.textContent = `
            html, body { height: 100%; margins: 0; }
            #root, #app { height: 100%; }
          `
          doc.head.appendChild(style);
      } catch(e){
        console.error('팝업 스크롤 생성 실패 - ', e.message);
      }
    });
  };


  handlePopupUnload = () =>{
    this.setState({popupWindow: null, popon: false, open: false});
  }

  render() {
    const { openPopups, currentId, nextNum, popupWin } = this.state
    const arr = Array.from({length:10}, (_,i) => (i * nextNum)+1);
    return (
      <div style={{height:'calc(100% - 30px)'}}>
        <ul className="list2" id='aithread'>
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

        {/* 리스트 우클릭 시 팝업 생성 */}
      
// ...생략...
{openPopups.map((id, i) => (
  <NewWindow
    copyStyles
    key={id}
    title={`AI Assistant #${id}`}
    features={this.getPopupFeatures(i)}
    onOpen={(win) => this.handleOpen(id, win)}
    onUnload={() => this.handlePopupUnload(id)}
  >
    <Provider store={store}>
      <AIViewPopup
        popupId={String(id)}           // ⭐️ 팝업 고유 id 내려줌
        popupWindow={popupWindows[id]} // ⭐️ 해당 팝업 window 내려줌
        height={this.popHeight}
        isPopup={true}
        onClose={() => this.closePopup(id)}
      />
    </Provider>
  </NewWindow>
))}
      </div>
    );
  }
}

export default connect(null, { setAIQueryId, clickDetailTabItem })(AIThreadList);
