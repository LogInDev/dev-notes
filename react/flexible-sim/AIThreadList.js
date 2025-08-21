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
  }
 
  componentDidMound(){
    document.addEventListener('slimscroll', this.onSlimscroll);
    document.addEventListener('slimscrolling', this.onSlimscrolling);

    this.initScroll();
  }

   componentWillReceiveProps(nextProps) {
    if (this.props.dmusers.searchtext !== nextProps.dmusers.searchtext) {
      this.scrollTop = 0;
      this.isUpdate = true;
    }
  }

  componentDidUpdate() {
    if (this.isUpdate) {
      this.initScroll();
      this.isUpdate = false;
    }
  }

  initScroll() {
    this.slimscroll = new slimscroll({
      height: '100%',
      idSelector: '#aithread',
      scrollTo: this.scrollTop
      // allowPageScroll: false
    });

    this.slimscroll.init();
  }

  onSlimscroll(e) {
    this.scrollTop = e.target.scrollTop;
    let { userlist, totalcount } = this.props.dmusers;
    if (!totalcount || totalcount === 0 || totalcount <= userlist.length) return;

    if (this.scrollTop > 0) this.loadMore(userlist.length);
  }

  loadMore(listcount) {
    console.log('--------AI THREAD 리스트 업데이트------------')
    this.isUpdate = true;
  }

  openAIView=(event)=>{
    this.props.clickDetailTabItem('aiview');
    const currentId = event.target.closest('li').id;
    this.setState({
      ...this.state,
      currentId : currentId
    })
    console.log('target----------', )
  }
 
  openAIPopup=(event)=>{
    event.preventDefault();
    this.setState({isOpenPop : true})
  }

  handlePopupClose=()=>{
    this.setState({isOpenPop : false})
  }

  render() {
    const { isOpenPop, currentId } = this.state
    const arr = Array.from({length:10}, (_, i) => i+1);
    return (
      <div>
        <ul className="list2" id="aithread" 
          style={{
            overflow: 'hidden', 
            width: 'auto', 
            height: '100%'
          }}
        >
          AI-THREAD
          {arr.map((_, idx) => {
              return (
                <li id={idx} key={idx}
                  onClick={this.openAIView}
                  onContextMenu={this.openAIPopup}  
                >
                  <div className="con">
                    <div className="arrow_box">channelName</div>
                      <a 
                        className={currentId === idx + '' ? 'on' : ''} title='channelName' 
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
        </ul>

        {/* 리스트 우클릭 시 팝업 생성 */}
        {isOpenPop &&
          <NewWindow
            title="AI POPUP"
            features={{ width: 900, height: 700, left: 120, top: 80 }}
            onUnload={this.handlePopupClose}
          >
            <Provider store={store}>
              <AIViewPopup onClose={this.handlePopupClose} />
            </Provider>
          </NewWindow>   
        }
      </div>
    );
  }
}

export default connect(null, { openAIPanel, clickDetailTabItem })(AIThreadList);
