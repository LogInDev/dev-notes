  openAIThread(threadid, findid, type, callback) {
    let _this = this;
    let store = Store.getStore();

    _this.apihandler.getAIThreadInfoSummary(threadid, (msg) => {
      _this.onGetThreadInfoSummary(threadid, msg);
      let threadMove = true;
      console.log('getAIThreadInfoSummary====findid======', findid)
      console.log('getAIThreadInfoSummary====msg======', msg.unread_message_id )
      console.log('getAIThreadInfoSummary====msg======', msg.unread_message_id )
      if (findid) {
        _this.selectAIMessageList('FIND', findid, threadMove, threadid);
      } else if (msg.unread_message_id !== '-1') {
        _this.selectAIMessageList('FIND', msg.unread_message_id, threadMove, threadid);
      } else {
        _this.apihandler.getAIThreadMessages(threadid, _this.onGetAIThreadMessages.bind(_this));
      }
      if(typeof callback === 'function') callback();
      if(type === 'panel'){
        store.dispatch(actions.setAiThreadTab(true));
        store.dispatch(actions.clickDetailTabItem('assistant'));
      }
      _this.airunner.requestAIStatus(threadid,(msg)=>{
        if(msg.status === 'W'){
          store.dispatch(actions.setLoading(true, threadid));
        }else{
          store.dispatch(actions.setLoading(false, threadid));
        }
      })
      // writting 초기화 추가
      // store.dispatch(actions.deleteWriting(msg));
    });
    _this.apihandler.openAIThread(threadid, _this.callbackAIThreadMessage.bind(_this));

    _this.apihandler.unreadAIThreadMessageCount((msg) => {
      store.dispatch(actions.unreadAIThreadMessageCount(msg));
    });

    store.dispatch(actions.initThreadUnread(threadid));
  }
