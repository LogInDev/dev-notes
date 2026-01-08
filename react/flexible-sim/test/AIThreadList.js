import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { clickDetailTabItem, deleteAIThread, closeAIThread, closeAIThreadPopup } from '../../../actions';
import NewWindow from 'react-new-window';
import { Provider } from 'react-redux';
import AssistantPopup from '../../popup/AssistantPopup.js'
import slimscroll from 'slimscroll';
import * as Socket from 'socket';
import * as Store from 'GlobalStore'
import AIThreadItem from './AIThreadItem';

class AIThreadList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      nextNum : 0,
    }

    this.scrollTop = 0;
    this.isUpdate = false;
    this.listId = 'aithread';
    this.listEl = null;
    this.slimscroll = null;

    this.popHeight = 700;
    this.popWidth = 900;

    this.aithread = createRef();
  }
 
  componentDidMount(){
    this.initScroll();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.searchtext !== this.props.searchtext) {
      this.scrollTop = 0;
      this.isUpdate = true;
    }

    if (this.isUpdate) {
      this.initScroll();
      this.isUpdate = false;
    }
  }

  componentWillUnmount() {
    // this.destroySlimscroll();
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
    this.slimscroll.init({ destroy: true });
    
    this.slimscroll = null;
  }

  updateList() {
    Socket.getApi().selectAIThreadList();
  }

  deleteAIThread = (threadId) =>{
    const { openPopups } = this.state;
debugger;
    // this.props.deleteAIThread(threadId);
    console.log('===deleteAIThread======', threadId)
    console.log('===deleteAIThread======', openPopups)
    console.log('===deleteAIThread======', openPopups.find(id => threadId === id))
    if(openPopups.find(id => threadId === id)){
      this.porps.closePopup(threadId)
    }
    
    Socket.getApi().requestAiThreadlDelete(threadId);
  }

  render() {
    let { filterList } = this.props;
    let { dmchannels } = this.props.aiThread;
    let aithreadlist;

    if (filterList.length > 0) {
      aithreadlist = filterList.map((filter, idx) => {
        let _selected = this.props.aiThread.currentChannel + '' === filter.channel_id + '';
        return (
          <AIThreadItem
            data={filter}
            selectedChannel={_selected}
            onOpenUnreadMessage={this.props.onOpenUnreadMessage}
            currentUserName={this.props.profile.nameLang}
            deleteThread={this.deleteAIThread}
            key={filter.channel_id+'_'+idx}
            threadId={filter.channel_id}
            searchFlag={false}
            searchtext={this.props.searchtext}
            closeModal={this.props.closeModal}
            openThreadPopup={this.props.openAssistantPopup}
            closePopup={this.props.closePopup}
          />
        );
      });
    } else if (!this.props.isSearchAINoData) {
      aithreadlist = dmchannels.map((aithread, idx) => {
        if (aithread !== undefined) {
          let _selected = this.props.aiThread.currentChannel + '' === aithread.channel_id + '';

          return (
            <AIThreadItem
              data={aithread}
              selectedChannel={_selected}
              onOpenUnreadMessage={this.props.onOpenUnreadMessage}
              searchFlag={false}
              currentUserName={this.props.profile.nameLang}
              searchtext={this.props.searchtext}
              closeModal={this.props.closeModal}
              deleteThread={this.props.deleteAIThread}
              key={aithread.channel_id+'_'+idx}
              threadId={aithread.channel_id}
              openThreadPopup={this.props.openAssistantPopup}
              closePopup={this.props.closePopup}
            />
          );
        }
      });
    }

    return (
      <div style={{height:'calc(100% - 30px)'}}>
        <ul className="list2" id='aithread' ref={this.aithread}>
          {aithreadlist}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    threadList: state.aiThread.dmchannels,
    detailSelected: state.uiSetting.detail_selected,
    currentThreadId: state.aiThread.currentChannel,
    openedThreads: state.aiThread.currentThreads,
  };
};

export default connect(mapStateToProps, { clickDetailTabItem, deleteAIThread, closeAIThread, closeAIThreadPopup })(AIThreadList);
