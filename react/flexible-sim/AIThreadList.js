import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openAIPanel, clickDetailTabItem } from '../../../actions/index';
import NewWindow from 'react-new-window';
import { Provider } from 'react-redux';
import store from '../../../index.js'
import AIViewPopup from '../../popup/AIViewPopup'
import slimscroll from 'slimscroll';

class AIThreadList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpenPop : false,
      currentId : '0'
    }

    this.loadMore = this.loadMore.bind(this);
    this.onSlimscroll = this.onSlimscroll.bind(this);

    this.scrollTop = 0;
    this.isUpdate = false;
    this.listId = 'aithread';
    this.listEl = null;
    this.slimscroll = null;

    this.popHeight = 700;
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
    // if (this.scrollTop > 0) this.loadMore(userlist.length);
  }

  loadMore(listcount) {
    console.log('--------AI THREAD 리스트 업데이트------------')
    this.isUpdate = true;
  }

  openAIView=(e)=>{
    this.props.clickDetailTabItem('aiview');
    const id = e.currentTarget.getAttribute('data-id');
    this.setState({ ...this.state, currentId: id });
  }
 
  openAIPopup=(e)=>{
    e.preventDefault();
    const id = e.currentTarget.getAttribute('data-id');
    this.setState({...this.state, isOpenPop : true, currentId: id})
  }

  handlePopupClose=()=>{
    this.setState({isOpenPop : false})
  }

  render() {
    const { isOpenPop, currentId } = this.state
    const arr = Array.from({length:10}, (_, i) => i+1);
    return (
      // <div>
        <ul 
          className="list2" 
          id='aithread'
        >
          {arr.map((_, idx) => {
              return (
                <li id={idx} key={idx}
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
                  <div className="etc">
                    <span className='dm_alarm' >
                      alarmSettingClass
                    </span>
                    <span className="ppnum">
                      <i className="fa fa-user" />
                    </span>
                    <span >
                      99+
                    </span>
                  </div>
                </li>
              )})
          }

        {/* 리스트 우클릭 시 팝업 생성 */}
        {isOpenPop &&
          <NewWindow
            title="AI POPUP"
            features={{ width: 900, height: this.popHeight, left: 120, top: 80 }}
            onUnload={this.handlePopupClose}
          >
            <Provider store={store}>
              <AIViewPopup 
                onClose={this.handlePopupClose} 
                currentId={this.state.currentId}
                height={this.popHeight}
              />
            </Provider>
          </NewWindow>   
        }
        </ul>

      // </div>
    );
  }
}

export default connect(null, { openAIPanel, clickDetailTabItem })(AIThreadList);
